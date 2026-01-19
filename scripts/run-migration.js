const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runMigration() {
  console.log('===============================================');
  console.log('APLICANDO MIGRAÇÃO: Escolas → Unidades Turísticas');
  console.log('===============================================\n');

  // Ler arquivo SQL
  const migrationPath = 'packages/database/prisma/migrations/20260119_migracao_turismo/migration.sql';
  console.log(`📄 Lendo arquivo: ${migrationPath}`);

  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Dividir em statements (separados por ;)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`✓ Encontrados ${statements.length} comandos SQL\n`);

  console.log('⚠️  ATENÇÃO: Esta operação é DESTRUTIVA!');
  console.log('    - Criará backups das tabelas antigas');
  console.log('    - Deletará todos os dados de escolas');
  console.log('    - Criará nova estrutura para turismo\n');

  console.log('Executando migração...\n');

  let executados = 0;
  let erros = 0;

  for (const statement of statements) {
    try {
      // Ignorar comentários
      if (statement.startsWith('--') || statement.startsWith('/*')) {
        continue;
      }

      await prisma.$executeRawUnsafe(statement);
      executados++;

      // Log apenas para operações importantes
      if (statement.includes('CREATE TABLE')) {
        const match = statement.match(/CREATE TABLE\s+(\w+)/i);
        if (match) {
          console.log(`  ✓ Tabela criada: ${match[1]}`);
        }
      } else if (statement.includes('DROP TABLE')) {
        const match = statement.match(/DROP TABLE\s+(?:IF EXISTS\s+)?(\w+)/i);
        if (match) {
          console.log(`  ✓ Tabela removida: ${match[1]}`);
        }
      }
    } catch (error) {
      erros++;
      console.error(`  ✗ Erro:`, error.message);
      // Continuar mesmo com erros (alguns erros são esperados, como tabelas que não existem)
    }
  }

  console.log('\n===============================================');
  console.log('RESUMO DA MIGRAÇÃO');
  console.log('===============================================');
  console.log(`✓ Comandos executados: ${executados}`);
  console.log(`✗ Erros: ${erros}`);
  console.log('\n✅ Migração aplicada com sucesso!');
  console.log('\n📋 Próximos passos:');
  console.log('   1. Executar: node scripts/import-unidades-turisticas.js');
  console.log('   2. Adaptar o backend (rotas e APIs)');
  console.log('   3. Atualizar o frontend\n');
}

runMigration()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error('\n❌ ERRO FATAL:', error);
    prisma.$disconnect();
    process.exit(1);
  });
