const express = require('express');
const { prisma } = require('@mapatur/database');
const { logger, auditLog } = require('@mapatur/logger');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// ============================================================================
// ESCOLA ROUTES
// ============================================================================

/**
 * GET /api/unidades
 * Lista todas as escolas (público)
 */
router.get('/', asyncHandler(async (req, res) => {
  const { ativo = 'true', page = 1, limit = 100 } = req.query;

  const where = {};
  if (ativo === 'true') {
    where.ativo = true;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [escolas, total] = await Promise.all([
    prisma.pROD_Escola.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        redes_sociais: true,
        bairro: true,
        professores: {
          include: {
            professor: true,
          },
        },
        ofertas_ensino: {
          include: {
            oferta_ensino: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    }),
    prisma.pROD_Escola.count({ where }),
  ]);

  // Transformar dados para incluir redes sociais, bairro, professores e ofertas
  const escolasFormatted = escolas.map(e => ({
    ...e,
    bairro: e.bairro?.nome || null,
    redes_sociais: e.redes_sociais,
    professores: e.professores?.map(p => p.professor) || [],
    ofertas_ensino: e.ofertas_ensino?.map(o => o.oferta_ensino) || [],
  }));

  res.json({
    success: true,
    data: escolasFormatted,
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
 * Busca escola por ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const escola = await prisma.pROD_Escola.findUnique({
    where: { id: parseInt(id) },
    include: {
      redes_sociais: true,
      bairro: true,
      professores: {
        include: {
          professor: true,
        },
      },
      ofertas_ensino: {
        include: {
          oferta_ensino: true,
        },
      },
    },
  });

  if (!escola) {
    return res.status(404).json({
      success: false,
      error: 'Escola not found',
    });
  }

  res.json({
    success: true,
    data: {
      ...escola,
      bairro: escola.bairro?.nome || null,
      redes_sociais: escola.redes_sociais,
      professores: escola.professores?.map(p => p.professor) || [],
      ofertas_ensino: escola.ofertas_ensino?.map(o => o.oferta_ensino) || [],
    },
  });
}));

/**
 * POST /api/unidades
 * Cria nova escola (requer autenticação)
 */
router.post('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { nome, endereco, bairro, latitude, longitude, telefone, whatsapp, email, diretor_responsavel, horario_funcionamento, laboratorio_informatica, professores = [], ofertas_ensino = [] } = req.body;

  if (!nome || latitude === undefined || longitude === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Nome, latitude and longitude are required',
    });
  }

  // Buscar ID do bairro pelo nome, se fornecido
  let id_bairro = null;
  if (bairro) {
    const bairroRecord = await prisma.pROD_Bairro.findUnique({
      where: { nome: bairro },
    });
    if (bairroRecord) {
      id_bairro = bairroRecord.id;
    }
  }

  // Criar escola
  const escola = await prisma.pROD_Escola.create({
    data: {
      nome,
      endereco,
      id_bairro,
      latitude,
      longitude,
      telefone,
      whatsapp,
      email,
      diretor_responsavel,
      horario_funcionamento,
      laboratorio_informatica: laboratorio_informatica || false,
    },
  });

  // Adicionar professores se fornecidos
  if (professores.length > 0) {
    await prisma.junction_Escola_Professor.createMany({
      data: professores.map(professor_id => ({
        id_escola: escola.id,
        id_professor: professor_id,
      })),
    });
  }

  // Adicionar ofertas de ensino se fornecidas
  if (ofertas_ensino.length > 0) {
    await prisma.junction_Escola_OfertaEnsino.createMany({
      data: ofertas_ensino.map(oferta_id => ({
        id_escola: escola.id,
        id_oferta_ensino: oferta_id,
      })),
    });
  }

  auditLog('CREATE', 'PROD_Escola', escola.id, req.user.id, req.user.role);

  logger.info('Escola created', {
    user_id: req.user.id,
    escola_id: escola.id,
    nome: escola.nome,
  });

  res.status(201).json({
    success: true,
    data: escola,
  });
}));

/**
 * PUT /api/unidades/:id
 * Atualiza escola (requer autenticação)
 */
router.put('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nome, endereco, bairro, latitude, longitude, telefone, whatsapp, email, diretor_responsavel, horario_funcionamento, laboratorio_informatica, ativo, imagem_url, icone_url, professores, ofertas_ensino } = req.body;

  // Buscar ID do bairro pelo nome, se fornecido
  let id_bairro = undefined;
  if (bairro !== undefined) {
    if (bairro === null || bairro === '') {
      id_bairro = null;
    } else {
      const bairroRecord = await prisma.pROD_Bairro.findUnique({
        where: { nome: bairro },
      });
      if (bairroRecord) {
        id_bairro = bairroRecord.id;
      } else {
        id_bairro = null;
      }
    }
  }

  const updateData = {};
  if (nome) updateData.nome = nome;
  if (endereco !== undefined) updateData.endereco = endereco;
  if (id_bairro !== undefined) updateData.id_bairro = id_bairro;
  if (latitude !== undefined) updateData.latitude = latitude;
  if (longitude !== undefined) updateData.longitude = longitude;
  if (telefone !== undefined) updateData.telefone = telefone;
  if (whatsapp !== undefined) updateData.whatsapp = whatsapp;
  if (email !== undefined) updateData.email = email;
  if (diretor_responsavel !== undefined) updateData.diretor_responsavel = diretor_responsavel;
  if (horario_funcionamento !== undefined) updateData.horario_funcionamento = horario_funcionamento;
  if (typeof laboratorio_informatica === 'boolean') updateData.laboratorio_informatica = laboratorio_informatica;
  if (typeof ativo === 'boolean') updateData.ativo = ativo;
  if (imagem_url !== undefined) updateData.imagem_url = imagem_url;
  if (icone_url !== undefined) updateData.icone_url = icone_url;

  const escola = await prisma.pROD_Escola.update({
    where: { id: parseInt(id) },
    data: updateData,
  });

  // Atualizar professores se fornecidos
  if (professores !== undefined) {
    // Remover professores antigos
    await prisma.junction_Escola_Professor.deleteMany({
      where: { id_escola: parseInt(id) },
    });

    // Adicionar novos professores
    if (professores.length > 0) {
      await prisma.junction_Escola_Professor.createMany({
        data: professores.map(professor_id => ({
          id_escola: parseInt(id),
          id_professor: professor_id,
        })),
      });
    }
  }

  // Atualizar ofertas de ensino se fornecidas
  if (ofertas_ensino !== undefined) {
    // Remover ofertas antigas
    await prisma.junction_Escola_OfertaEnsino.deleteMany({
      where: { id_escola: parseInt(id) },
    });

    // Adicionar novas ofertas
    if (ofertas_ensino.length > 0) {
      await prisma.junction_Escola_OfertaEnsino.createMany({
        data: ofertas_ensino.map(oferta_id => ({
          id_escola: parseInt(id),
          id_oferta_ensino: oferta_id,
        })),
      });
    }
  }

  auditLog('UPDATE', 'PROD_Escola', parseInt(id), req.user.id, req.user.role, {
    updated_fields: Object.keys(updateData),
  });

  logger.info('Escola updated', {
    user_id: req.user.id,
    escola_id: parseInt(id),
    updated_fields: Object.keys(updateData),
  });

  res.json({
    success: true,
    data: escola,
  });
}));

/**
 * GET /api/unidades/bairros/list
 * Lista todos os bairros cadastrados (público)
 */
router.get('/bairros/list', asyncHandler(async (req, res) => {
  const bairros = await prisma.pROD_Bairro.findMany({
    where: { ativo: true },
    select: { nome: true },
    orderBy: { nome: 'asc' },
  });

  // Retornar apenas os nomes
  const bairrosNomes = bairros.map(b => b.nome);

  res.json({
    success: true,
    data: bairrosNomes,
  });
}));

/**
 * GET /api/unidades/stats/last-update
 * Retorna a data da última atualização das escolas (público)
 */
router.get('/stats/last-update', asyncHandler(async (req, res) => {
  // Buscar o último registro de UPDATE na tabela PROD_Escola
  const lastUpdate = await prisma.aUDIT_LOG.findFirst({
    where: {
      tabela: 'PROD_Escola',
      operacao: 'UPDATE',
    },
    orderBy: {
      timestamp: 'desc',
    },
    select: {
      timestamp: true,
    },
  });

  res.json({
    success: true,
    data: {
      lastUpdate: lastUpdate?.timestamp || null,
    },
  });
}));

/**
 * GET /api/unidades/:id/professores
 * Busca professores que lecionam em uma escola (baseado na relação direta escola-professor)
 */
router.get('/:id/professores', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Buscar professores que lecionam nesta escola através da junction table
  const junctionRecords = await prisma.junction_Escola_Professor.findMany({
    where: { id_escola: parseInt(id) },
    include: {
      professor: true,
    },
  });

  // Filtrar apenas professores ativos e formatar dados
  const professoresAtivos = junctionRecords
    .map(j => j.professor)
    .filter(p => p.ativo);

  // Ordenar por nome
  professoresAtivos.sort((a, b) => a.nome.localeCompare(b.nome));

  res.json({
    success: true,
    data: professoresAtivos,
  });
}));

/**
 * GET /api/unidades/:id/medicos
 * Alias para /professores (mantido para compatibilidade)
 */
router.get('/:id/medicos', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Buscar professores que lecionam nesta escola através da junction table
  const junctionRecords = await prisma.junction_Escola_Professor.findMany({
    where: { id_escola: parseInt(id) },
    include: {
      professor: true,
    },
  });

  // Filtrar apenas professores ativos e formatar dados
  const professoresAtivos = junctionRecords
    .map(j => j.professor)
    .filter(p => p.ativo);

  // Ordenar por nome
  professoresAtivos.sort((a, b) => a.nome.localeCompare(b.nome));

  res.json({
    success: true,
    data: professoresAtivos,
  });
}));

/**
 * GET /api/unidades/:id/redes-sociais
 * Busca redes sociais de uma escola
 */
router.get('/:id/redes-sociais', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const redesSociais = await prisma.pROD_Escola_RedeSocial.findMany({
    where: { id_escola: parseInt(id) },
    orderBy: { created_at: 'asc' },
  });

  res.json({
    success: true,
    data: redesSociais,
  });
}));

/**
 * POST /api/unidades/:id/redes-sociais
 * Adiciona rede social a uma escola (requer autenticação)
 */
router.post('/:id/redes-sociais', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nome_rede, url_perfil } = req.body;

  if (!nome_rede || !url_perfil) {
    return res.status(400).json({
      success: false,
      error: 'nome_rede and url_perfil are required',
    });
  }

  // Verificar se a escola existe
  const escola = await prisma.pROD_Escola.findUnique({
    where: { id: parseInt(id) },
  });

  if (!escola) {
    return res.status(404).json({
      success: false,
      error: 'Escola not found',
    });
  }

  // Verificar se já não existe uma rede social com o mesmo nome para esta escola
  const existingRede = await prisma.pROD_Escola_RedeSocial.findFirst({
    where: {
      id_escola: parseInt(id),
      nome_rede: nome_rede,
    },
  });

  if (existingRede) {
    return res.status(400).json({
      success: false,
      error: 'Esta rede social já está cadastrada para esta escola',
    });
  }

  // Verificar limite de 3 redes sociais por escola
  const totalRedes = await prisma.pROD_Escola_RedeSocial.count({
    where: { id_escola: parseInt(id) },
  });

  if (totalRedes >= 3) {
    return res.status(400).json({
      success: false,
      error: 'Limite máximo de 3 redes sociais por escola atingido',
    });
  }

  const redeSocial = await prisma.pROD_Escola_RedeSocial.create({
    data: {
      id_escola: parseInt(id),
      nome_rede,
      url_perfil,
    },
  });

  auditLog('INSERT', 'PROD_Escola_RedeSocial', redeSocial.id, req.user.id, req.user.role);

  logger.info('Rede social added to escola', {
    user_id: req.user.id,
    escola_id: parseInt(id),
    rede_social_id: redeSocial.id,
    nome_rede: nome_rede,
  });

  res.status(201).json({
    success: true,
    data: redeSocial,
  });
}));

/**
 * PUT /api/unidades/:id/redes-sociais/:redeId
 * Atualiza rede social de uma escola (requer autenticação)
 */
router.put('/:id/redes-sociais/:redeId', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id, redeId } = req.params;
  const { nome_rede, url_perfil } = req.body;

  if (!nome_rede || !url_perfil) {
    return res.status(400).json({
      success: false,
      error: 'nome_rede and url_perfil are required',
    });
  }

  // Verificar se a rede social existe e pertence à escola
  const redeSocial = await prisma.pROD_Escola_RedeSocial.findFirst({
    where: {
      id: parseInt(redeId),
      id_escola: parseInt(id),
    },
  });

  if (!redeSocial) {
    return res.status(404).json({
      success: false,
      error: 'Rede social not found for this escola',
    });
  }

  // Verificar se já não existe outra rede social com o mesmo nome para esta escola (exceto a atual)
  if (nome_rede !== redeSocial.nome_rede) {
    const existingRede = await prisma.pROD_Escola_RedeSocial.findFirst({
      where: {
        id_escola: parseInt(id),
        nome_rede: nome_rede,
        id: { not: parseInt(redeId) },
      },
    });

    if (existingRede) {
      return res.status(400).json({
        success: false,
        error: 'Esta rede social já está cadastrada para esta escola',
      });
    }
  }

  const updatedRede = await prisma.pROD_Escola_RedeSocial.update({
    where: { id: parseInt(redeId) },
    data: {
      nome_rede,
      url_perfil,
    },
  });

  auditLog('UPDATE', 'PROD_Escola_RedeSocial', parseInt(redeId), req.user.id, req.user.role);

  logger.info('Rede social updated for escola', {
    user_id: req.user.id,
    escola_id: parseInt(id),
    rede_social_id: parseInt(redeId),
    nome_rede: nome_rede,
  });

  res.json({
    success: true,
    data: updatedRede,
  });
}));

/**
 * DELETE /api/unidades/:id/redes-sociais/:redeId
 * Remove rede social de uma escola (requer autenticação)
 */
router.delete('/:id/redes-sociais/:redeId', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id, redeId } = req.params;

  // Verificar se a rede social existe e pertence à escola
  const redeSocial = await prisma.pROD_Escola_RedeSocial.findFirst({
    where: {
      id: parseInt(redeId),
      id_escola: parseInt(id),
    },
  });

  if (!redeSocial) {
    return res.status(404).json({
      success: false,
      error: 'Rede social not found for this escola',
    });
  }

  await prisma.pROD_Escola_RedeSocial.delete({
    where: { id: parseInt(redeId) },
  });

  auditLog('DELETE', 'PROD_Escola_RedeSocial', parseInt(redeId), req.user.id, req.user.role);

  logger.info('Rede social deleted from escola', {
    user_id: req.user.id,
    escola_id: parseInt(id),
    rede_social_id: parseInt(redeId),
  });

  res.json({
    success: true,
    message: 'Rede social deleted successfully',
  });
}));

module.exports = router;
