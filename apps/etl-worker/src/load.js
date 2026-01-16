const { prisma } = require('@mapatur/database');
const { logger } = require('@mapatur/logger');

// ============================================================================
// LOAD - Carregamento de dados para staging
// ============================================================================

/**
 * Carrega dados transformados para a tabela STAGING_Info_Origem
 * Usa UPSERT baseado em id_origem para sincronização incremental
 */
async function loadToStaging(records) {
  logger.info('Starting load to staging', {
    records_to_load: records.length,
  });
  
  let loaded = 0;
  let failed = 0;
  const BATCH_SIZE = parseInt(process.env.ETL_BATCH_SIZE) || 1000;
  
  // Processar em lotes para otimizar performance
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    
    try {
      await loadBatch(batch);
      loaded += batch.length;
      
      logger.info('Batch loaded to staging', {
        batch_number: Math.floor(i / BATCH_SIZE) + 1,
        records_loaded: loaded,
        total_records: records.length,
      });
      
    } catch (error) {
      logger.error('Batch load failed', {
        batch_number: Math.floor(i / BATCH_SIZE) + 1,
        error: error.message,
      });
      failed += batch.length;
    }
  }
  
  logger.info('Load to staging completed', {
    total_records: records.length,
    loaded,
    failed,
  });
  
  return { loaded, failed };
}

/**
 * Carrega um lote de registros usando transação
 * PROTEÇÃO: Não sobrescreve registros já validados
 */
async function loadBatch(batch) {
  // Usar transação para garantir atomicidade
  await prisma.$transaction(async (tx) => {
    for (const record of batch) {
      try {
        // Verificar se o registro já existe
        const existingRecord = await tx.sTAGING_Info_Origem.findFirst({
          where: {
            nome_medico_bruto: record.nome_medico_bruto,
            nome_unidade_bruto: record.nome_unidade_bruto,
            nome_especialidade_bruto: record.nome_especialidade_bruto,
          },
          select: {
            id: true,
            status_processamento: true,
          },
        });

        // Se o registro existe e já foi validado, NÃO atualizar
        if (existingRecord && existingRecord.status_processamento === 'validado') {
          logger.debug('Skipping validated record', {
            id: existingRecord.id,
            nome_medico: record.nome_medico_bruto,
            nome_unidade: record.nome_unidade_bruto,
          });
          continue;
        }

        // Se não existe, criar. Se existe mas não está validado, atualizar
        await tx.sTAGING_Info_Origem.upsert({
          where: {
            id: existingRecord?.id || 0, // Se não existe, usa 0 para forçar create
          },
          update: {
            // Atualizar apenas campos brutos, manter dados enriquecidos
            nome_medico_bruto: record.nome_medico_bruto,
            nome_unidade_bruto: record.nome_unidade_bruto,
            nome_especialidade_bruto: record.nome_especialidade_bruto,
            // Manter status pendente (só chega aqui se não for validado)
            status_processamento: 'pendente',
          },
          create: {
            nome_medico_bruto: record.nome_medico_bruto,
            nome_unidade_bruto: record.nome_unidade_bruto,
            nome_especialidade_bruto: record.nome_especialidade_bruto,
            id_origem: record.id_origem,
            status_processamento: 'pendente',
          },
        });
      } catch (error) {
        logger.warn('Failed to upsert record', {
          nome_medico: record.nome_medico_bruto,
          nome_unidade: record.nome_unidade_bruto,
          nome_especialidade: record.nome_especialidade_bruto,
          error: error.message,
        });
        throw error;
      }
    }
  });
}

/**
 * Carrega registros validados de staging para produção (bulk)
 * Esta função é chamada quando múltiplos registros são validados
 */
async function bulkPromoteToProduction(stagingIds) {
  logger.info('Starting bulk promotion to production', {
    staging_ids: stagingIds.length,
  });
  
  let promoted = 0;
  let failed = 0;
  
  await prisma.$transaction(async (tx) => {
    for (const stagingId of stagingIds) {
      try {
        const stagingRecord = await tx.sTAGING_Info_Origem.findUnique({
          where: { id: stagingId },
        });
        
        if (!stagingRecord) {
          failed++;
          continue;
        }
        
        // Validar dados obrigatórios
        if (!stagingRecord.latitude_manual || !stagingRecord.longitude_manual) {
          logger.warn('Cannot promote record without coordinates', {
            staging_id: stagingId,
          });
          failed++;
          continue;
        }
        
        // Criar/atualizar na produção
        const prodUnidade = await tx.pROD_Unidade_Saude.upsert({
          where: { id_origem: stagingRecord.id_origem },
          create: {
            nome: stagingRecord.nome_familiar || stagingRecord.nome_unidade_bruto || 'Nome não informado',
            endereco: stagingRecord.endereco_manual,
            latitude: stagingRecord.latitude_manual,
            longitude: stagingRecord.longitude_manual,
            id_origem: stagingRecord.id_origem,
          },
          update: {
            nome: stagingRecord.nome_familiar || stagingRecord.nome_unidade_bruto || 'Nome não informado',
            endereco: stagingRecord.endereco_manual,
            latitude: stagingRecord.latitude_manual,
            longitude: stagingRecord.longitude_manual,
          },
        });
        
        // Atualizar staging
        await tx.sTAGING_Info_Origem.update({
          where: { id: stagingId },
          data: {
            status_processamento: 'validado',
            id_prod_link: prodUnidade.id,
          },
        });
        
        promoted++;
        
      } catch (error) {
        logger.error('Failed to promote record', {
          staging_id: stagingId,
          error: error.message,
        });
        failed++;
      }
    }
  });
  
  logger.info('Bulk promotion completed', {
    total: stagingIds.length,
    promoted,
    failed,
  });
  
  return { promoted, failed };
}

module.exports = {
  loadToStaging,
  loadBatch,
  bulkPromoteToProduction,
};
