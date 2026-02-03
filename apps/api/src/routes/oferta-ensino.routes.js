const express = require('express');
const { prisma } = require('@mapatur/database');
const { logger, auditLog } = require('@mapatur/logger');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// ============================================================================
// OFERTA ENSINO ROUTES - Gerenciamento de ofertas de ensino
// ============================================================================

/**
 * GET /api/ofertas-ensino
 * Lista todas as ofertas de ensino (público)
 */
router.get('/', asyncHandler(async (req, res) => {
  const { ativo = 'true' } = req.query;

  const where = {};
  if (ativo !== 'all') {
    where.ativo = ativo === 'true';
  }

  const ofertas = await prisma.pROD_OfertaEnsino.findMany({
    where,
    orderBy: { nome: 'asc' },
  });

  res.json({
    success: true,
    data: ofertas,
  });
}));

/**
 * POST /api/ofertas-ensino
 * Cria nova oferta de ensino (requer autenticação admin)
 */
router.post('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { nome } = req.body;

  if (!nome || nome.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Nome da oferta de ensino é obrigatório',
    });
  }

  // Verificar se já existe
  const exists = await prisma.pROD_OfertaEnsino.findFirst({
    where: { nome: nome.trim() },
  });

  if (exists) {
    return res.status(400).json({
      success: false,
      error: 'Já existe uma oferta de ensino com este nome',
    });
  }

  const oferta = await prisma.pROD_OfertaEnsino.create({
    data: {
      nome: nome.trim(),
    },
  });

  await auditLog('CREATE', 'PROD_OfertaEnsino', oferta.id, req.user.id, req.user.role);

  logger.info('Oferta de ensino created', {
    user_id: req.user.id,
    oferta_id: oferta.id,
    nome: oferta.nome,
  });

  res.status(201).json({
    success: true,
    data: oferta,
  });
}));

/**
 * PUT /api/ofertas-ensino/:id
 * Atualiza oferta de ensino (requer autenticação admin)
 */
router.put('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nome, ativo } = req.body;

  const updateData = {};
  if (nome !== undefined && nome.trim().length > 0) {
    // Verificar se já existe outra oferta com este nome
    const exists = await prisma.pROD_OfertaEnsino.findFirst({
      where: {
        nome: nome.trim(),
        NOT: { id: parseInt(id) },
      },
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        error: 'Já existe uma oferta de ensino com este nome',
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

  const oferta = await prisma.pROD_OfertaEnsino.update({
    where: { id: parseInt(id) },
    data: updateData,
  });

  await auditLog('UPDATE', 'PROD_OfertaEnsino', parseInt(id), req.user.id, req.user.role, {
    updated_fields: Object.keys(updateData),
  });

  logger.info('Oferta de ensino updated', {
    user_id: req.user.id,
    oferta_id: parseInt(id),
    updated_fields: Object.keys(updateData),
  });

  res.json({
    success: true,
    data: oferta,
  });
}));

/**
 * DELETE /api/ofertas-ensino/:id
 * Desativa oferta de ensino (soft delete) (requer autenticação admin)
 */
router.delete('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Soft delete - apenas desativa
  const oferta = await prisma.pROD_OfertaEnsino.update({
    where: { id: parseInt(id) },
    data: { ativo: false },
  });

  await auditLog('DELETE', 'PROD_OfertaEnsino', parseInt(id), req.user.id, req.user.role);

  logger.info('Oferta de ensino deleted (soft)', {
    user_id: req.user.id,
    oferta_id: parseInt(id),
  });

  res.json({
    success: true,
    message: 'Oferta de ensino desativada com sucesso',
    data: oferta,
  });
}));

module.exports = router;
