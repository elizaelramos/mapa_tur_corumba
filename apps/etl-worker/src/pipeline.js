const { prisma } = require('@mapatur/database');
const { logger, etlLog } = require('@mapatur/logger');
const { extractFromSource } = require('./extract');
const { transformData } = require('./transform');
const { loadToStaging } = require('./load');

// ============================================================================
// ETL PIPELINE - Orquestrador do processo ETL
// ============================================================================

/**
 * Executa o pipeline completo de ETL
 */
async function runETLPipeline() {
  let executionId = null;
  
  try {
    // Criar registro de execução
    const execution = await prisma.eTL_Execution.create({
      data: {
        status: 'running',
        started_at: new Date(),
      },
    });
    
    executionId = execution.id;
    
    etlLog('pipeline', 'started', {
      execution_id: executionId,
    });
    
    // ========================================================================
    // FASE 1: EXTRACT - Extrair dados da fonte
    // ========================================================================
    
    etlLog('extract', 'started', { execution_id: executionId });
    
    const extractedRecords = await extractFromSource();
    
    etlLog('extract', 'completed', {
      execution_id: executionId,
      records_extracted: extractedRecords.length,
    });
    
    // ========================================================================
    // FASE 2: TRANSFORM - Transformar e limpar dados
    // ========================================================================
    
    etlLog('transform', 'started', { execution_id: executionId });
    
    const transformedRecords = transformData(extractedRecords);
    
    etlLog('transform', 'completed', {
      execution_id: executionId,
      records_transformed: transformedRecords.length,
    });
    
    // ========================================================================
    // FASE 3: LOAD - Carregar para staging
    // ========================================================================
    
    etlLog('load', 'started', { execution_id: executionId });
    
    const { loaded, failed } = await loadToStaging(transformedRecords);
    
    etlLog('load', 'completed', {
      execution_id: executionId,
      records_loaded: loaded,
      records_failed: failed,
    });
    
    // ========================================================================
    // FINALIZAÇÃO
    // ========================================================================
    
    await prisma.eTL_Execution.update({
      where: { id: executionId },
      data: {
        status: 'completed',
        finished_at: new Date(),
        records_extracted: extractedRecords.length,
        records_loaded: loaded,
        records_failed: failed,
      },
    });
    
    etlLog('pipeline', 'completed', {
      execution_id: executionId,
      records_extracted: extractedRecords.length,
      records_loaded: loaded,
      records_failed: failed,
    });
    
    logger.info('ETL Pipeline completed successfully', {
      execution_id: executionId,
      duration: `${Date.now() - execution.started_at.getTime()}ms`,
      extracted: extractedRecords.length,
      loaded,
      failed,
    });
    
    return {
      success: true,
      execution_id: executionId,
      extracted: extractedRecords.length,
      loaded,
      failed,
    };
    
  } catch (error) {
    logger.error('ETL Pipeline failed', {
      execution_id: executionId,
      error: error.message,
      stack: error.stack,
    });
    
    // Atualizar registro de execução com erro
    if (executionId) {
      await prisma.eTL_Execution.update({
        where: { id: executionId },
        data: {
          status: 'failed',
          finished_at: new Date(),
          error_message: error.message,
        },
      });
    }
    
    etlLog('pipeline', 'failed', {
      execution_id: executionId,
      error: error.message,
    });
    
    throw error;
  }
}

module.exports = {
  runETLPipeline,
};
