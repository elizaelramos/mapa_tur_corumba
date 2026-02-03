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
 * GET /api/categorias/:id/unidades
 * Lista unidades que utilizam a categoria (público)
 */
router.get('/:id/unidades', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const categoriaId = parseInt(id);

  const unidades = await prisma.pROD_UnidadeTuristica.findMany({
    where: {
      categorias: { some: { id_categoria: categoriaId } }
    },
    include: {
      bairro: true,
      categorias: {
        include: { categoria: true }
      },
    },
    orderBy: { nome: 'asc' }
  });

  const unidadesFormatted = unidades.map(u => ({
    ...u,
    bairro: u.bairro?.nome || null,
    categorias: u.categorias?.map(c => c.categoria) || [],
  }));

  res.json({
    success: true,
    data: unidadesFormatted,
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
    ],
    include: {
      _count: {
        select: { unidades: true }
      }
    }
  });

  // Filtrar apenas categorias com unidades vinculadas
  const categoriasComUnidades = categorias.filter(cat => cat._count.unidades > 0);

  // Agrupar por nome principal (1º nível) > subcategoria (2º nível) > segmento (3º nível)
  const grouped = categoriasComUnidades.reduce((acc, cat) => {
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
 * GET /api/categorias/hierarchy/admin
 * Retorna hierarquia completa para interface administrativa (Miller Columns)
 * Inclui contagem de unidades e status ativo/inativo
 */
router.get('/hierarchy/admin', asyncHandler(async (req, res) => {
  const categorias = await prisma.pROD_Categoria.findMany({
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

  // Estrutura hierárquica para Miller Columns
  const hierarchy = {
    categorias: {}, // Nível 1: Categorias principais
    subcategorias: {}, // Nível 2: Subcategorias por categoria
    segmentos: {} // Nível 3: Segmentos por subcategoria
  };

  // Normalizar nomes para agrupar variações (ex: "Onde Passear-ok" -> "Onde Passear")
  const normalizeName = (raw) => {
    if (!raw && raw !== '') return raw;
    let s = String(raw).trim();
    // Remover sufixos comuns como '-ok', '_ok' ou ' ok' no final
    s = s.replace(/[-_ ]?ok$/i, '');
    // Remover dois-pontos e espaços finais
    s = s.replace(/[:\s]+$/g, '');
    // Colapsar espaços múltiplos
    s = s.replace(/\s+/g, ' ');
    return s;
  };

  categorias.forEach(cat => {
    const nomeCan = normalizeName(cat.nome);
    const subCan = cat.subcategoria ? normalizeName(cat.subcategoria) : null;
    const segCan = cat.segmento ? normalizeName(cat.segmento) : null;

    // Nível 1: Categorias principais (registros onde subcategoria e segmento são null)
    if (!cat.subcategoria && !cat.segmento) {
      if (!hierarchy.categorias[nomeCan]) {
        hierarchy.categorias[nomeCan] = {
          id: cat.id,
          nome: nomeCan,
          ordem: cat.ordem,
          ativo: cat.ativo,
          total_unidades: cat._count.unidades
        };
      } else {
        // somar contagem de unidades caso haja múltiplos registros canônicos
        hierarchy.categorias[nomeCan].total_unidades += (cat._count.unidades || 0);
      }
    }

    // Nível 2: Subcategorias (registros onde subcategoria existe mas segmento é null)
    if (cat.subcategoria && !cat.segmento) {
      const key = `${nomeCan}`;
      if (!hierarchy.subcategorias[key]) {
        hierarchy.subcategorias[key] = [];
      }
      hierarchy.subcategorias[key].push({
        id: cat.id,
        nome: subCan,
        categoriaPai: nomeCan,
        ordem: cat.ordem,
        ativo: cat.ativo,
        total_unidades: cat._count.unidades
      });
    }

    // Nível 3: Segmentos (registros onde segmento existe)
    if (cat.subcategoria && cat.segmento) {
      const key = `${nomeCan}|${subCan}`;
      if (!hierarchy.segmentos[key]) {
        hierarchy.segmentos[key] = [];
      }
      hierarchy.segmentos[key].push({
        id: cat.id,
        nome: segCan,
        categoriaPai: nomeCan,
        subcategoriaPai: subCan,
        ordem: cat.ordem,
        ativo: cat.ativo,
        total_unidades: cat._count.unidades
      });
    }
  });

  // Garantir que exista uma entrada de "categoria principal" para
  // cada nome de categoria encontrado nos registros. Isso corrige casos
  // em que existem subcategorias/segmentos para um nome de categoria,
  // mas não existe o registro pai (subcategoria IS NULL, segmento IS NULL).
  // Garantir que exista uma entrada de "categoria principal" para cada nome canônico
  const nomesPresentesCan = new Set(categorias.map(c => normalizeName(c.nome)));

  for (const nome of nomesPresentesCan) {
    if (!hierarchy.categorias[nome]) {
      const regs = categorias.filter(c => normalizeName(c.nome) === nome);
      const total_unidades = regs.reduce((s, r) => s + (r._count?.unidades || 0), 0);
      const ordem = regs.reduce((min, r) => (r.ordem < min ? r.ordem : min), regs[0].ordem || 0);
      const ativo = regs.some(r => r.ativo === true);
      const id = regs.reduce((min, r) => (r.id < min ? r.id : min), regs[0].id);

      hierarchy.categorias[nome] = {
        id,
        nome,
        ordem,
        ativo,
        total_unidades
      };
    }
  }

  // Converter objetos para arrays ordenados
  const result = {
    categorias: Object.values(hierarchy.categorias).sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome)),
    subcategorias: Object.keys(hierarchy.subcategorias).reduce((acc, key) => {
      acc[key] = hierarchy.subcategorias[key].sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome));
      return acc;
    }, {}),
    segmentos: Object.keys(hierarchy.segmentos).reduce((acc, key) => {
      acc[key] = hierarchy.segmentos[key].sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome));
      return acc;
    }, {})
  };

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

  await auditLog('CREATE', 'PROD_Categoria', categoria.id, req.user.id, req.user.role);

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
 * POST /api/categorias/subcategoria
 * Cria nova subcategoria vinculada a uma categoria pai (requer autenticação)
 */
router.post('/subcategoria', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { categoriaPai, nome, ordem = 0, ativo = true } = req.body;

  if (!categoriaPai || !nome) {
    return res.status(400).json({
      success: false,
      error: 'Categoria pai e nome da subcategoria são obrigatórios',
    });
  }

  // Verificar se subcategoria já existe
  const existing = await prisma.pROD_Categoria.findFirst({
    where: {
      nome: categoriaPai,
      subcategoria: nome,
      segmento: null
    }
  });

  if (existing) {
    return res.status(400).json({
      success: false,
      error: 'Esta subcategoria já existe nesta categoria',
    });
  }

  const subcategoria = await prisma.pROD_Categoria.create({
    data: {
      nome: categoriaPai,
      subcategoria: nome,
      segmento: null,
      ordem: parseInt(ordem),
      ativo,
    },
  });

  await auditLog('CREATE', 'PROD_Categoria', subcategoria.id, req.user.id, req.user.role);

  logger.info('Subcategoria criada', {
    user_id: req.user.id,
    subcategoria_id: subcategoria.id,
    categoria_pai: categoriaPai,
    subcategoria: nome,
  });

  res.status(201).json({
    success: true,
    data: subcategoria,
  });
}));

/**
 * POST /api/categorias/segmento
 * Cria novo segmento vinculado a uma subcategoria (requer autenticação)
 */
router.post('/segmento', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { categoriaPai, subcategoriaPai, nome, ordem = 0, ativo = true } = req.body;

  if (!categoriaPai || !subcategoriaPai || !nome) {
    return res.status(400).json({
      success: false,
      error: 'Categoria pai, subcategoria pai e nome do segmento são obrigatórios',
    });
  }

  // Verificar se segmento já existe
  const existing = await prisma.pROD_Categoria.findFirst({
    where: {
      nome: categoriaPai,
      subcategoria: subcategoriaPai,
      segmento: nome
    }
  });

  if (existing) {
    return res.status(400).json({
      success: false,
      error: 'Este segmento já existe nesta subcategoria',
    });
  }

  const segmento = await prisma.pROD_Categoria.create({
    data: {
      nome: categoriaPai,
      subcategoria: subcategoriaPai,
      segmento: nome,
      ordem: parseInt(ordem),
      ativo,
    },
  });

  await auditLog('CREATE', 'PROD_Categoria', segmento.id, req.user.id, req.user.role);

  logger.info('Segmento criado', {
    user_id: req.user.id,
    segmento_id: segmento.id,
    categoria_pai: categoriaPai,
    subcategoria_pai: subcategoriaPai,
    segmento: nome,
  });

  res.status(201).json({
    success: true,
    data: segmento,
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

  await auditLog('UPDATE', 'PROD_Categoria', categoria.id, req.user.id, req.user.role, { updateData });

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

  await auditLog('DELETE', 'PROD_Categoria', parseInt(id), req.user.id, req.user.role);

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
