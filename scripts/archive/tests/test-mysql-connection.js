const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { buildDatabaseUrl } = require('../packages/database/build-database-url');

async function testMySQLConnection() {
  console.log('\n=== Teste de Conexão MySQL ===\n');
  
  let mysql;
  let connection;
  
  try {
    // Importar mysql2
    try {
      mysql = require('mysql2/promise');
    } catch (error) {
      console.error('❌ mysql2 não está instalado.');
      console.error('Execute: npm install mysql2\n');
      process.exit(1);
    }
    
    // Construir DATABASE_URL
    console.log('1. Construindo URL de conexão...');
    const databaseUrl = buildDatabaseUrl();
    console.log(`   URL: ${databaseUrl.replace(/:[^:@]+@/, ':***@')}\n`);
    
    // Testar conexão
    console.log('2. Testando conexão...');
    connection = await mysql.createConnection(databaseUrl);
    console.log('   ✅ Conectado com sucesso!\n');
    
    // Verificar versão
    console.log('3. Informações do servidor:');
    const [rows] = await connection.query('SELECT VERSION() as version, NOW() as now');
    console.log(`   Versão: ${rows[0].version}`);
    console.log(`   Hora do servidor: ${rows[0].now}\n`);
    
    // Verificar banco de dados
    console.log('4. Verificando banco de dados...');
    const [dbInfo] = await connection.query('SELECT DATABASE() as db');
    console.log(`   Database atual: ${dbInfo[0].db}\n`);
    
    // Listar tabelas
    console.log('5. Tabelas existentes:');
    const [tables] = await connection.query('SHOW TABLES');
    
    if (tables.length > 0) {
      tables.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log(`   - ${tableName}`);
      });
      console.log(`\n   Total: ${tables.length} tabelas\n`);
    } else {
      console.log('   (nenhuma tabela encontrada)');
      console.log('   Execute: npm run setup:db\n');
    }
    
    console.log('✅ Teste concluído com sucesso!\n');
    
  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\nO servidor MySQL não está acessível.');
      console.error('Verifique:');
      console.error('1. MySQL está rodando?');
      console.error('2. Host e porta estão corretos?');
      console.error('3. Firewall permite conexão?\n');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\nFalha na autenticação.');
      console.error('Verifique usuário e senha no .env\n');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\nBanco de dados não existe.');
      console.error('Crie o banco: CREATE DATABASE sigls_db;\n');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testMySQLConnection();
