const express = require('express');
const bcrypt = require('bcryptjs');
const { prisma } = require('@mapatur/database');
const { logger, auditLog } = require('@mapatur/logger');
const { authenticate, requireSuperadmin } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// Todas as rotas de usuário requerem autenticação
router.use(authenticate);

// ============================================================================
// USER ROUTES (Apenas Superadmin)
// ============================================================================

/**
 * GET /api/users
 * Lista todos os usuários
 */
router.get('/', requireSuperadmin, asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      ativo: true,
      created_at: true,
      updated_at: true,
      last_login: true,
    },
    orderBy: { created_at: 'desc' },
  });
  
  res.json({
    success: true,
    data: users,
  });
}));

/**
 * GET /api/users/:id
 * Busca usuário por ID
 */
router.get('/:id', requireSuperadmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      ativo: true,
      created_at: true,
      updated_at: true,
      last_login: true,
    },
  });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
    });
  }
  
  res.json({
    success: true,
    data: user,
  });
}));

/**
 * POST /api/users
 * Cria novo usuário
 */
router.post('/', requireSuperadmin, asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.body;
  
  // Validação básica
  if (!username || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      error: 'All fields are required',
    });
  }
  
  if (!['admin', 'superadmin'].includes(role)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid role',
    });
  }
  
  // Hash da senha
  const password_hash = await bcrypt.hash(password, 10);
  
  // Criar usuário
  const user = await prisma.user.create({
    data: {
      username,
      email,
      password_hash,
      role,
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      ativo: true,
      created_at: true,
    },
  });
  
  await auditLog('CREATE', 'User', user.id, req.user.id, req.user.role, {
    new_user: user.username,
    new_role: user.role,
  });
  
  logger.info('User created', {
    user_id: req.user.id,
    new_user_id: user.id,
    new_username: user.username,
    new_role: user.role,
  });
  
  res.status(201).json({
    success: true,
    data: user,
  });
}));

/**
 * PUT /api/users/:id
 * Atualiza usuário
 */
router.put('/:id', requireSuperadmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { username, email, password, role, ativo } = req.body;
  
  const updateData = {};
  
  if (username) updateData.username = username;
  if (email) updateData.email = email;
  if (password) updateData.password_hash = await bcrypt.hash(password, 10);
  if (role && ['admin', 'superadmin'].includes(role)) updateData.role = role;
  if (typeof ativo === 'boolean') updateData.ativo = ativo;
  
  const user = await prisma.user.update({
    where: { id: parseInt(id) },
    data: updateData,
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      ativo: true,
      updated_at: true,
    },
  });
  
  await auditLog('UPDATE', 'User', user.id, req.user.id, req.user.role, {
    updated_fields: Object.keys(updateData),
  });
  
  logger.info('User updated', {
    user_id: req.user.id,
    updated_user_id: user.id,
    updated_fields: Object.keys(updateData),
  });
  
  res.json({
    success: true,
    data: user,
  });
}));

/**
 * DELETE /api/users/:id
 * Deleta usuário
 */
router.delete('/:id', requireSuperadmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Não permitir deletar a si mesmo
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({
      success: false,
      error: 'Cannot delete your own account',
    });
  }
  
  await prisma.user.delete({
    where: { id: parseInt(id) },
  });
  
  await auditLog('DELETE', 'User', parseInt(id), req.user.id, req.user.role);
  
  logger.info('User deleted', {
    user_id: req.user.id,
    deleted_user_id: parseInt(id),
  });
  
  res.json({
    success: true,
    message: 'User deleted successfully',
  });
}));

module.exports = router;
