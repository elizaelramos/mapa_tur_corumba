const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const cron = require('node-cron');
const { logger, etlLog } = require('@mapatur/logger');
const { runETLPipeline } = require('./pipeline');

// ============================================================================
// ETL WORKER - Agendador e executor do pipeline ETL
// ============================================================================

// ============================================================================
// ETL DESABILITADO - Manual data entry mode
// ============================================================================
// O ETL foi desabilitado pois o sistema agora utiliza entrada manual de dados.
// Todos os dados históricos foram preservados nas tabelas STAGING_* e PROD_*.
// Para executar o ETL manualmente (se necessário), use: node packages/etl/index.js
// ============================================================================

const CRON_SCHEDULE = process.env.ETL_SCHEDULE_CRON || '0 2 * * *'; // Padrão: 2h da manhã

logger.info('ETL Worker starting (DISABLED - manual data entry mode)', {
  schedule: 'DISABLED',
  env: process.env.NODE_ENV || 'development',
});

// DESABILITADO: Executar ETL imediatamente ao iniciar
// if (process.env.NODE_ENV === 'development' && process.env.ETL_RUN_ON_START === 'true') {
//   logger.info('Running ETL immediately (development mode)');
//   runETLPipeline().catch(error => {
//     logger.error('ETL execution failed on startup', { error: error.message });
//   });
// }

// DESABILITADO: Agendar execução do ETL
// O agendamento automático foi desabilitado para modo de entrada manual de dados
// cron.schedule(CRON_SCHEDULE, async () => {
//   logger.info('ETL scheduled execution starting', {
//     schedule: CRON_SCHEDULE,
//     timestamp: new Date().toISOString(),
//   });
//
//   try {
//     await runETLPipeline();
//     logger.info('ETL scheduled execution completed successfully');
//   } catch (error) {
//     logger.error('ETL scheduled execution failed', {
//       error: error.message,
//       stack: error.stack,
//     });
//   }
// });

logger.info('ETL Worker disabled', {
  message: 'ETL scheduling disabled - manual data entry mode active',
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: shutting down ETL Worker');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: shutting down ETL Worker');
  process.exit(0);
});
