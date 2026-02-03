const express = require('express');
const { prisma } = require('@mapatur/database');
const { logger, auditLog } = require('@mapatur/logger');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// ============================================================================
// PROFESSOR ROUTES
// ============================================================================

/**
 * GET /api/medicos
 * Lista todos os professores
 */
router.get('/', asyncHandler(async (req, res) => {
  const { ativo = 'true', page = 1, limit = 100 } = req.query;

  const where = {};
  if (ativo === 'true') {
    where.ativo = true;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [professores, total] = await Promise.all([
    prisma.pROD_Professor.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { nome: 'asc' },
    }),
    prisma.pROD_Professor.count({ where }),
  ]);

  res.json({
    success: true,
    data: professores,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
}));

/**
 * GET /api/medicos/:id
 * Busca professor por ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const professor = await prisma.pROD_Professor.findUnique({
    where: { id: parseInt(id) },
  });

  if (!professor) {
    return res.status(404).json({
      success: false,
      error: 'Professor not found',
    });
  }

  res.json({
    success: true,
    data: professor,
  });
}));

/**
 * POST /api/medicos
 * Cria novo professor (requer autenticação)
 */
router.post('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { nome, cargo } = req.body;

  if (!nome) {
    return res.status(400).json({
      success: false,
      error: 'Nome is required',
    });
  }

  const professor = await prisma.pROD_Professor.create({
    data: {
      nome,
      cargo: cargo || null,
    },
  });

  await auditLog('CREATE', 'PROD_Professor', professor.id, req.user.id, req.user.role);

  logger.info('Professor created', {
    user_id: req.user.id,
    professor_id: professor.id,
    nome: professor.nome,
  });

  res.status(201).json({
    success: true,
    data: professor,
  });
}));

/**
 * PUT /api/medicos/:id
 * Atualiza professor (requer autenticação)
 */
router.put('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nome, cargo, ativo } = req.body;

  const updateData = {};
  if (nome) updateData.nome = nome;
  if (cargo !== undefined) updateData.cargo = cargo || null;
  if (typeof ativo === 'boolean') updateData.ativo = ativo;

  const professor = await prisma.pROD_Professor.update({
    where: { id: parseInt(id) },
    data: updateData,
  });

  await auditLog('UPDATE', 'PROD_Professor', parseInt(id), req.user.id, req.user.role, {
    updated_fields: Object.keys(updateData),
  });

  logger.info('Professor updated', {
    user_id: req.user.id,
    professor_id: parseInt(id),
    updated_fields: Object.keys(updateData),
  });

  res.json({
    success: true,
    data: professor,
  });
}));

/**
 * DELETE /api/medicos/:id
 * Deleta professor (requer autenticação)
 */
router.delete('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.pROD_Professor.delete({
    where: { id: parseInt(id) },
  });

  await auditLog('DELETE', 'PROD_Professor', parseInt(id), req.user.id, req.user.role);

  logger.info('Professor deleted', {
    user_id: req.user.id,
    professor_id: parseInt(id),
  });

  res.json({
    success: true,
    message: 'Professor deleted successfully',
  });
}));

module.exports = router;
