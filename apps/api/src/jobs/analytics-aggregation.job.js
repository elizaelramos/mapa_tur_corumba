const { prisma } = require('@mapatur/database');
const { logger } = require('@mapatur/logger');

/**
 * Job para calcular duração de sessões
 * Roda a cada 1 hora
 */
async function calculateSessionDurations() {
  try {
    const sessions = await prisma.aNALYTICS_Session.findMany({
      where: {
        duration_seconds: null,
        last_seen: {
          lt: new Date(Date.now() - 30 * 60 * 1000), // Sessões inativas há mais de 30min
        },
      },
    });

    for (const session of sessions) {
      const durationSeconds = Math.floor((session.last_seen - session.first_seen) / 1000);
      await prisma.aNALYTICS_Session.update({
        where: { id: session.id },
        data: { duration_seconds: durationSeconds },
      });
    }

    logger.info('Session durations calculated', { count: sessions.length });
  } catch (error) {
    logger.error('Error calculating session durations', { error: error.message });
  }
}

/**
 * Job para calcular taxas de conversão
 * Roda diariamente
 */
async function calculateConversionRates() {
  try {
    const stats = await prisma.aNALYTICS_UnitStats.findMany({
      where: {
        views: { gt: 0 },
        conversion_rate: null,
      },
    });

    for (const stat of stats) {
      const totalContacts =
        (stat.contacts_whatsapp || 0) +
        (stat.contacts_phone || 0) +
        (stat.contacts_email || 0) +
        (stat.contacts_directions || 0);

      const rate = (totalContacts / stat.views) * 100;

      await prisma.aNALYTICS_UnitStats.update({
        where: { id: stat.id },
        data: { conversion_rate: rate },
      });
    }

    logger.info('Conversion rates calculated', { count: stats.length });
  } catch (error) {
    logger.error('Error calculating conversion rates', { error: error.message });
  }
}

/**
 * Job para limpar dados antigos
 * Roda semanalmente
 */
async function cleanOldData() {
  try {
    const retentionDays = {
      events: 90,
      sessions: 90,
      performance: 30,
    };

    const [deletedEvents, deletedSessions, deletedPerformance] = await Promise.all([
      prisma.aNALYTICS_Event.deleteMany({
        where: {
          created_at: {
            lt: new Date(Date.now() - retentionDays.events * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.aNALYTICS_Session.deleteMany({
        where: {
          first_seen: {
            lt: new Date(Date.now() - retentionDays.sessions * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.aNALYTICS_Performance.deleteMany({
        where: {
          created_at: {
            lt: new Date(Date.now() - retentionDays.performance * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    logger.info('Old analytics data cleaned', {
      deleted_events: deletedEvents.count,
      deleted_sessions: deletedSessions.count,
      deleted_performance: deletedPerformance.count,
    });
  } catch (error) {
    logger.error('Error cleaning old data', { error: error.message });
  }
}

module.exports = {
  calculateSessionDurations,
  calculateConversionRates,
  cleanOldData,
};
