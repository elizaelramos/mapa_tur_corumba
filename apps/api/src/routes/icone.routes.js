const express = require('express');
const { prisma } = require('@mapatur/database');
const { logger } = require('@mapatur/logger');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configurar upload de ícones
const iconStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../../uploads/icones');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'icone-' + uniqueSuffix + ext);
  }
});

const uploadIcon = multer({
  storage: iconStorage,
  limits: { fileSize: 500 * 1024 }, // 500KB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/svg+xml', 'image/jpeg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas PNG, SVG e JPG são permitidos'), false);
    }
  }
});

// ============================================================================
// ICONE ROUTES
// ============================================================================

/**
 * GET /api/icones
 * Lista todos os ícones (público para legenda)
 */
router.get('/', asyncHandler(async (req, res) => {
  const { ativo = 'true' } = req.query;
  
  const where = {};
  if (ativo === 'true') {
    where.ativo = true;
  }
  
  const icones = await prisma.pROD_Icone.findMany({
    where,
    orderBy: [
      { ordem: 'asc' },
      { nome: 'asc' }
    ],
  });
  
  res.json({
    success: true,
    data: icones,
  });
}));

/**
 * GET /api/icones/:id
 * Obter ícone por ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const icone = await prisma.pROD_Icone.findUnique({
    where: { id: parseInt(id) },
  });
  
  if (!icone) {
    return res.status(404).json({
      success: false,
      error: 'Ícone não encontrado',
    });
  }
  
  res.json({
    success: true,
    data: icone,
  });
}));

/**
 * POST /api/icones
 * Criar novo ícone (Admin)
 */
router.post('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { nome, url, ordem = 0 } = req.body;
  
  if (!nome || !url) {
    return res.status(400).json({
      success: false,
      error: 'Nome e URL são obrigatórios',
    });
  }
  
  const icone = await prisma.pROD_Icone.create({
    data: {
      nome,
      url,
      ordem: parseInt(ordem),
      ativo: true,
    },
  });
  
  logger.info(`Ícone criado: ${icone.nome} (ID ${icone.id})`);
  
  res.status(201).json({
    success: true,
    data: icone,
  });
}));

/**
 * POST /api/icones/upload
 * Upload de arquivo de ícone (Admin)
 */
router.post('/upload', authenticate, requireAdmin, uploadIcon.single('icone'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'Nenhum arquivo enviado',
    });
  }
  
  const url = `/uploads/icones/${req.file.filename}`;
  
  logger.info('Ícone uploaded', {
    filename: req.file.filename,
    path: req.file.path,
    size: req.file.size,
    url: url,
  });
  
  res.json({
    success: true,
    data: { url },
  });
}));

/**
 * PUT /api/icones/:id
 * Atualizar ícone (Admin)
 */
router.put('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nome, url, ordem, ativo } = req.body;

  // Se a URL está sendo atualizada, precisamos atualizar todas as unidades que usam o ícone
  let unidadesAtualizadas = 0;
  if (url !== undefined) {
    // Buscar o ícone atual para obter a URL antiga
    const iconeAtual = await prisma.pROD_Icone.findUnique({
      where: { id: parseInt(id) },
    });

    if (iconeAtual && iconeAtual.url !== url) {
      // NOVO: Atualizar via FK (mais robusto) - unidades com relacionamento
      const resultFK = await prisma.pROD_UnidadeTuristica.updateMany({
        where: { icone_id: parseInt(id) },
        data: { icone_url: url }, // Trigger manterá sincronização
      });
      unidadesAtualizadas = resultFK.count;

      // FALLBACK: Atualizar unidades antigas ainda usando icone_url direto
      const resultLegacy = await prisma.pROD_UnidadeTuristica.updateMany({
        where: {
          icone_id: null,
          icone_url: iconeAtual.url,
        },
        data: { icone_url: url },
      });
      unidadesAtualizadas += resultLegacy.count;

      logger.info(`URL do ícone atualizada: ${iconeAtual.url} -> ${url} (${unidadesAtualizadas} unidades atualizadas: ${resultFK.count} via FK, ${resultLegacy.count} legacy)`);
    }
  }

  const updateData = {};
  if (nome !== undefined) updateData.nome = nome;
  if (url !== undefined) updateData.url = url;
  if (ordem !== undefined) updateData.ordem = parseInt(ordem);
  if (typeof ativo === 'boolean') updateData.ativo = ativo;

  const icone = await prisma.pROD_Icone.update({
    where: { id: parseInt(id) },
    data: updateData,
  });

  logger.info(`Ícone atualizado: ${icone.nome} (ID ${icone.id})`);

  res.json({
    success: true,
    data: icone,
    unidadesAtualizadas,
  });
}));

/**
 * DELETE /api/icones/:id
 * Deletar ícone (Admin)
 */
router.delete('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Buscar o ícone para obter sua URL
  const icone = await prisma.pROD_Icone.findUnique({
    where: { id: parseInt(id) },
  });

  if (!icone) {
    return res.status(404).json({
      success: false,
      error: 'Ícone não encontrado',
    });
  }

  // Verificar se há unidades turísticas usando este ícone (tanto via FK quanto via URL)
  const unidadesUsando = await prisma.pROD_UnidadeTuristica.count({
    where: {
      OR: [
        { icone_id: parseInt(id) }, // NOVO: Via FK
        { icone_url: icone.url },    // Fallback: Via URL (compatibilidade)
      ],
    },
  });

  if (unidadesUsando > 0) {
    return res.status(400).json({
      success: false,
      error: `Não é possível excluir. ${unidadesUsando} unidade(s) turística(s) está(ão) usando este ícone.`,
    });
  }

  // Deletar o ícone permanentemente
  await prisma.pROD_Icone.delete({
    where: { id: parseInt(id) },
  });

  logger.info(`Ícone excluído: ${icone.nome} (ID ${id})`);

  res.json({
    success: true,
    message: 'Ícone excluído com sucesso',
  });
}));

/**
 * PUT /api/icones/:id/reordenar
 * Reordenar ícones (Admin)
 */
router.put('/reordenar/batch', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { icones } = req.body; // Array de { id, ordem }
  
  if (!Array.isArray(icones)) {
    return res.status(400).json({
      success: false,
      error: 'Formato inválido',
    });
  }
  
  // Atualizar ordem de cada ícone
  for (const item of icones) {
    await prisma.pROD_Icone.update({
      where: { id: item.id },
      data: { ordem: item.ordem },
    });
  }
  
  logger.info(`Ícones reordenados: ${icones.length} itens`);
  
  res.json({
    success: true,
    message: 'Ícones reordenados com sucesso',
  });
}));

module.exports = router;
