const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { buildDatabaseUrl } = require('../packages/database/build-database-url');

async function applyMigration() {
  console.log('\n=== Aplicando Migração: Adicionar CPF, CNS, CBO ao PROD_Medico ===\n');
  
  const mysql = require('mysql2/promise');
  const connection = await mysql.createConnection(buildDatabaseUrl());
  
  try {
    // Ler arquivo de migração
    const migrationPath = path.join(__dirname, '../packages/database/prisma/migrations/20251202_add_cpf_cns_cbo_to_medico/migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 SQL da migração:');
    console.log(migrationSQL);
    console.log('\n⏳ Executando migração...\n');
    
    // Separar comandos SQL (cada ALTER TABLE e CREATE INDEX)
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);
    
    for (const command of commands) {
      await connection.query(command);
      console.log(`✅ Executado: ${command.substring(0, 60)}...`);
    }
    
    console.log('\n✅ Migração aplicada com sucesso!\n');
    
    // Verificar estrutura atualizada
    console.log('📋 Verificando nova estrutura da tabela:');
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'PROD_Medico'
      ORDER BY ORDINAL_POSITION
    `);
    
    columns.forEach(col => {
      const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
      const key = col.COLUMN_KEY ? ` [${col.COLUMN_KEY}]` : '';
      console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${nullable}${key}`);
    });
    
    console.log('\n');
    
  } finally {
    await connection.end();
  }
}

applyMigration().catch(console.error);
