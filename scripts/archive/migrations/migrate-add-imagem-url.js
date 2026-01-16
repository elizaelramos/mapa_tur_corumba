// Carregar variáveis de ambiente
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addImagemUrlColumn() {
  console.log('Adding imagem_url column to tables...\n');

  try {
    // Adicionar coluna em STAGING_Info_Origem
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE STAGING_Info_Origem
        ADD COLUMN imagem_url VARCHAR(500) NULL
        AFTER longitude_manual
      `);
      console.log('✅ Column added to STAGING_Info_Origem');
    } catch (err) {
      if (err.message.includes('Duplicate column')) {
        console.log('⚠️  Column already exists in STAGING_Info_Origem');
      } else {
        throw err;
      }
    }

    // Adicionar coluna em PROD_Unidade_Saude
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE PROD_Unidade_Saude
        ADD COLUMN imagem_url VARCHAR(500) NULL
        AFTER longitude
      `);
      console.log('✅ Column added to PROD_Unidade_Saude');
    } catch (err) {
      if (err.message.includes('Duplicate column')) {
        console.log('⚠️  Column already exists in PROD_Unidade_Saude');
      } else {
        throw err;
      }
    }

  } catch (error) {
    console.error('❌ Error adding columns:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addImagemUrlColumn()
  .then(() => {
    console.log('\n✅ Migration completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
