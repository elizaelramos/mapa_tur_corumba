const { logger } = require('@mapatur/logger');

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

/**
 * Middleware global de tratamento de erros
 */
function errorHandler(err, req, res, next) {
  // Log do erro
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user_id: req.user?.id,
    correlation_id: req.correlationId,
  });
  
  // Erros de validação do Prisma
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry',
      field: err.meta?.target?.[0],
    });
  }
  
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Record not found',
    });
  }
  
  // Erros de validação do express-validator
  if (err.array && typeof err.array === 'function') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      validationErrors: err.array(),
    });
  }

  // Erros de conexão com o banco de dados (servidor caído/indisponível)
  // Prisma: P1000 (auth), P1001 (não alcançável), P1002 (timeout),
  // P1008 (operação expirou), P1017 (conexão fechada) ou falha de inicialização.
  // A mensagem original expõe host/porta/string de conexão, então NUNCA
  // deve ser repassada ao cliente — devolvemos algo amigável.
  const dbErrorCodes = ['P1000', 'P1001', 'P1002', 'P1008', 'P1017'];
  const isDbConnectionError =
    dbErrorCodes.includes(err.code) ||
    err.name === 'PrismaClientInitializationError' ||
    err.name === 'PrismaClientRustPanicError';

  if (isDbConnectionError) {
    return res.status(503).json({
      success: false,
      error: 'Serviço temporariamente indisponível. Tente novamente em alguns instantes.',
    });
  }

  // Erro genérico
  const statusCode = err.statusCode || 500;
  const isDev = process.env.NODE_ENV === 'development';

  // Em produção, erros 500 (não previstos) não devem expor a mensagem interna,
  // que pode conter detalhes da stack/infraestrutura. Erros operacionais
  // (statusCode < 500 definido explicitamente) mantêm sua mensagem.
  const message =
    statusCode >= 500 && !isDev
      ? 'Ocorreu um erro interno. Tente novamente mais tarde.'
      : err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(isDev && { stack: err.stack }),
  });
}

/**
 * Wrapper para funções async que captura erros
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  asyncHandler,
};
