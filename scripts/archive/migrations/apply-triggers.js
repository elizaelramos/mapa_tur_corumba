require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { buildDatabaseUrl } = require('../packages/database/build-database-url');

async function applyTriggers() {
  let connection = null;
  
  try {
    console.log('\n=== Aplicando Triggers de Auditoria ===\n');
    
    // Construir DATABASE_URL a partir de credenciais separadas
    const databaseUrl = buildDatabaseUrl();
    
    // Importar mysql2 dinamicamente
    let mysql;
    try {
      mysql = require('mysql2/promise');
    } catch (error) {
      throw new Error('mysql2 não está instalado. Execute: npm install mysql2');
    }
    
    // Conectar ao banco
    console.log('1. Conectando ao banco de dados MySQL...');
    console.log(`   URL: ${databaseUrl.replace(/:[^:@]+@/, ':***@')}`);
    connection = await mysql.createConnection(databaseUrl);
    console.log('✅ Conectado!\n');
    
    // Ler arquivo de triggers
    console.log('2. Lendo arquivo de triggers...');
    const triggersPath = path.join(__dirname, '..', 'packages', 'database', 'prisma', 'triggers.sql');
    const triggersSQL = fs.readFileSync(triggersPath, 'utf8');
    console.log('✅ Arquivo lido!\n');
    
    // Processar triggers
    console.log('3. Aplicando triggers...');
    
    // Remover comentários
    let cleanSQL = triggersSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');
    
    // Dividir por blocos usando DELIMITER $$ ... $$ DELIMITER ;
    // Padrão: DELIMITER $$ ... CREATE TRIGGER ... END$$ ... DELIMITER ;
    const triggerBlocks = cleanSQL.split(/DELIMITER\s+\$\$/i);
    
    let triggerCount = 0;
    
    for (let i = 1; i < triggerBlocks.length; i++) {
      const block = triggerBlocks[i];
      
      // Extrair o SQL do trigger (até $$)
      const match = block.match(/(CREATE\s+TRIGGER[\s\S]*?END)\$\$/i);
      
      if (match) {
        const triggerSQL = match[1].trim();
        const triggerName = triggerSQL.match(/CREATE\s+TRIGGER\s+(\w+)/i)?.[1];
        
        if (triggerName && triggerSQL) {
          try {
            // Dropar trigger se existir
            await connection.query(`DROP TRIGGER IF EXISTS ${triggerName}`);
            
            // Criar trigger
            await connection.query(triggerSQL);
            triggerCount++;
            console.log(`   ✅ Trigger criado: ${triggerName}`);
          } catch (error) {
            console.error(`   ❌ Erro ao criar trigger ${triggerName}:`, error.message);
            if (error.sqlMessage) {
              console.error(`   SQL Error: ${error.sqlMessage}`);
            }
          }
        }
      }
    }
    
    console.log(`\n✅ ${triggerCount} triggers aplicados com sucesso!\n`);
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

applyTriggers();
