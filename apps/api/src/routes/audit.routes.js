const express = require('express');
const { prisma } = require('@mapatur/database');
const { authenticate, requireSuperadmin } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// Todas as rotas de auditoria requerem Superadmin
router.use(authenticate);
router.use(requireSuperadmin);

// ============================================================================
// AUDIT ROUTES - Acesso aos logs de auditoria
// ============================================================================

/**
 * GET /api/audit
 * Lista logs de auditoria com filtros
 */
router.get('/', asyncHandler(async (req, res) => {
  const { 
    tabela, 
    operacao, 
    user_id, 
    start_date, 
    end_date,
    page = 1, 
    limit = 50 
  } = req.query;
  
  const where = {};
  
  if (tabela) where.tabela = tabela;
  if (operacao) where.operacao = operacao;
  
  // Suporte para filtrar por user_id=null (ações do sistema)
  if (user_id !== undefined) {
    where.user_id = user_id === 'null' ? null : parseInt(user_id);
  }
  
  if (start_date || end_date) {
    where.timestamp = {};
    if (start_date) where.timestamp.gte = new Date(start_date);
    if (end_date) where.timestamp.lte = new Date(end_date);
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [logs, total] = await Promise.all([
    prisma.aUDIT_LOG.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    }),
    prisma.aUDIT_LOG.count({ where }),
  ]);
  
  res.json({
    success: true,
    data: logs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
}));

/**
 * GET /api/audit/:id
 * Busca log de auditoria específico
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const log = await prisma.aUDIT_LOG.findUnique({
    where: { id: parseInt(id) },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
        },
      },
    },
  });
  
  if (!log) {
    return res.status(404).json({
      success: false,
      error: 'Audit log not found',
    });
  }
  
  res.json({
    success: true,
    data: log,
  });
}));

/**
 * GET /api/audit/stats/summary
 * Estatísticas de auditoria
 */
router.get('/stats/summary', asyncHandler(async (req, res) => {
  const { start_date, end_date } = req.query;
  
  const where = {};
  if (start_date || end_date) {
    where.timestamp = {};
    if (start_date) where.timestamp.gte = new Date(start_date);
    if (end_date) where.timestamp.lte = new Date(end_date);
  }
  
  const [
    totalLogs,
    byOperation,
    byTable,
    byUser,
  ] = await Promise.all([
    prisma.aUDIT_LOG.count({ where }),
    prisma.aUDIT_LOG.groupBy({
      by: ['operacao'],
      where,
      _count: true,
    }),
    prisma.aUDIT_LOG.groupBy({
      by: ['tabela'],
      where,
      _count: true,
    }),
    prisma.aUDIT_LOG.groupBy({
      by: ['user_id'],
      where,
      _count: true,
    }),
  ]);
  
  // Converter BigInt para Number para serialização JSON
  const serializeGroupBy = (items) => items.map(item => ({
    ...item,
    _count: typeof item._count === 'object'
      ? Object.fromEntries(Object.entries(item._count).map(([k, v]) => [k, Number(v)]))
      : Number(item._count),
  }));

  res.json({
    success: true,
    data: {
      total: totalLogs,
      by_operation: serializeGroupBy(byOperation),
      by_table: serializeGroupBy(byTable),
      by_user: serializeGroupBy(byUser),
    },
  });
}));

module.exports = router;
