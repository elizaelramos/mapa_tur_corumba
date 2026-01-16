const express = require('express');
const { prisma } = require('@mapatur/database');
const { authenticate, requireSuperadmin } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// ============================================================================
// PUBLIC ROUTES - Rotas públicas (sem autenticação)
// ============================================================================

/**
 * GET /api/etl/last-execution
 * Retorna apenas a última execução do ETL (público)
 */
router.get('/last-execution', asyncHandler(async (req, res) => {
  const lastExecution = await prisma.eTL_Execution.findFirst({
    orderBy: { started_at: 'desc' },
    select: {
      id: true,
      started_at: true,
      finished_at: true,
      status: true,
    },
  });

  res.json({
    success: true,
    data: {
      lastExecution: lastExecution,
    },
  });
}));

// ============================================================================
// PROTECTED ROUTES - Todas as rotas abaixo requerem Superadmin
// ============================================================================
router.use(authenticate);
router.use(requireSuperadmin);

// ============================================================================
// ETL ROUTES - Monitoramento e controle do ETL
// ============================================================================

/**
 * GET /api/etl/executions
 * Lista execuções do ETL
 */
router.get('/executions', asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  
  const where = {};
  if (status) where.status = status;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [executions, total] = await Promise.all([
    prisma.eTL_Execution.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { started_at: 'desc' },
    }),
    prisma.eTL_Execution.count({ where }),
  ]);
  
  res.json({
    success: true,
    data: executions,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
}));

/**
 * GET /api/etl/executions/:id
 * Busca execução específica do ETL
 */
router.get('/executions/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const execution = await prisma.eTL_Execution.findUnique({
    where: { id: parseInt(id) },
  });
  
  if (!execution) {
    return res.status(404).json({
      success: false,
      error: 'ETL execution not found',
    });
  }
  
  res.json({
    success: true,
    data: execution,
  });
}));

/**
 * GET /api/etl/stats
 * Estatísticas do ETL
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const [
    lastExecution,
    totalExecutions,
    successfulExecutions,
    failedExecutions,
    stagingStats,
  ] = await Promise.all([
    prisma.eTL_Execution.findFirst({
      orderBy: { started_at: 'desc' },
    }),
    prisma.eTL_Execution.count(),
    prisma.eTL_Execution.count({ where: { status: 'completed' } }),
    prisma.eTL_Execution.count({ where: { status: 'failed' } }),
    prisma.sTAGING_Info_Origem.groupBy({
      by: ['status_processamento'],
      _count: true,
    }),
  ]);
  
  res.json({
    success: true,
    data: {
      last_execution: lastExecution,
      total_executions: totalExecutions,
      successful_executions: successfulExecutions,
      failed_executions: failedExecutions,
      staging_stats: stagingStats,
    },
  });
}));

module.exports = router;
