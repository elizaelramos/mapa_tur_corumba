const { Pool } = require('pg');
const { logger } = require('@mapatur/logger');

// ============================================================================
// EXTRACT - Extração de dados da fonte (Base da Saúde - PostgreSQL)
// ============================================================================

/**
 * Cria pool de conexões com o banco de dados fonte PostgreSQL
 * Usa credenciais separadas para evitar problemas com caracteres especiais na senha
 */
function createSourcePool() {
  // Verificar se todas as credenciais estão configuradas
  const requiredVars = ['SOURCE_DB_HOST', 'SOURCE_DB_NAME', 'SOURCE_DB_USER', 'SOURCE_DB_PASSWORD'];
  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    throw new Error(`Credenciais PostgreSQL faltando no .env: ${missing.join(', ')}`);
  }
  
  return new Pool({
    host: process.env.SOURCE_DB_HOST,
    port: parseInt(process.env.SOURCE_DB_PORT) || 5432,
    database: process.env.SOURCE_DB_NAME,
    user: process.env.SOURCE_DB_USER,
    password: process.env.SOURCE_DB_PASSWORD,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

/**
 * Query SQL para extração de dados da fonte PostgreSQL
 * NOTA: Esta query deve ser ajustada conforme a estrutura real da Base da Saúde
 * 
 * IMPORTANTE: A query DEVE retornar as seguintes colunas:
 * - id_origem: Identificador único (pode ser CNES, CPF, ou combinação)
 * - nome_medico: Nome do profissional
 * - nome_unidade: Nome da unidade de saúde
 * - nome_especialidade: Nome da especialidade
 * 
 * PostgreSQL usa sintaxe diferente do MySQL (ex: TRUE ao invés de 1)
 */
const EXTRACTION_QUERY = `
  SELECT
    MD5(CONCAT(COALESCE("Profissional", ''), '|', COALESCE("Unidade de Saude", ''), '|', COALESCE("Especialidade", ''))) as id_origem,
    "Profissional" as nome_medico,
    "Unidade de Saude" as nome_unidade,
    "Especialidade" as nome_especialidade
  FROM vm_relacao_prof_x_estab_especialidade
`;

/**
 * Extrai dados da fonte PostgreSQL
 */
async function extractFromSource() {
  const pool = createSourcePool();
  
  try {
    logger.info('Connecting to source database (PostgreSQL)');
    
    logger.info('Executing extraction query');
    
    // Executar query no PostgreSQL
    const result = await pool.query(EXTRACTION_QUERY);
    
    logger.info('Extraction completed', {
      records_extracted: result.rows.length,
    });
    
    return result.rows;
    
  } catch (error) {
    logger.error('Extraction failed', {
      error: error.message,
      stack: error.stack,
      code: error.code,
    });
    
    throw new Error(`Extraction failed: ${error.message}`);
    
  } finally {
    await pool.end();
    logger.info('Source database connection pool closed');
  }
}

/**
 * Extrai dados com cursor (para volumes muito grandes no PostgreSQL)
 * Alternativa ao método acima quando há milhões de registros
 * PostgreSQL usa CURSOR ao invés de streaming
 */
async function extractFromSourceStreaming(batchCallback) {
  const pool = createSourcePool();
  const client = await pool.connect();
  
  try {
    const BATCH_SIZE = parseInt(process.env.ETL_BATCH_SIZE) || 1000;
    let totalRecords = 0;
    
    // Iniciar transação e criar cursor
    await client.query('BEGIN');
    await client.query(`DECLARE etl_cursor CURSOR FOR ${EXTRACTION_QUERY}`);
    
    logger.info('PostgreSQL cursor created, starting batch processing');
    
    let hasMore = true;
    
    while (hasMore) {
      // Buscar próximo lote
      const result = await client.query(`FETCH ${BATCH_SIZE} FROM etl_cursor`);
      
      if (result.rows.length === 0) {
        hasMore = false;
        break;
      }
      
      // Processar lote
      try {
        await batchCallback(result.rows);
        totalRecords += result.rows.length;
        
        logger.info('Batch processed', {
          batch_size: result.rows.length,
          total_processed: totalRecords,
        });
      } catch (error) {
        logger.error('Batch processing failed', {
          error: error.message,
        });
        throw error;
      }
      
      // Se retornou menos que o BATCH_SIZE, acabou
      if (result.rows.length < BATCH_SIZE) {
        hasMore = false;
      }
    }
    
    // Fechar cursor e commit
    await client.query('CLOSE etl_cursor');
    await client.query('COMMIT');
    
    logger.info('Cursor extraction completed', {
      total_records: totalRecords,
    });
    
    return totalRecords;
    
  } catch (error) {
    // Rollback em caso de erro
    await client.query('ROLLBACK');
    
    logger.error('Cursor extraction error', {
      error: error.message,
      stack: error.stack,
    });
    
    throw error;
    
  } finally {
    client.release();
    await pool.end();
  }
}

module.exports = {
  extractFromSource,
  extractFromSourceStreaming,
};
