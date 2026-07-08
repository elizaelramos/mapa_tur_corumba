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

  // Parâmetros do pool de conexões do Prisma
  // connection_limit: máximo de conexões simultâneas por processo. O padrão do Prisma
  //   (CPUs físicas * 2 + 1) mantém muitas conexões ociosas (Sleep) no MySQL compartilhado.
  //   Fixamos um teto menor para reduzir a pressão de conexões ociosas.
  // pool_timeout: segundos que o Prisma aguarda por uma conexão livre antes de falhar.
  const connectionLimit = process.env.DB_CONNECTION_LIMIT || '5';
  const poolTimeout = process.env.DB_POOL_TIMEOUT || '10';

  return `mysql://${user}:${encodedPassword}@${host}:${port}/${database}?connection_limit=${connectionLimit}&pool_timeout=${poolTimeout}`;
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
