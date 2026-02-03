const express = require('express');
const { prisma } = require('@mapatur/database');
const { logger, auditLog } = require('@mapatur/logger');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// ============================================================================
// BAIRRO ROUTES - Gerenciamento de bairros de Corumbá
// ============================================================================

/**
 * GET /api/bairros
 * Lista todos os bairros (público)
 */
router.get('/', asyncHandler(async (req, res) => {
  const { ativo = 'true' } = req.query;

  const where = {};
  if (ativo !== 'all') {
    where.ativo = ativo === 'true';
  }

  const bairros = await prisma.pROD_Bairro.findMany({
    where,
    orderBy: { nome: 'asc' },
  });

  res.json({
    success: true,
    data: bairros,
  });
}));

/**
 * POST /api/bairros
 * Cria novo bairro (requer autenticação admin)
 */
router.post('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { nome } = req.body;

  if (!nome || nome.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Nome do bairro é obrigatório',
    });
  }

  // Verificar se já existe
  const exists = await prisma.pROD_Bairro.findFirst({
    where: { nome: nome.trim() },
  });

  if (exists) {
    return res.status(400).json({
      success: false,
      error: 'Já existe um bairro com este nome',
    });
  }

  const bairro = await prisma.pROD_Bairro.create({
    data: {
      nome: nome.trim(),
    },
  });

  await auditLog('CREATE', 'PROD_Bairro', bairro.id, req.user.id, req.user.role);

  logger.info('Bairro created', {
    user_id: req.user.id,
    bairro_id: bairro.id,
    nome: bairro.nome,
  });

  res.status(201).json({
    success: true,
    data: bairro,
  });
}));

/**
 * PUT /api/bairros/:id
 * Atualiza bairro (requer autenticação admin)
 */
router.put('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nome, ativo } = req.body;

  const updateData = {};
  if (nome !== undefined && nome.trim().length > 0) {
    // Verificar se já existe outro bairro com este nome
    const exists = await prisma.pROD_Bairro.findFirst({
      where: {
        nome: nome.trim(),
        NOT: { id: parseInt(id) },
      },
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        error: 'Já existe um bairro com este nome',
      });
    }

    updateData.nome = nome.trim();
  }
  if (typeof ativo === 'boolean') updateData.ativo = ativo;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Nenhum dado para atualizar',
    });
  }

  const bairro = await prisma.pROD_Bairro.update({
    where: { id: parseInt(id) },
    data: updateData,
  });

  await auditLog('UPDATE', 'PROD_Bairro', parseInt(id), req.user.id, req.user.role, {
    updated_fields: Object.keys(updateData),
  });

  logger.info('Bairro updated', {
    user_id: req.user.id,
    bairro_id: parseInt(id),
    updated_fields: Object.keys(updateData),
  });

  res.json({
    success: true,
    data: bairro,
  });
}));

/**
 * DELETE /api/bairros/:id
 * Desativa bairro (soft delete) (requer autenticação admin)
 */
router.delete('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Soft delete - apenas desativa
  const bairro = await prisma.pROD_Bairro.update({
    where: { id: parseInt(id) },
    data: { ativo: false },
  });

  await auditLog('DELETE', 'PROD_Bairro', parseInt(id), req.user.id, req.user.role);

  logger.info('Bairro deleted (soft)', {
    user_id: req.user.id,
    bairro_id: parseInt(id),
  });

  res.json({
    success: true,
    message: 'Bairro desativado com sucesso',
    data: bairro,
  });
}));

module.exports = router;
