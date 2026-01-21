const express = require('express');
const { prisma } = require('@mapatur/database');
const { logger, auditLog } = require('@mapatur/logger');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// ============================================================================
// CATEGORIA ROUTES
// ============================================================================

/**
 * GET /api/categorias
 * Lista todas as categorias turísticas (público)
 */
router.get('/', asyncHandler(async (req, res) => {
  const { ativo = 'true', nome } = req.query;

  const where = {};
  if (ativo === 'true') {
    where.ativo = true;
  }
  if (nome) {
    where.nome = { contains: nome };
  }

  const categorias = await prisma.pROD_Categoria.findMany({
    where,
    orderBy: [
      { ordem: 'asc' },
      { nome: 'asc' },
      { subcategoria: 'asc' },
      { segmento: 'asc' }
    ],
    include: {
      _count: {
        select: { unidades: true }
      }
    }
  });

  res.json({
    success: true,
    data: categorias,
  });
}));

/**
 * GET /api/categorias/:id
 * Busca categoria por ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const categoria = await prisma.pROD_Categoria.findUnique({
    where: { id: parseInt(id) },
    include: {
      _count: {
        select: { unidades: true }
      }
    }
  });

  if (!categoria) {
    return res.status(404).json({
      success: false,
      error: 'Categoria não encontrada',
    });
  }

  res.json({
    success: true,
    data: categoria,
  });
}));

/**
 * GET /api/categorias/grouped/list
 * Lista categorias agrupadas por nome principal (útil para filtros)
 * Hierarquia de 3 níveis: Categoria > Subcategoria > Segmento
 */
router.get('/grouped/list', asyncHandler(async (req, res) => {
  const categorias = await prisma.pROD_Categoria.findMany({
    where: { ativo: true },
    orderBy: [
      { ordem: 'asc' },
      { nome: 'asc' },
      { subcategoria: 'asc' },
      { segmento: 'asc' }
    ]
  });

  // Agrupar por nome principal (1º nível) > subcategoria (2º nível) > segmento (3º nível)
  const grouped = categorias.reduce((acc, cat) => {
    if (!acc[cat.nome]) {
      acc[cat.nome] = {
        nome: cat.nome,
        subcategorias: {}
      };
    }

    if (cat.subcategoria) {
      if (!acc[cat.nome].subcategorias[cat.subcategoria]) {
        acc[cat.nome].subcategorias[cat.subcategoria] = {
          nome: cat.subcategoria,
          segmentos: []
        };
      }

      if (cat.segmento) {
        acc[cat.nome].subcategorias[cat.subcategoria].segmentos.push({
          id: cat.id,
          nome: cat.segmento,
          ordem: cat.ordem
        });
      } else {
        // Se não tem segmento, adiciona a própria subcategoria como item selecionável
        if (!acc[cat.nome].subcategorias[cat.subcategoria].id) {
          acc[cat.nome].subcategorias[cat.subcategoria].id = cat.id;
          acc[cat.nome].subcategorias[cat.subcategoria].ordem = cat.ordem;
        }
      }
    }
    return acc;
  }, {});

  // Transformar objeto de subcategorias em array
  const result = Object.values(grouped).map(cat => ({
    nome: cat.nome,
    subcategorias: Object.values(cat.subcategorias)
  }));

  res.json({
    success: true,
    data: result,
  });
}));

/**
 * POST /api/categorias
 * Cria nova categoria turística (requer autenticação)
 * Suporta hierarquia de 3 níveis: Categoria > Subcategoria > Segmento
 */
router.post('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { nome, subcategoria, segmento, ordem = 0 } = req.body;

  if (!nome) {
    return res.status(400).json({
      success: false,
      error: 'Nome da categoria é obrigatório',
    });
  }

  // Verificar se categoria já existe
  const existing = await prisma.pROD_Categoria.findFirst({
    where: {
      nome,
      subcategoria: subcategoria || null,
      segmento: segmento || null
    }
  });

  if (existing) {
    return res.status(400).json({
      success: false,
      error: 'Esta combinação de categoria, subcategoria e segmento já existe',
    });
  }

  const categoria = await prisma.pROD_Categoria.create({
    data: {
      nome,
      subcategoria: subcategoria || null,
      segmento: segmento || null,
      ordem: parseInt(ordem),
    },
  });

  auditLog('CREATE', 'PROD_Categoria', categoria.id, req.user.id, req.user.role);

  logger.info('Categoria criada', {
    user_id: req.user.id,
    categoria_id: categoria.id,
    nome: categoria.nome,
    subcategoria: categoria.subcategoria,
    segmento: categoria.segmento,
  });

  res.status(201).json({
    success: true,
    data: categoria,
  });
}));

/**
 * PUT /api/categorias/:id
 * Atualiza categoria turística (requer autenticação)
 */
router.put('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nome, subcategoria, segmento, ativo, ordem } = req.body;

  // Verificar se categoria existe
  const existingCategoria = await prisma.pROD_Categoria.findUnique({
    where: { id: parseInt(id) },
  });

  if (!existingCategoria) {
    return res.status(404).json({
      success: false,
      error: 'Categoria não encontrada',
    });
  }

  // Se mudou nome, subcategoria ou segmento, verificar duplicidade
  if (nome !== undefined || subcategoria !== undefined || segmento !== undefined) {
    const checkNome = nome !== undefined ? nome : existingCategoria.nome;
    const checkSubcategoria = subcategoria !== undefined ? subcategoria : existingCategoria.subcategoria;
    const checkSegmento = segmento !== undefined ? segmento : existingCategoria.segmento;

    const duplicate = await prisma.pROD_Categoria.findFirst({
      where: {
        id: { not: parseInt(id) },
        nome: checkNome,
        subcategoria: checkSubcategoria || null,
        segmento: checkSegmento || null
      }
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        error: 'Esta combinação de categoria, subcategoria e segmento já existe',
      });
    }
  }

  // Preparar dados para atualização
  const updateData = {};
  if (nome !== undefined) updateData.nome = nome;
  if (subcategoria !== undefined) updateData.subcategoria = subcategoria || null;
  if (segmento !== undefined) updateData.segmento = segmento || null;
  if (ativo !== undefined) updateData.ativo = ativo;
  if (ordem !== undefined) updateData.ordem = parseInt(ordem);

  const categoria = await prisma.pROD_Categoria.update({
    where: { id: parseInt(id) },
    data: updateData,
  });

  auditLog('UPDATE', 'PROD_Categoria', categoria.id, req.user.id, req.user.role, { updateData });

  logger.info('Categoria atualizada', {
    user_id: req.user.id,
    categoria_id: categoria.id,
    nome: categoria.nome,
    subcategoria: categoria.subcategoria,
    segmento: categoria.segmento,
  });

  res.json({
    success: true,
    data: categoria,
  });
}));

/**
 * DELETE /api/categorias/:id
 * Deleta categoria turística (requer autenticação)
 */
router.delete('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const categoria = await prisma.pROD_Categoria.findUnique({
    where: { id: parseInt(id) },
    include: {
      _count: {
        select: { unidades: true }
      }
    }
  });

  if (!categoria) {
    return res.status(404).json({
      success: false,
      error: 'Categoria não encontrada',
    });
  }

  // Verificar se categoria está sendo usada por unidades
  if (categoria._count.unidades > 0) {
    return res.status(400).json({
      success: false,
      error: `Não é possível deletar esta categoria. ${categoria._count.unidades} unidade(s) turística(s) ainda utilizam esta categoria.`,
    });
  }

  await prisma.pROD_Categoria.delete({
    where: { id: parseInt(id) },
  });

  auditLog('DELETE', 'PROD_Categoria', parseInt(id), req.user.id, req.user.role);

  logger.info('Categoria deletada', {
    user_id: req.user.id,
    categoria_id: parseInt(id),
    nome: categoria.nome,
    subcategoria: categoria.subcategoria,
    segmento: categoria.segmento,
  });

  res.json({
    success: true,
    message: 'Categoria deletada com sucesso',
  });
}));

/**
 * GET /api/categorias/stats/usage
 * Retorna estatísticas de uso das categorias
 */
router.get('/stats/usage', asyncHandler(async (req, res) => {
  const categorias = await prisma.pROD_Categoria.findMany({
    where: { ativo: true },
    include: {
      _count: {
        select: { unidades: true }
      }
    },
    orderBy: { nome: 'asc' }
  });

  const stats = categorias.map(cat => ({
    id: cat.id,
    nome: cat.nome,
    subcategoria: cat.subcategoria,
    segmento: cat.segmento,
    total_unidades: cat._count.unidades
  }));

  res.json({
    success: true,
    data: stats,
  });
}));

module.exports = router;
