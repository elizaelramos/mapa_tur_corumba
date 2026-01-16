const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');

async function testPostgresConnection() {
  console.log('\n=== Teste de Conexão PostgreSQL ===\n');
  
  // Verificar credenciais
  const requiredVars = ['SOURCE_DB_HOST', 'SOURCE_DB_NAME', 'SOURCE_DB_USER', 'SOURCE_DB_PASSWORD'];
  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    console.error('❌ Credenciais PostgreSQL faltando no .env:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.log('\nConfigure no arquivo .env:');
    console.log('SOURCE_DB_HOST="localhost"');
    console.log('SOURCE_DB_PORT="5432"');
    console.log('SOURCE_DB_NAME="base_saude"');
    console.log('SOURCE_DB_USER="usuario"');
    console.log('SOURCE_DB_PASSWORD="senha"\n');
    process.exit(1);
  }
  
  console.log('1. Configuração encontrada:');
  console.log(`   Host: ${process.env.SOURCE_DB_HOST}`);
  console.log(`   Port: ${process.env.SOURCE_DB_PORT || 5432}`);
  console.log(`   Database: ${process.env.SOURCE_DB_NAME}`);
  console.log(`   User: ${process.env.SOURCE_DB_USER}`);
  console.log(`   Password: ${'*'.repeat(process.env.SOURCE_DB_PASSWORD.length)}\n`);
  
  const pool = new Pool({
    host: process.env.SOURCE_DB_HOST,
    port: parseInt(process.env.SOURCE_DB_PORT) || 5432,
    database: process.env.SOURCE_DB_NAME,
    user: process.env.SOURCE_DB_USER,
    password: process.env.SOURCE_DB_PASSWORD,
    max: 1,
    connectionTimeoutMillis: 10000,
  });
  
  try {
    // Teste 1: Conexão básica
    console.log('2. Testando conexão...');
    const result = await pool.query('SELECT NOW(), version()');
    console.log('   ✅ Conectado com sucesso!');
    console.log(`   Hora do servidor: ${result.rows[0].now}`);
    console.log(`   Versão: ${result.rows[0].version.split(',')[0]}\n`);
    
    // Teste 2: Verificar se a view existe
    console.log('3. Verificando view vm_relacao_prof_x_estab_especialidade...');
    const viewCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'vm_relacao_prof_x_estab_especialidade'
      ) AS exists
    `);
    
    if (viewCheck.rows[0].exists) {
      console.log('   ✅ View encontrada!\n');
      
      // Teste 3: Ver estrutura da view
      console.log('4. Estrutura da view:');
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vm_relacao_prof_x_estab_especialidade'
        ORDER BY ordinal_position
      `);
      
      console.log('   Colunas disponíveis:');
      columns.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
      console.log('');
      
      // Teste 4: Contar registros
      console.log('5. Contando registros...');
      const count = await pool.query('SELECT COUNT(*) FROM vm_relacao_prof_x_estab_especialidade');
      console.log(`   Total de registros: ${count.rows[0].count}\n`);
      
      // Teste 5: Ver amostra de dados
      console.log('6. Amostra de dados (primeiros 3 registros):');
      const sample = await pool.query('SELECT * FROM vm_relacao_prof_x_estab_especialidade LIMIT 3');
      console.log(JSON.stringify(sample.rows, null, 2));
      console.log('');
      
    } else {
      console.log('   ❌ View NÃO encontrada!\n');
      
      // Listar views disponíveis
      console.log('4. Views disponíveis no schema public:');
      const views = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'VIEW'
        ORDER BY table_name
      `);
      
      if (views.rows.length > 0) {
        views.rows.forEach(v => console.log(`   - ${v.table_name}`));
      } else {
        console.log('   (nenhuma view encontrada)');
      }
      console.log('');
    }
    
    console.log('✅ Teste concluído com sucesso!\n');
    
  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\nO servidor PostgreSQL não está acessível.');
      console.error('Verifique:');
      console.error('1. PostgreSQL está rodando?');
      console.error('2. Host e porta estão corretos?');
      console.error('3. Firewall permite conexão?\n');
    } else if (error.code === '28P01') {
      console.error('\nFalha na autenticação.');
      console.error('Verifique usuário e senha no .env\n');
    } else if (error.code === '3D000') {
      console.error('\nBanco de dados não existe.');
      console.error('Verifique o nome do database no .env\n');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testPostgresConnection();
