const { PrismaClient } = require('@prisma/client');
const { buildDatabaseUrl } = require('./build-database-url');

// Construir DATABASE_URL a partir de credenciais separadas
try {
  process.env.DATABASE_URL = buildDatabaseUrl();
} catch (error) {
  console.error('Erro ao construir DATABASE_URL:', error.message);
  throw error;
}

// Singleton pattern para o Prisma Client
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
} else {
  // Em desenvolvimento, usar global para evitar múltiplas instâncias
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.prisma;
}

module.exports = { prisma, PrismaClient };
