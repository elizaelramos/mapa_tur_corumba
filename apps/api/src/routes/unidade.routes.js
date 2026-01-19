const express = require('express');
const { prisma } = require('@mapatur/database');
const { logger, auditLog } = require('@mapatur/logger');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// ============================================================================
// UNIDADE TURÍSTICA ROUTES
// ============================================================================

/**
 * GET /api/unidades
 * Lista todas as unidades turísticas (público)
 */
router.get('/', asyncHandler(async (req, res) => {
  const { ativo = 'true', page = 1, limit = 100 } = req.query;

  const where = {};
  if (ativo === 'true') {
    where.ativo = true;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [unidades, total] = await Promise.all([
    prisma.pROD_UnidadeTuristica.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        redes_sociais: true,
        bairro: true,
        categorias: {
          include: {
            categoria: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    }),
    prisma.pROD_UnidadeTuristica.count({ where }),
  ]);

  // Transformar dados para incluir redes sociais, bairro e categorias
  const unidadesFormatted = unidades.map(u => ({
    ...u,
    bairro: u.bairro?.nome || null,
    redes_sociais: u.redes_sociais,
    categorias: u.categorias?.map(c => c.categoria) || [],
  }));

  res.json({
    success: true,
    data: unidadesFormatted,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
}));

/**
 * GET /api/unidades/:id
 * Busca unidade turística por ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const unidade = await prisma.pROD_UnidadeTuristica.findUnique({
    where: { id: parseInt(id) },
    include: {
      redes_sociais: true,
      bairro: true,
      categorias: {
        include: {
          categoria: true,
        },
      },
    },
  });

  if (!unidade) {
    return res.status(404).json({
      success: false,
      error: 'Unidade turística não encontrada',
    });
  }

  res.json({
    success: true,
    data: {
      ...unidade,
      bairro: unidade.bairro?.nome || null,
      redes_sociais: unidade.redes_sociais,
      categorias: unidade.categorias?.map(c => c.categoria) || [],
    },
  });
}));

/**
 * POST /api/unidades
 * Cria nova unidade turística (requer autenticação)
 */
router.post('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const {
    nome,
    nome_fantasia,
    razao_social,
    cnpj,
    setor,
    endereco,
    bairro,
    latitude,
    longitude,
    telefone,
    whatsapp,
    email,
    horario_funcionamento,
    descricao_servicos,
    imagem_url,
    icone_url,
    data_cadastro,
    data_vencimento,
    categorias = []
  } = req.body;

  if (!nome || latitude === undefined || longitude === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Nome, latitude e longitude são obrigatórios',
    });
  }

  // Buscar ID do bairro pelo nome, se fornecido
  let bairroConnect = undefined;
  if (bairro) {
    const bairroRecord = await prisma.pROD_Bairro.findUnique({
      where: { nome: bairro },
    });
    if (bairroRecord) {
      bairroConnect = { connect: { id: bairroRecord.id } };
    }
  }

  // Criar unidade turística
  const unidade = await prisma.pROD_UnidadeTuristica.create({
    data: {
      nome,
      nome_fantasia,
      razao_social,
      cnpj,
      setor,
      endereco,
      bairro: bairroConnect,
      latitude,
      longitude,
      telefone,
      whatsapp,
      email,
      horario_funcionamento,
      descricao_servicos,
      imagem_url,
      icone_url,
      data_cadastro: data_cadastro ? new Date(data_cadastro) : null,
      data_vencimento: data_vencimento ? new Date(data_vencimento) : null,
    },
  });

  // Adicionar categorias se fornecidas
  if (categorias.length > 0) {
    await prisma.junction_UnidadeTuristica_Categoria.createMany({
      data: categorias.map(categoria_id => ({
        id_unidade: unidade.id,
        id_categoria: categoria_id,
      })),
    });
  }

  auditLog('CREATE', 'PROD_UnidadeTuristica', unidade.id, req.user.id, req.user.role);

  logger.info('Unidade turística criada', {
    user_id: req.user.id,
    unidade_id: unidade.id,
    nome: unidade.nome,
  });

  res.status(201).json({
    success: true,
    data: unidade,
  });
}));

/**
 * PUT /api/unidades/:id
 * Atualiza unidade turística (requer autenticação)
 */
router.put('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    nome,
    nome_fantasia,
    razao_social,
    cnpj,
    setor,
    endereco,
    bairro,
    latitude,
    longitude,
    telefone,
    whatsapp,
    email,
    horario_funcionamento,
    descricao_servicos,
    ativo,
    imagem_url,
    icone_url,
    data_cadastro,
    data_vencimento,
    categorias
  } = req.body;

  // Verificar se unidade existe
  const existingUnidade = await prisma.pROD_UnidadeTuristica.findUnique({
    where: { id: parseInt(id) },
  });

  if (!existingUnidade) {
    return res.status(404).json({
      success: false,
      error: 'Unidade turística não encontrada',
    });
  }

  // Buscar ID do bairro pelo nome, se fornecido
  let bairroConnect = undefined;
  if (bairro !== undefined) {
    if (bairro === null) {
      bairroConnect = { disconnect: true };
    } else {
      const bairroRecord = await prisma.pROD_Bairro.findUnique({
        where: { nome: bairro },
      });
      if (bairroRecord) {
        bairroConnect = { connect: { id: bairroRecord.id } };
      }
    }
  }

  // Preparar dados para atualização
  const updateData = {};
  if (nome !== undefined) updateData.nome = nome;
  if (nome_fantasia !== undefined) updateData.nome_fantasia = nome_fantasia;
  if (razao_social !== undefined) updateData.razao_social = razao_social;
  if (cnpj !== undefined) updateData.cnpj = cnpj;
  if (setor !== undefined) updateData.setor = setor;
  if (endereco !== undefined) updateData.endereco = endereco;
  if (bairroConnect !== undefined) updateData.bairro = bairroConnect;
  if (latitude !== undefined) updateData.latitude = latitude;
  if (longitude !== undefined) updateData.longitude = longitude;
  if (telefone !== undefined) updateData.telefone = telefone;
  if (whatsapp !== undefined) updateData.whatsapp = whatsapp;
  if (email !== undefined) updateData.email = email;
  if (horario_funcionamento !== undefined) updateData.horario_funcionamento = horario_funcionamento;
  if (descricao_servicos !== undefined) updateData.descricao_servicos = descricao_servicos;
  if (ativo !== undefined) updateData.ativo = ativo;
  if (imagem_url !== undefined) updateData.imagem_url = imagem_url;
  if (icone_url !== undefined) updateData.icone_url = icone_url;
  if (data_cadastro !== undefined) updateData.data_cadastro = data_cadastro ? new Date(data_cadastro) : null;
  if (data_vencimento !== undefined) updateData.data_vencimento = data_vencimento ? new Date(data_vencimento) : null;

  // Atualizar unidade
  const unidade = await prisma.pROD_UnidadeTuristica.update({
    where: { id: parseInt(id) },
    data: updateData,
  });

  // Atualizar categorias se fornecidas
  if (categorias !== undefined) {
    // Remover categorias antigas
    await prisma.junction_UnidadeTuristica_Categoria.deleteMany({
      where: { id_unidade: parseInt(id) },
    });

    // Adicionar novas categorias
    if (categorias.length > 0) {
      await prisma.junction_UnidadeTuristica_Categoria.createMany({
        data: categorias.map(categoria_id => ({
          id_unidade: parseInt(id),
          id_categoria: categoria_id,
        })),
      });
    }
  }

  auditLog('UPDATE', 'PROD_UnidadeTuristica', unidade.id, req.user.id, req.user.role, { updateData });

  logger.info('Unidade turística atualizada', {
    user_id: req.user.id,
    unidade_id: unidade.id,
    nome: unidade.nome,
  });

  res.json({
    success: true,
    data: unidade,
  });
}));

/**
 * DELETE /api/unidades/:id
 * Deleta unidade turística (requer autenticação)
 */
router.delete('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const unidade = await prisma.pROD_UnidadeTuristica.findUnique({
    where: { id: parseInt(id) },
  });

  if (!unidade) {
    return res.status(404).json({
      success: false,
      error: 'Unidade turística não encontrada',
    });
  }

  await prisma.pROD_UnidadeTuristica.delete({
    where: { id: parseInt(id) },
  });

  auditLog('DELETE', 'PROD_UnidadeTuristica', parseInt(id), req.user.id, req.user.role);

  logger.info('Unidade turística deletada', {
    user_id: req.user.id,
    unidade_id: parseInt(id),
    nome: unidade.nome,
  });

  res.json({
    success: true,
    message: 'Unidade turística deletada com sucesso',
  });
}));

// ============================================================================
// REDES SOCIAIS
// ============================================================================

/**
 * GET /api/unidades/:id/redes-sociais
 * Lista redes sociais de uma unidade turística
 */
router.get('/:id/redes-sociais', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const redesSociais = await prisma.pROD_UnidadeTuristica_RedeSocial.findMany({
    where: { id_unidade: parseInt(id) },
  });

  res.json({
    success: true,
    data: redesSociais,
  });
}));

/**
 * POST /api/unidades/:id/redes-sociais
 * Adiciona rede social a uma unidade turística
 */
router.post('/:id/redes-sociais', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nome_rede, url_perfil } = req.body;

  if (!nome_rede || !url_perfil) {
    return res.status(400).json({
      success: false,
      error: 'nome_rede e url_perfil são obrigatórios',
    });
  }

  // Verificar se unidade existe
  const unidade = await prisma.pROD_UnidadeTuristica.findUnique({
    where: { id: parseInt(id) },
  });

  if (!unidade) {
    return res.status(404).json({
      success: false,
      error: 'Unidade turística não encontrada',
    });
  }

  // Verificar limite de 3 redes sociais
  const count = await prisma.pROD_UnidadeTuristica_RedeSocial.count({
    where: { id_unidade: parseInt(id) },
  });

  if (count >= 3) {
    return res.status(400).json({
      success: false,
      error: 'Limite máximo de 3 redes sociais atingido',
    });
  }

  // Verificar se rede social já existe para esta unidade
  const existing = await prisma.pROD_UnidadeTuristica_RedeSocial.findFirst({
    where: {
      id_unidade: parseInt(id),
      nome_rede,
    },
  });

  if (existing) {
    return res.status(400).json({
      success: false,
      error: 'Rede social já cadastrada para esta unidade',
    });
  }

  const redeSocial = await prisma.pROD_UnidadeTuristica_RedeSocial.create({
    data: {
      id_unidade: parseInt(id),
      nome_rede,
      url_perfil,
    },
  });

  logger.info('Rede social adicionada', {
    user_id: req.user.id,
    unidade_id: parseInt(id),
    rede_social_id: redeSocial.id,
  });

  res.status(201).json({
    success: true,
    data: redeSocial,
  });
}));

/**
 * PUT /api/unidades/:id/redes-sociais/:redeId
 * Atualiza rede social de uma unidade turística
 */
router.put('/:id/redes-sociais/:redeId', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id, redeId } = req.params;
  const { nome_rede, url_perfil } = req.body;

  const redeSocial = await prisma.pROD_UnidadeTuristica_RedeSocial.findFirst({
    where: {
      id: parseInt(redeId),
      id_unidade: parseInt(id),
    },
  });

  if (!redeSocial) {
    return res.status(404).json({
      success: false,
      error: 'Rede social não encontrada',
    });
  }

  const updated = await prisma.pROD_UnidadeTuristica_RedeSocial.update({
    where: { id: parseInt(redeId) },
    data: {
      ...(nome_rede && { nome_rede }),
      ...(url_perfil && { url_perfil }),
    },
  });

  logger.info('Rede social atualizada', {
    user_id: req.user.id,
    unidade_id: parseInt(id),
    rede_social_id: parseInt(redeId),
  });

  res.json({
    success: true,
    data: updated,
  });
}));

/**
 * DELETE /api/unidades/:id/redes-sociais/:redeId
 * Remove rede social de uma unidade turística
 */
router.delete('/:id/redes-sociais/:redeId', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id, redeId } = req.params;

  const redeSocial = await prisma.pROD_UnidadeTuristica_RedeSocial.findFirst({
    where: {
      id: parseInt(redeId),
      id_unidade: parseInt(id),
    },
  });

  if (!redeSocial) {
    return res.status(404).json({
      success: false,
      error: 'Rede social não encontrada',
    });
  }

  await prisma.pROD_UnidadeTuristica_RedeSocial.delete({
    where: { id: parseInt(redeId) },
  });

  logger.info('Rede social removida', {
    user_id: req.user.id,
    unidade_id: parseInt(id),
    rede_social_id: parseInt(redeId),
  });

  res.json({
    success: true,
    message: 'Rede social removida com sucesso',
  });
}));

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * GET /api/unidades/bairros/list
 * Lista todos os bairros disponíveis
 */
router.get('/bairros/list', asyncHandler(async (req, res) => {
  const bairros = await prisma.pROD_Bairro.findMany({
    where: { ativo: true },
    orderBy: { nome: 'asc' },
  });

  res.json({
    success: true,
    data: bairros,
  });
}));

/**
 * GET /api/unidades/stats/last-update
 * Retorna timestamp da última atualização
 */
router.get('/stats/last-update', asyncHandler(async (req, res) => {
  const lastUnidade = await prisma.pROD_UnidadeTuristica.findFirst({
    orderBy: { updated_at: 'desc' },
    select: { updated_at: true },
  });

  res.json({
    success: true,
    data: {
      last_update: lastUnidade?.updated_at || null,
    },
  });
}));

module.exports = router;
