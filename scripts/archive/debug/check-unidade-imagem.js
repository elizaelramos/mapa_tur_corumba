const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { buildDatabaseUrl } = require('../packages/database/build-database-url');
const { PrismaClient } = require('@prisma/client');

process.env.DATABASE_URL = buildDatabaseUrl();
const prisma = new PrismaClient();

async function checkUnidade() {
  try {
    console.log('\n🔍 Buscando unidade CEM...\n');

    const unidade = await prisma.pROD_Unidade_Saude.findFirst({
      where: {
        OR: [
          { nome: { contains: 'CEM' } },
          { nome: { contains: 'CENTRO DE ESPECIALIDADES' } },
        ]
      },
      select: {
        id: true,
        nome: true,
        imagem_url: true,
        icone_url: true,
        updated_at: true,
      }
    });

    if (!unidade) {
      console.log('❌ Unidade não encontrada!');
      return;
    }

    console.log('✅ Unidade encontrada:');
    console.log('ID:', unidade.id);
    console.log('Nome:', unidade.nome);
    console.log('Imagem URL:', unidade.imagem_url || '(não definido)');
    console.log('Ícone URL:', unidade.icone_url || '(não definido)');
    console.log('Última atualização:', unidade.updated_at);
    console.log();

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUnidade();
