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
  
  // Erro genérico
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
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
