const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { prisma } = require('@mapatur/database');
const { logger } = require('@mapatur/logger');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// ============================================================================
// AUTH ROUTES
// ============================================================================

/**
 * POST /api/auth/login
 * Autenticação de usuário
 */
router.post('/login',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username deve ter entre 3 e 50 caracteres')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username deve conter apenas letras, números, _ ou -'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password deve ter no mínimo 6 caracteres'),
  ],
  asyncHandler(async (req, res) => {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: errors.array(),
      });
    }

    const { username, password } = req.body;
  
  // Buscar usuário
  const user = await prisma.user.findUnique({
    where: { username },
  });
  
  if (!user || !user.ativo) {
    logger.warn('Login attempt failed - user not found or inactive', {
      username,
      ip: req.ip,
    });
    
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials',
    });
  }
  
  // Verificar senha
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  
  if (!isPasswordValid) {
    logger.warn('Login attempt failed - invalid password', {
      user_id: user.id,
      username,
      ip: req.ip,
    });
    
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials',
    });
  }
  
  // Atualizar last_login
  await prisma.user.update({
    where: { id: user.id },
    data: { last_login: new Date() },
  });
  
  // Gerar JWT
  const token = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
  
  logger.info('User logged in successfully', {
    user_id: user.id,
    username: user.username,
    role: user.role,
  });
  
  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    },
  });
}));

/**
 * POST /api/auth/validate
 * Valida token JWT
 */
router.post('/validate', asyncHandler(async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Token is required',
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar se usuário ainda existe e está ativo
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        ativo: true,
      },
    });
    
    if (!user || !user.ativo) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }
    
    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
}));

module.exports = router;
