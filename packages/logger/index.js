const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const { prisma } = require('@mapatur/database');

// ============================================================================
// WINSTON LOGGER - Sistema de logs estruturados (JSON)
// ============================================================================

const logLevel = process.env.LOG_LEVEL || 'info';
const logDir = process.env.LOG_FILE_PATH || './logs';

// Formato customizado para logs estruturados
const structuredFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
  winston.format.json()
);

// Formato para console (desenvolvimento)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = `\n${JSON.stringify(meta, null, 2)}`;
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Transports
const transports = [
  // Console transport (desenvolvimento)
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? structuredFormat : consoleFormat,
    level: logLevel,
  }),
  
  // File transport - Todos os logs
  new DailyRotateFile({
    filename: path.join(logDir, 'app-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: structuredFormat,
    level: logLevel,
  }),
  
  // File transport - Apenas erros
  new DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    format: structuredFormat,
    level: 'error',
  }),
];

// Criar logger
const logger = winston.createLogger({
  level: logLevel,
  format: structuredFormat,
  transports,
  exitOnError: false,
});

// ============================================================================
// HELPER FUNCTIONS - Funções auxiliares para logging contextual
// ============================================================================

/**
 * Cria um logger com contexto adicional
 * @param {Object} context - Contexto adicional (user_id, role, correlation_id, etc.)
 * @returns {Object} Logger com contexto
 */
function createContextLogger(context = {}) {
  return {
    info: (message, meta = {}) => logger.info(message, { ...context, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { ...context, ...meta }),
    error: (message, meta = {}) => logger.error(message, { ...context, ...meta }),
    debug: (message, meta = {}) => logger.debug(message, { ...context, ...meta }),
  };
}

/**
 * Middleware Express para logging de requisições
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  const correlationId = req.headers['x-correlation-id'] || generateCorrelationId();
  
  // Adicionar correlation_id ao request
  req.correlationId = correlationId;
  
  // Log da requisição
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    correlation_id: correlationId,
    user_id: req.user?.id,
    role: req.user?.role,
    ip: req.ip,
  });
  
  // Log da resposta
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      correlation_id: correlationId,
      user_id: req.user?.id,
      role: req.user?.role,
    });
  });
  
  next();
}

/**
 * Middleware Express para logging de erros
 */
function errorLogger(err, req, res, next) {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    correlation_id: req.correlationId,
    user_id: req.user?.id,
    role: req.user?.role,
  });
  
  next(err);
}

/**
 * Gera um correlation ID único
 */
function generateCorrelationId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log de operação de auditoria
 * Registra no banco de dados e nos logs de arquivo
 */
async function auditLog(operation, table, recordId, userId, role, data = {}) {
  // Normalizar operation (CREATE -> INSERT para compatibilidade com enum)
  const normalizedOperation = operation === 'CREATE' ? 'INSERT' : operation;

  // Log estruturado em arquivo (Winston)
  logger.info('Audit operation', {
    audit: true,
    operation: normalizedOperation,
    table,
    record_id: recordId,
    user_id: userId,
    role,
    ...data,
  });

  // Salvar no banco de dados
  try {
    await prisma.aUDIT_LOG.create({
      data: {
        tabela: table,
        operacao: normalizedOperation,
        registro_id: recordId,
        valor_antigo: data.oldValue ? JSON.stringify(data.oldValue) : null,
        valor_novo: data.newValue || data.updateData ? JSON.stringify(data.newValue || data.updateData) : null,
        user_id: userId,
        correlation_id: data.correlation_id || null,
      },
    });
  } catch (error) {
    // Log de erro mas não propaga (auditoria não deve quebrar a aplicação)
    logger.error('Falha ao salvar log de auditoria no banco', {
      error: error.message,
      operation: normalizedOperation,
      table,
      record_id: recordId,
    });
  }
}

/**
 * Log de operação ETL
 */
function etlLog(phase, status, data = {}) {
  logger.info(`ETL ${phase}`, {
    etl: true,
    phase,
    status,
    ...data,
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  logger,
  createContextLogger,
  requestLogger,
  errorLogger,
  generateCorrelationId,
  auditLog,
  etlLog,
};
