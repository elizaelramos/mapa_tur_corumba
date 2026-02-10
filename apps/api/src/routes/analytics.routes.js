const express = require('express');
const { prisma } = require('@mapatur/database');
const { logger } = require('@mapatur/logger');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const crypto = require('crypto');

const router = express.Router();

// Helper para wrap async functions e capturar erros
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ============================================================================
// ANALYTICS ROUTES - Coleta de Eventos
// ============================================================================

/**
 * POST /api/analytics/event
 * Registra um evento de analytics (público, sem autenticação)
 * Rate limited para evitar spam
 */
router.post('/event', asyncHandler(async (req, res) => {
  const {
    session_id,
    event_type,
    event_data,
  } = req.body;

  // Validações básicas
  if (!session_id || !event_type) {
    return res.status(400).json({
      success: false,
      error: 'session_id e event_type são obrigatórios',
    });
  }

  // Validar event_type
  const validEventTypes = ['PAGE_VIEW', 'SEARCH', 'UNIT_VIEW', 'MAP_CLICK', 'CONTACT_CLICK', 'SOCIAL_CLICK', 'FILTER_APPLIED', 'ERROR'];
  if (!validEventTypes.includes(event_type)) {
    return res.status(400).json({
      success: false,
      error: 'event_type inválido',
    });
  }

  // Anonimizar IP (SHA256)
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const ip_hash = crypto.createHash('sha256').update(ip).digest('hex');

  // Extrair user agent
  const user_agent = req.headers['user-agent'];
  const referrer = req.headers['referer'] || req.headers['referrer'];

  // Registrar evento
  await prisma.analytics_event.create({
    data: {
      session_id,
      event_type,
      event_data: JSON.stringify(event_data || {}),
      user_agent,
      ip_hash,
      referrer,
    },
  });

  // Atualizar sessão agregada (upsert)
  const now = new Date();
  await prisma.analytics_session.upsert({
    where: { session_id },
    create: {
      session_id,
      first_seen: now,
      last_seen: now,
      user_agent,
      ip_hash,
      page_views: event_type === 'PAGE_VIEW' ? 1 : 0,
      searches: event_type === 'SEARCH' ? 1 : 0,
      unit_views: event_type === 'UNIT_VIEW' ? 1 : 0,
      contacts: event_type === 'CONTACT_CLICK' ? 1 : 0,
    },
    update: {
      last_seen: now,
      page_views: event_type === 'PAGE_VIEW' ? { increment: 1 } : undefined,
      searches: event_type === 'SEARCH' ? { increment: 1 } : undefined,
      unit_views: event_type === 'UNIT_VIEW' ? { increment: 1 } : undefined,
      contacts: event_type === 'CONTACT_CLICK' ? { increment: 1 } : undefined,
    },
  });

  // Processar eventos específicos para agregações
  if (event_type === 'UNIT_VIEW' || event_type === 'MAP_CLICK' || event_type === 'CONTACT_CLICK') {
    await processUnitEvent(event_type, event_data);
  }

  if (event_type === 'SEARCH') {
    await processSearchEvent(event_data);
  }

  res.json({ success: true });
}));

// ============================================================================
// ANALYTICS ROUTES - Dashboard Admin (Queries)
// ============================================================================

/**
 * GET /api/analytics/access-stats
 * Retorna estatísticas de acessos por período (sessões únicas)
 */
router.get('/access-stats', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const now = new Date();

  // Início do dia atual (00:00:00)
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  // Início da semana (domingo)
  const startOfWeek = new Date(now);
  const dayOfWeek = now.getDay(); // 0 = domingo, 6 = sábado
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  // Início do mês
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

  // Início do ano
  const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);

  // Contar sessões únicas por período
  const [today, thisWeek, thisMonth, thisYear] = await Promise.all([
    prisma.analytics_session.count({
      where: {
        first_seen: { gte: startOfToday },
      },
    }),
    prisma.analytics_session.count({
      where: {
        first_seen: { gte: startOfWeek },
      },
    }),
    prisma.analytics_session.count({
      where: {
        first_seen: { gte: startOfMonth },
      },
    }),
    prisma.analytics_session.count({
      where: {
        first_seen: { gte: startOfYear },
      },
    }),
  ]);

  res.json({
    success: true,
    data: {
      today,
      this_week: thisWeek,
      this_month: thisMonth,
      this_year: thisYear,
    },
  });
}));

/**
 * GET /api/analytics/overview
 * Retorna overview das estatísticas gerais
 */
router.get('/overview', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { start_date, end_date } = req.query;

  const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = end_date ? new Date(end_date) : new Date();

  // Estatísticas gerais
  const [totalSessions, totalEvents, avgSessionDuration] = await Promise.all([
    prisma.analytics_session.count({
      where: {
        first_seen: { gte: startDate, lte: endDate },
      },
    }),
    prisma.analytics_event.count({
      where: {
        created_at: { gte: startDate, lte: endDate },
      },
    }),
    prisma.analytics_session.aggregate({
      where: {
        first_seen: { gte: startDate, lte: endDate },
        duration_seconds: { not: null },
      },
      _avg: {
        duration_seconds: true,
      },
    }),
  ]);

  // Eventos por tipo
  const eventsByType = await prisma.analytics_event.groupBy({
    by: ['event_type'],
    where: {
      created_at: { gte: startDate, lte: endDate },
    },
    _count: {
      id: true,
    },
  });

  res.json({
    success: true,
    data: {
      total_sessions: totalSessions,
      total_events: totalEvents,
      avg_session_duration_seconds: Math.round(avgSessionDuration._avg.duration_seconds || 0),
      events_by_type: eventsByType.map(e => ({
        type: e.event_type,
        count: e._count.id,
      })),
    },
  });
}));

/**
 * GET /api/analytics/popular-units
 * Retorna unidades mais populares (mais visualizadas)
 */
router.get('/popular-units', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { start_date, end_date, limit = 20 } = req.query;

  const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = end_date ? new Date(end_date) : new Date();

  const popularUnits = await prisma.analytics_unit_stats.groupBy({
    by: ['unit_id'],
    where: {
      date: { gte: startDate, lte: endDate },
    },
    _sum: {
      views: true,
      contacts_whatsapp: true,
      contacts_phone: true,
      contacts_email: true,
      contacts_directions: true,
    },
    orderBy: {
      _sum: {
        views: 'desc',
      },
    },
    take: parseInt(limit),
  });

  // Enriquecer com dados da unidade
  const unitsData = await Promise.all(
    popularUnits.map(async (stat) => {
      const unit = await prisma.pROD_UnidadeTuristica.findUnique({
        where: { id: stat.unit_id },
        select: { id: true, nome: true, bairro: { select: { nome: true } } },
      });

      const totalContacts = (stat._sum.contacts_whatsapp || 0) +
                           (stat._sum.contacts_phone || 0) +
                           (stat._sum.contacts_email || 0) +
                           (stat._sum.contacts_directions || 0);

      return {
        unit_id: stat.unit_id,
        unit_name: unit?.nome || 'Desconhecida',
        bairro: unit?.bairro?.nome || null,
        views: stat._sum.views || 0,
        contacts: totalContacts,
        conversion_rate: stat._sum.views > 0
          ? parseFloat((totalContacts / stat._sum.views * 100).toFixed(2))
          : 0,
      };
    })
  );

  res.json({
    success: true,
    data: unitsData,
  });
}));

/**
 * GET /api/analytics/search-terms
 * Retorna termos de busca mais populares
 */
router.get('/search-terms', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query;

  const searchTerms = await prisma.analytics_search_stats.findMany({
    orderBy: {
      count: 'desc',
    },
    take: parseInt(limit),
  });

  // Converter BigInt para String para serialização JSON
  const serializedData = searchTerms.map(term => ({
    ...term,
    id: term.id.toString(),
  }));

  res.json({
    success: true,
    data: serializedData,
  });
}));

/**
 * GET /api/analytics/conversion-funnel
 * Retorna funil de conversão
 */
router.get('/conversion-funnel', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { start_date, end_date } = req.query;

  const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = end_date ? new Date(end_date) : new Date();

  const [totalViews, totalContacts] = await Promise.all([
    prisma.analytics_event.count({
      where: {
        event_type: 'UNIT_VIEW',
        created_at: { gte: startDate, lte: endDate },
      },
    }),
    prisma.analytics_event.count({
      where: {
        event_type: 'CONTACT_CLICK',
        created_at: { gte: startDate, lte: endDate },
      },
    }),
  ]);

  const conversionRate = totalViews > 0 ? ((totalContacts / totalViews) * 100).toFixed(2) : 0;

  res.json({
    success: true,
    data: {
      total_views: totalViews,
      total_contacts: totalContacts,
      conversion_rate: parseFloat(conversionRate),
    },
  });
}));

/**
 * GET /api/analytics/timeline
 * Retorna série temporal de eventos
 */
router.get('/timeline', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { start_date, end_date } = req.query;

  const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = end_date ? new Date(end_date) : new Date();

  // Query para agrupar por data usando MySQL DATE()
  const timeline = await prisma.$queryRaw`
    SELECT
      DATE(created_at) as date,
      event_type,
      COUNT(*) as count
    FROM analytics_event
    WHERE created_at >= ${startDate} AND created_at <= ${endDate}
    GROUP BY DATE(created_at), event_type
    ORDER BY date ASC
  `;

  // Converter BigInt para Number para serialização JSON
  const serializedTimeline = timeline.map(row => ({
    date: row.date,
    event_type: row.event_type,
    count: Number(row.count),
  }));

  res.json({
    success: true,
    data: serializedTimeline,
  });
}));

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function processUnitEvent(event_type, event_data) {
  const { unit_id } = event_data || {};
  if (!unit_id) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const updateData = {};
  if (event_type === 'UNIT_VIEW') {
    updateData.views = { increment: 1 };
  } else if (event_type === 'MAP_CLICK') {
    updateData.map_clicks = { increment: 1 };
  } else if (event_type === 'CONTACT_CLICK') {
    const contactType = event_data.contact_type;
    if (contactType === 'whatsapp') updateData.contacts_whatsapp = { increment: 1 };
    else if (contactType === 'phone') updateData.contacts_phone = { increment: 1 };
    else if (contactType === 'email') updateData.contacts_email = { increment: 1 };
    else if (contactType === 'como_chegar') updateData.contacts_directions = { increment: 1 };
  }

  await prisma.analytics_unit_stats.upsert({
    where: {
      unit_id_date: {
        unit_id: parseInt(unit_id),
        date: today,
      },
    },
    create: {
      unit_id: parseInt(unit_id),
      date: today,
      updated_at: new Date(),
      ...Object.fromEntries(Object.entries(updateData).map(([k, v]) => [k, 1])),
    },
    update: {
      ...updateData,
      updated_at: new Date(),
    },
  });
}

async function processSearchEvent(event_data) {
  const { search_term, search_type } = event_data || {};
  if (!search_term) return;

  await prisma.analytics_search_stats.upsert({
    where: {
      search_term_search_type: {
        search_term: search_term.toLowerCase().trim(),
        search_type: search_type || 'texto_livre',
      },
    },
    create: {
      search_term: search_term.toLowerCase().trim(),
      search_type: search_type || 'texto_livre',
      count: 1,
    },
    update: {
      count: { increment: 1 },
      last_searched: new Date(),
    },
  });
}

module.exports = router;
