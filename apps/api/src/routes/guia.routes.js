const express = require('express');
const { prisma } = require('@mapatur/database');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { auditLog } = require('@mapatur/logger');

const router = express.Router();

// ============================================================================
// ROTAS PÚBLICAS - Visualização de guias
// ============================================================================

/**
 * GET /api/guias
 * Lista todos os guias turísticos ativos
 * Acesso: Público
 */
router.get('/', async (req, res) => {
  try {
    const guias = await prisma.pROD_GuiaTuristico.findMany({
      where: { ativo: true },
      orderBy: [
        { ordem: 'asc' },
        { nome: 'asc' }
      ],
      select: {
        id: true,
        nome: true,
        whatsapp: true,
        idiomas: true,
        foto_url: true,
        descricao: true,
      }
    });

    res.json(guias);
  } catch (error) {
    console.error('Erro ao buscar guias:', error);
    res.status(500).json({ error: 'Erro ao buscar guias turísticos' });
  }
});

/**
 * GET /api/guias/:id
 * Busca um guia específico por ID
 * Acesso: Público
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const guia = await prisma.pROD_GuiaTuristico.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        nome: true,
        whatsapp: true,
        idiomas: true,
        foto_url: true,
        descricao: true,
        ativo: true,
      }
    });

    if (!guia) {
      return res.status(404).json({ error: 'Guia não encontrado' });
    }

    res.json(guia);
  } catch (error) {
    console.error('Erro ao buscar guia:', error);
    res.status(500).json({ error: 'Erro ao buscar guia turístico' });
  }
});

// ============================================================================
// ROTAS ADMINISTRATIVAS - Gestão de guias (requer autenticação)
// ============================================================================

/**
 * GET /api/guias/admin/all
 * Lista TODOS os guias (ativos e inativos) para administração
 * Acesso: Admin
 */
router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const guias = await prisma.pROD_GuiaTuristico.findMany({
      orderBy: [
        { ordem: 'asc' },
        { nome: 'asc' }
      ]
    });

    res.json(guias);
  } catch (error) {
    console.error('Erro ao buscar todos os guias:', error);
    res.status(500).json({ error: 'Erro ao buscar guias' });
  }
});

/**
 * POST /api/guias/admin
 * Cria um novo guia turístico
 * Acesso: Admin
 */
router.post('/admin', authenticate, requireAdmin, async (req, res) => {
  try {
    const { nome, whatsapp, idiomas, foto_url, descricao, ativo, ordem } = req.body;

    // Validação básica
    if (!nome || !whatsapp || !idiomas) {
      return res.status(400).json({
        error: 'Nome, WhatsApp e idiomas são obrigatórios'
      });
    }

    const guia = await prisma.pROD_GuiaTuristico.create({
      data: {
        nome,
        whatsapp,
        idiomas,
        foto_url: foto_url || null,
        descricao: descricao || null,
        ativo: ativo !== undefined ? ativo : true,
        ordem: ordem || 0,
      }
    });

    // Audit log
    await auditLog(
      'INSERT',
      'prod_guia_turistico',
      guia.id,
      req.user.id,
      req.user.role,
      { newValue: guia }
    );

    res.status(201).json(guia);
  } catch (error) {
    console.error('Erro ao criar guia:', error);
    res.status(500).json({ error: 'Erro ao criar guia turístico' });
  }
});

/**
 * PUT /api/guias/admin/:id
 * Atualiza um guia existente
 * Acesso: Admin
 */
router.put('/admin/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, whatsapp, idiomas, foto_url, descricao, ativo, ordem } = req.body;

    // Buscar guia atual para audit log
    const guiaAntigo = await prisma.pROD_GuiaTuristico.findUnique({
      where: { id: parseInt(id) }
    });

    if (!guiaAntigo) {
      return res.status(404).json({ error: 'Guia não encontrado' });
    }

    const guiaAtualizado = await prisma.pROD_GuiaTuristico.update({
      where: { id: parseInt(id) },
      data: {
        nome,
        whatsapp,
        idiomas,
        foto_url: foto_url || null,
        descricao: descricao || null,
        ativo,
        ordem,
      }
    });

    // Audit log
    await auditLog(
      'UPDATE',
      'prod_guia_turistico',
      guiaAtualizado.id,
      req.user.id,
      req.user.role,
      {
        oldValue: guiaAntigo,
        newValue: guiaAtualizado
      }
    );

    res.json(guiaAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar guia:', error);
    res.status(500).json({ error: 'Erro ao atualizar guia turístico' });
  }
});

/**
 * DELETE /api/guias/admin/:id
 * Remove um guia turístico
 * Acesso: Admin
 */
router.delete('/admin/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar guia para audit log
    const guia = await prisma.pROD_GuiaTuristico.findUnique({
      where: { id: parseInt(id) }
    });

    if (!guia) {
      return res.status(404).json({ error: 'Guia não encontrado' });
    }

    await prisma.pROD_GuiaTuristico.delete({
      where: { id: parseInt(id) }
    });

    // Audit log
    await auditLog(
      'DELETE',
      'prod_guia_turistico',
      parseInt(id),
      req.user.id,
      req.user.role,
      { oldValue: guia }
    );

    res.json({ message: 'Guia removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover guia:', error);
    res.status(500).json({ error: 'Erro ao remover guia turístico' });
  }
});

module.exports = router;
