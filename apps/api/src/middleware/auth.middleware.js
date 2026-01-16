const jwt = require('jsonwebtoken');
const { logger } = require('@mapatur/logger');
const { prisma } = require('@mapatur/database');

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Verifica se o usuário está autenticado via JWT
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }
    
    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Adicionar dados do usuário ao request
    req.user = {
      id: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    };
    
    // Setar variável de sessão MySQL para os triggers usarem
    try {
      await prisma.$executeRaw`SET @current_user_id = ${decoded.userId}`;
    } catch (error) {
      logger.error('Failed to set MySQL session variable', {
        error: error.message,
        user_id: decoded.userId,
      });
    }
    
    next();
  } catch (error) {
    logger.warn('Authentication failed', {
      error: error.message,
      ip: req.ip,
    });
    
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
}

// ============================================================================
// AUTHORIZATION MIDDLEWARE (RBAC)
// ============================================================================

/**
 * Verifica se o usuário tem uma das roles permitidas
 * @param {string[]} allowedRoles - Array de roles permitidas
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Authorization failed', {
        user_id: req.user.id,
        role: req.user.role,
        required_roles: allowedRoles,
        url: req.url,
      });
      
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
    }
    
    next();
  };
}

/**
 * Middleware específico para Superadmin
 */
function requireSuperadmin(req, res, next) {
  return authorize('superadmin')(req, res, next);
}

/**
 * Middleware para Admin ou Superadmin
 */
function requireAdmin(req, res, next) {
  return authorize('admin', 'superadmin')(req, res, next);
}

module.exports = {
  authenticate,
  authorize,
  requireSuperadmin,
  requireAdmin,
};
