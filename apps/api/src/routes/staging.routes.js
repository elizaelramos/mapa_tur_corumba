const express = require('express');
const { prisma } = require('@mapatur/database');
const { logger, auditLog } = require('@mapatur/logger');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// Todas as rotas requerem autenticação de Admin
router.use(authenticate);
router.use(requireAdmin);

// ============================================================================
// STAGING ROUTES - Gerenciamento de dados em staging
// ============================================================================

/**
 * GET /api/staging
 * Lista registros em staging com filtros e ordenação
 */
router.get('/', asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20, sortBy, order = 'desc' } = req.query;

  const where = {};
  if (status) {
    where.status_processamento = status;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Configurar ordenação
  let orderBy = { id: 'desc' }; // Padrão: ID decrescente

  if (sortBy) {
    // Mapear campos válidos para ordenação
    const validSortFields = {
      id: 'id',
      id_origem: 'id_origem',
      nome_unidade_bruto: 'nome_unidade_bruto',
      nome_medico_bruto: 'nome_medico_bruto',
      nome_especialidade_bruto: 'nome_especialidade_bruto',
      status_processamento: 'status_processamento',
    };

    if (validSortFields[sortBy]) {
      orderBy = { [validSortFields[sortBy]]: order === 'asc' ? 'asc' : 'desc' };
    }
  }

  const [records, total] = await Promise.all([
    prisma.sTAGING_Info_Origem.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy,
    }),
    prisma.sTAGING_Info_Origem.count({ where }),
  ]);

  res.json({
    success: true,
    data: records,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
}));

/**
 * GET /api/staging/:id
 * Busca registro em staging por ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const record = await prisma.sTAGING_Info_Origem.findUnique({
    where: { id: parseInt(id) },
  });
  
  if (!record) {
    return res.status(404).json({
      success: false,
      error: 'Record not found',
    });
  }
  
  // Se tem link para PROD, buscar também
  let prodRecord = null;
  if (record.id_prod_link) {
    prodRecord = await prisma.pROD_Escola.findUnique({
      where: { id: record.id_prod_link },
    });
  }
  
  res.json({
    success: true,
    data: {
      staging: record,
      production: prodRecord,
    },
  });
}));

/**
 * PUT /api/staging/:id/enrich
 * Enriquece registro em staging (adiciona dados manuais)
 * APLICA os mesmos dados para TODOS os registros da mesma escola
 */
router.put('/:id/enrich', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nome_familiar, endereco_manual, bairro, latitude_manual, longitude_manual, telefone, horario_funcionamento, imagem_url, icone_url, observacoes } = req.body;

  // Buscar o registro para pegar o nome da escola
  const stagingRecord = await prisma.sTAGING_Info_Origem.findUnique({
    where: { id: parseInt(id) },
  });

  if (!stagingRecord) {
    return res.status(404).json({
      success: false,
      error: 'Record not found',
    });
  }

  const updateData = {};
  if (nome_familiar) updateData.nome_familiar = nome_familiar;
  if (endereco_manual) updateData.endereco_manual = endereco_manual;
  if (bairro !== undefined) updateData.bairro = bairro;
  if (latitude_manual !== undefined) updateData.latitude_manual = latitude_manual;
  if (longitude_manual !== undefined) updateData.longitude_manual = longitude_manual;
  if (telefone !== undefined) updateData.telefone = telefone;
  if (horario_funcionamento !== undefined) updateData.horario_funcionamento = horario_funcionamento;
  if (imagem_url !== undefined) updateData.imagem_url = imagem_url;
  if (icone_url !== undefined) updateData.icone_url = icone_url;
  if (observacoes !== undefined) updateData.observacoes = observacoes;

  // ATUALIZAR TODOS OS REGISTROS DA MESMA ESCOLA
  const result = await prisma.sTAGING_Info_Origem.updateMany({
    where: {
      nome_unidade_bruto: stagingRecord.nome_unidade_bruto,
    },
    data: updateData,
  });

  // Buscar o registro atualizado para retornar
  const record = await prisma.sTAGING_Info_Origem.findUnique({
    where: { id: parseInt(id) },
  });

  logger.info('Staging records enriched (grouped by school)', {
    user_id: req.user.id,
    staging_id: record.id,
    records_updated: result.count,
    escola_nome: stagingRecord.nome_unidade_bruto,
    fields: Object.keys(updateData),
  });

  res.json({
    success: true,
    data: record,
    records_updated: result.count,
    message: `${result.count} registros da mesma escola foram atualizados`,
  });
}));

/**
 * POST /api/staging/:id/validate
 * Valida e promove registro de staging para produção
 * AGRUPA automaticamente todos os registros da mesma escola
 */
router.post('/:id/validate', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const stagingRecord = await prisma.sTAGING_Info_Origem.findUnique({
    where: { id: parseInt(id) },
  });

  if (!stagingRecord) {
    return res.status(404).json({
      success: false,
      error: 'Record not found',
    });
  }

  if (stagingRecord.status_processamento === 'validado') {
    return res.status(400).json({
      success: false,
      error: 'Record already validated',
    });
  }

  // Validar dados obrigatórios
  if (!stagingRecord.latitude_manual || !stagingRecord.longitude_manual) {
    return res.status(400).json({
      success: false,
      error: 'Latitude and longitude are required for validation',
    });
  }

  // BUSCAR TODOS OS REGISTROS DA MESMA ESCOLA
  const allRecordsFromEscola = await prisma.sTAGING_Info_Origem.findMany({
    where: {
      nome_unidade_bruto: stagingRecord.nome_unidade_bruto,
    },
  });

  // Criar ou atualizar a escola na produção (sem id_origem, que foi removido)
  const prodEscola = await prisma.pROD_Escola.upsert({
    where: {
      // Usar nome como identificador único para upsert
      nome: stagingRecord.nome_familiar || stagingRecord.nome_unidade_bruto || 'Nome não informado',
    },
    create: {
      nome: stagingRecord.nome_familiar || stagingRecord.nome_unidade_bruto || 'Nome não informado',
      endereco: stagingRecord.endereco_manual,
      bairro: stagingRecord.bairro,
      latitude: stagingRecord.latitude_manual,
      longitude: stagingRecord.longitude_manual,
      telefone: stagingRecord.telefone,
      horario_funcionamento: stagingRecord.horario_funcionamento,
      imagem_url: stagingRecord.imagem_url,
      icone_url: stagingRecord.icone_url,
    },
    update: {
      endereco: stagingRecord.endereco_manual,
      bairro: stagingRecord.bairro,
      latitude: stagingRecord.latitude_manual,
      longitude: stagingRecord.longitude_manual,
      telefone: stagingRecord.telefone,
      horario_funcionamento: stagingRecord.horario_funcionamento,
      imagem_url: stagingRecord.imagem_url,
      icone_url: stagingRecord.icone_url,
    },
  });

  // Coletar todos os professores únicos
  const professoresMap = new Map();

  for (const record of allRecordsFromEscola) {
    if (record.nome_medico_bruto) {
      const professorKey = record.nome_medico_bruto.trim().toLowerCase();
      if (!professoresMap.has(professorKey)) {
        professoresMap.set(professorKey, {
          nome: record.nome_medico_bruto.trim(),
        });
      }
    }
  }

  // Criar/buscar professores e vincular à escola
  for (const [, professorData] of professoresMap) {
    // Buscar ou criar professor
    let professor = await prisma.pROD_Professor.findFirst({
      where: { nome: professorData.nome },
    });

    if (!professor) {
      professor = await prisma.pROD_Professor.create({
        data: {
          nome: professorData.nome,
        },
      });
    }

    // Vincular professor à escola (se ainda não vinculado)
    await prisma.junction_Escola_Professor.upsert({
      where: {
        id_escola_id_professor: {
          id_escola: prodEscola.id,
          id_professor: professor.id,
        },
      },
      create: {
        id_escola: prodEscola.id,
        id_professor: professor.id,
      },
      update: {},
    });
  }

  // Marcar TODOS os registros da escola como validados
  await prisma.sTAGING_Info_Origem.updateMany({
    where: {
      nome_unidade_bruto: stagingRecord.nome_unidade_bruto,
    },
    data: {
      status_processamento: 'validado',
      id_prod_link: prodEscola.id,
    },
  });

  await auditLog('VALIDATE_GROUPED', 'STAGING_Info_Origem', parseInt(id), req.user.id, req.user.role, {
    promoted_to_prod: prodEscola.id,
    records_grouped: allRecordsFromEscola.length,
    professores_count: professoresMap.size,
  });

  logger.info('Staging records validated and promoted (grouped by school)', {
    user_id: req.user.id,
    staging_id: parseInt(id),
    prod_id: prodEscola.id,
    total_records: allRecordsFromEscola.length,
    professores: professoresMap.size,
  });

  res.json({
    success: true,
    data: {
      staging: stagingRecord,
      production: prodEscola,
    },
    records_grouped: allRecordsFromEscola.length,
    professores_count: professoresMap.size,
    message: `${allRecordsFromEscola.length} registros validados e agrupados. ${professoresMap.size} professores processados.`,
  });
}));

/**
 * PUT /api/staging/:id/status
 * Atualiza status do registro em staging
 */
router.put('/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['pendente', 'validado', 'erro', 'ignorado'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid status',
    });
  }
  
  const record = await prisma.sTAGING_Info_Origem.update({
    where: { id: parseInt(id) },
    data: { status_processamento: status },
  });
  
  logger.info('Staging record status updated', {
    user_id: req.user.id,
    staging_id: record.id,
    new_status: status,
  });
  
  res.json({
    success: true,
    data: record,
  });
}));

module.exports = router;
