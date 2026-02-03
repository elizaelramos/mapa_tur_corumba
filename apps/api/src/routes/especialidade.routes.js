const express = require('express');
const { prisma } = require('@mapatur/database');
const { logger, auditLog } = require('@mapatur/logger');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// ============================================================================
// ESPECIALIDADE ROUTES - DESATIVADO
// Este arquivo foi desativado porque o modelo de especialidades foi removido
// do schema do Prisma. Todas as rotas abaixo estão comentadas.
// ============================================================================

/*
// CÓDIGO ORIGINAL COMENTADO - Especialidades foram removidas do sistema

/**
 * GET /api/especialidades
 * Lista todas as especialidades com seus mapeamentos (público)
 */
router.get('/', asyncHandler(async (req, res) => {
  const { ativo = 'true' } = req.query;

  const where = {};
  if (ativo === 'true') {
    where.ativo = true;
  }

  // Buscar especialidades
  const especialidades = await prisma.pROD_Especialidade.findMany({
    where,
    orderBy: { nome: 'asc' },
  });

  // Buscar todos os mapeamentos
  const mapeamentos = await prisma.especialidade_Mapeamento.findMany({
    select: {
      id: true,
      especialidade_bruta: true,
      especialidade_normalizada: true,
      criado_em: true,
    },
  });

  // Associar mapeamentos às especialidades
  const especialidadesComMapeamentos = especialidades.map(esp => ({
    ...esp,
    mapeamentos: mapeamentos
      .filter(m => m.especialidade_normalizada === esp.nome)
      .map(m => ({
        id: m.id,
        nome_bruto: m.especialidade_bruta,
        criado_em: m.criado_em,
      })),
  }));

  res.json({
    success: true,
    data: especialidadesComMapeamentos,
  });
}));

/**
 * GET /api/especialidades/:id
 * Busca especialidade por ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const especialidade = await prisma.pROD_Especialidade.findUnique({
    where: { id: parseInt(id) },
  });
  
  if (!especialidade) {
    return res.status(404).json({
      success: false,
      error: 'Especialidade not found',
    });
  }
  
  res.json({
    success: true,
    data: especialidade,
  });
}));

/**
 * POST /api/especialidades
 * Cria nova especialidade (requer autenticação)
 */
router.post('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { nome } = req.body;
  
  if (!nome) {
    return res.status(400).json({
      success: false,
      error: 'Nome is required',
    });
  }
  
  const especialidade = await prisma.pROD_Especialidade.create({
    data: { nome: nome.toUpperCase() },
  });
  
  await auditLog('CREATE', 'PROD_Especialidade', especialidade.id, req.user.id, req.user.role);
  
  logger.info('Especialidade created', {
    user_id: req.user.id,
    especialidade_id: especialidade.id,
    nome: especialidade.nome,
  });
  
  res.status(201).json({
    success: true,
    data: especialidade,
  });
}));

/**
 * PUT /api/especialidades/:id
 * Atualiza especialidade (requer autenticação)
 */
router.put('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nome, ativo } = req.body;
  
  const updateData = {};
  if (nome) updateData.nome = nome.toUpperCase();
  if (typeof ativo === 'boolean') updateData.ativo = ativo;
  
  const especialidade = await prisma.pROD_Especialidade.update({
    where: { id: parseInt(id) },
    data: updateData,
  });
  
  await auditLog('UPDATE', 'PROD_Especialidade', parseInt(id), req.user.id, req.user.role, {
    updated_fields: Object.keys(updateData),
  });
  
  logger.info('Especialidade updated', {
    user_id: req.user.id,
    especialidade_id: parseInt(id),
    updated_fields: Object.keys(updateData),
  });
  
  res.json({
    success: true,
    data: especialidade,
  });
}));

/**
 * DELETE /api/especialidades/:id
 * Deleta especialidade (requer autenticação)
 */
router.delete('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.pROD_Especialidade.delete({
    where: { id: parseInt(id) },
  });

  await auditLog('DELETE', 'PROD_Especialidade', parseInt(id), req.user.id, req.user.role);

  logger.info('Especialidade deleted', {
    user_id: req.user.id,
    especialidade_id: parseInt(id),
  });

  res.json({
    success: true,
    message: 'Especialidade deleted successfully',
  });
}));

// ============================================================================
// ROTAS DE NORMALIZAÇÃO DE ESPECIALIDADES
// ============================================================================

/**
 * GET /api/especialidades/brutas/list
 * Lista todas as especialidades brutas únicas da staging
 */
router.get('/brutas/list', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const especialidadesBrutas = await prisma.$queryRaw`
    SELECT
      nome_especialidade_bruto as nome,
      COUNT(*) as count
    FROM STAGING_Info_Origem
    WHERE nome_especialidade_bruto IS NOT NULL
    GROUP BY nome_especialidade_bruto
    ORDER BY count DESC, nome_especialidade_bruto ASC
  `;

  // Converter BigInt para Number
  const especialidades = especialidadesBrutas.map(e => ({
    nome: e.nome,
    count: Number(e.count),
  }));

  logger.info('Especialidades brutas listadas', {
    user_id: req.user.id,
    total: especialidades.length,
  });

  res.json({
    success: true,
    data: especialidades,
    total: especialidades.length,
  });
}));

/**
 * GET /api/especialidades/mapeamentos/list
 * Lista todos os mapeamentos existentes
 */
router.get('/mapeamentos/list', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const mapeamentos = await prisma.especialidade_Mapeamento.findMany({
    include: {
      usuario: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
    orderBy: {
      criado_em: 'desc',
    },
  });

  logger.info('Mapeamentos listados', {
    user_id: req.user.id,
    total: mapeamentos.length,
  });

  res.json({
    success: true,
    data: mapeamentos,
    total: mapeamentos.length,
  });
}));

/**
 * POST /api/especialidades/mapear
 * Cria um novo mapeamento de especialidade
 */
router.post('/mapear', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { especialidade_bruta, especialidade_normalizada } = req.body;

  if (!especialidade_bruta || !especialidade_normalizada) {
    return res.status(400).json({
      success: false,
      error: 'Campos obrigatórios: especialidade_bruta, especialidade_normalizada',
    });
  }

  // Verificar se já existe
  const existente = await prisma.especialidade_Mapeamento.findUnique({
    where: { especialidade_bruta },
  });

  if (existente) {
    return res.status(409).json({
      success: false,
      error: 'Já existe um mapeamento para esta especialidade bruta',
      data: existente,
    });
  }

  const mapeamento = await prisma.especialidade_Mapeamento.create({
    data: {
      especialidade_bruta,
      especialidade_normalizada,
      criado_por: req.user.id,
    },
    include: {
      usuario: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
  });

  logger.info('Mapeamento criado', {
    user_id: req.user.id,
    mapeamento_id: mapeamento.id,
    especialidade_bruta,
    especialidade_normalizada,
  });

  res.status(201).json({
    success: true,
    data: mapeamento,
  });
}));

/**
 * PUT /api/especialidades/mapear/:id
 * Atualiza um mapeamento existente
 */
router.put('/mapear/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { especialidade_normalizada } = req.body;

  if (!especialidade_normalizada) {
    return res.status(400).json({
      success: false,
      error: 'Campo obrigatório: especialidade_normalizada',
    });
  }

  const mapeamento = await prisma.especialidade_Mapeamento.update({
    where: { id: parseInt(id) },
    data: { especialidade_normalizada },
    include: {
      usuario: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
  });

  logger.info('Mapeamento atualizado', {
    user_id: req.user.id,
    mapeamento_id: mapeamento.id,
  });

  res.json({
    success: true,
    data: mapeamento,
  });
}));

/**
 * DELETE /api/especialidades/mapear/:id
 * Remove um mapeamento
 */
router.delete('/mapear/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existente = await prisma.especialidade_Mapeamento.findUnique({
    where: { id: parseInt(id) },
  });

  if (!existente) {
    return res.status(404).json({
      success: false,
      error: 'Mapeamento não encontrado',
    });
  }

  await prisma.especialidade_Mapeamento.delete({
    where: { id: parseInt(id) },
  });

  logger.info('Mapeamento deletado', {
    user_id: req.user.id,
    mapeamento_id: id,
  });

  res.json({
    success: true,
    message: 'Mapeamento deletado com sucesso',
  });
}));

/**
 * GET /api/especialidades/estatisticas/normalizacao
 * Retorna estatísticas sobre o progresso da normalização
 */
router.get('/estatisticas/normalizacao', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const totalBrutas = await prisma.$queryRaw`
    SELECT COUNT(DISTINCT nome_especialidade_bruto) as total
    FROM STAGING_Info_Origem
    WHERE nome_especialidade_bruto IS NOT NULL
  `;

  const totalMapeamentos = await prisma.especialidade_Mapeamento.count();

  const totalNormalizadas = await prisma.$queryRaw`
    SELECT COUNT(DISTINCT especialidade_normalizada) as total
    FROM Especialidade_Mapeamento
  `;

  const stats = {
    totalBrutas: Number(totalBrutas[0].total),
    totalMapeamentos,
    totalNormalizadas: Number(totalNormalizadas[0]?.total || 0),
    percentualMapeado: totalBrutas[0].total > 0
      ? Math.round((totalMapeamentos / Number(totalBrutas[0].total)) * 100)
      : 0,
    faltamMapear: Math.max(0, Number(totalBrutas[0].total) - totalMapeamentos),
  };

  res.json({
    success: true,
    data: stats,
  });
}));
*/

module.exports = router;
