// Carregar variáveis de ambiente
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTable() {
  console.log('Creating Especialidade_Mapeamento table...\n');

  try {
    // Criar tabela
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS Especialidade_Mapeamento (
        id INT PRIMARY KEY AUTO_INCREMENT,
        especialidade_bruta VARCHAR(255) UNIQUE NOT NULL,
        especialidade_normalizada VARCHAR(255) NOT NULL,
        criado_por INT NOT NULL,
        criado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        atualizado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        INDEX idx_especialidade_bruta (especialidade_bruta),
        INDEX idx_especialidade_normalizada (especialidade_normalizada),
        INDEX idx_criado_por (criado_por),
        CONSTRAINT fk_mapeamento_user FOREIGN KEY (criado_por) REFERENCES User(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Table Especialidade_Mapeamento created successfully!');

    // Verificar se foi criada
    const tables = await prisma.$queryRaw`SHOW TABLES LIKE 'Especialidade_Mapeamento'`;
    console.log('\nVerification:', tables);

  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTable()
  .then(() => {
    console.log('\n✅ Migration completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
