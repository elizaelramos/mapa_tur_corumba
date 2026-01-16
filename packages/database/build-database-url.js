/**
 * Constrói DATABASE_URL a partir de credenciais separadas
 * Evita problemas com caracteres especiais (@, :, /, etc.) na senha
 */

function buildDatabaseUrl() {
  // Verificar credenciais obrigatórias
  const requiredVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    throw new Error(
      `Credenciais MySQL faltando no .env: ${missing.join(', ')}\n` +
      'Configure: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD'
    );
  }
  
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT || '3306';
  const database = process.env.DB_NAME;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  
  // URL encode da senha para evitar problemas com caracteres especiais
  const encodedPassword = encodeURIComponent(password);
  
  return `mysql://${user}:${encodedPassword}@${host}:${port}/${database}`;
}

// Exportar para uso em outros scripts
module.exports = { buildDatabaseUrl };

// Se executado diretamente, mostrar a URL
if (require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
  
  try {
    const url = buildDatabaseUrl();
    // Mascarar senha na saída
    const maskedUrl = url.replace(/:[^:@]+@/, ':***@');
    console.log('DATABASE_URL construída com sucesso:');
    console.log(maskedUrl);
  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
}
