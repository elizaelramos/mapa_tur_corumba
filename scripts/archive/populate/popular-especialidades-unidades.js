// ============================================================================
// Script: Popula Especialidades das Unidades
// ============================================================================
// Deriva as especialidades de cada unidade baseado nos médicos que trabalham nela
// Usa Junction_Unidade_Medico + Junction_Medico_Especialidade -> Junction_Unidade_Especialidade
// ============================================================================

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { buildDatabaseUrl } = require('../packages/database/build-database-url');
const mysql = require('mysql2/promise');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  let connection;
  
  try {
    console.log('============================================================');
    console.log('POPULAR ESPECIALIDADES DAS UNIDADES');
    console.log('============================================================\n');
    
    // Conectar ao banco
    connection = await mysql.createConnection(buildDatabaseUrl());
    console.log('✓ Conectado ao MySQL\n');
    
    await connection.query('START TRANSACTION');
    
    // ========================================================================
    // ANÁLISE INICIAL
    // ========================================================================
    
    console.log('=== ANÁLISE INICIAL ===\n');
    
    // Total de unidades ativas
    const [unidades] = await connection.query(`
      SELECT COUNT(*) as total FROM PROD_Unidade_Saude WHERE ativo = TRUE
    `);
    console.log(`Total de unidades ativas: ${unidades[0].total}`);
    
    // Unidades COM especialidades cadastradas
    const [unidadesComEsp] = await connection.query(`
      SELECT COUNT(DISTINCT id_unidade) as total 
      FROM Junction_Unidade_Especialidade
    `);
    console.log(`Unidades COM especialidades: ${unidadesComEsp[0].total}`);
    
    // Unidades SEM especialidades
    const [unidadesSemEsp] = await connection.query(`
      SELECT COUNT(*) as total 
      FROM PROD_Unidade_Saude u
      WHERE u.ativo = TRUE
        AND NOT EXISTS (
          SELECT 1 FROM Junction_Unidade_Especialidade jue
          WHERE jue.id_unidade = u.id
        )
    `);
    console.log(`Unidades SEM especialidades: ${unidadesSemEsp[0].total}`);
    
    // Total de vínculos médico-unidade
    const [vinculos] = await connection.query(`
      SELECT COUNT(*) as total FROM Junction_Unidade_Medico
    `);
    console.log(`Total de vínculos médico-unidade: ${vinculos[0].total}`);
    
    // Médicos com especialidades
    const [medicosComEsp] = await connection.query(`
      SELECT COUNT(DISTINCT id_medico) as total 
      FROM Junction_Medico_Especialidade
    `);
    console.log(`Médicos com especialidades: ${medicosComEsp[0].total}\n`);
    
    // ========================================================================
    // DERIVAR ESPECIALIDADES DAS UNIDADES
    // ========================================================================
    
    console.log('=== DERIVANDO ESPECIALIDADES ===\n');
    console.log('Estratégia: Para cada unidade, buscar especialidades dos médicos que trabalham nela\n');
    
    // Query para derivar especialidades:
    // 1. Junction_Unidade_Medico: médicos que trabalham na unidade
    // 2. Junction_Medico_Especialidade: especialidades de cada médico
    // 3. Resultado: especialidades únicas por unidade
    
    const [derivadas] = await connection.query(`
      SELECT 
        jum.id_unidade,
        jme.id_especialidade
      FROM Junction_Unidade_Medico jum
      INNER JOIN Junction_Medico_Especialidade jme ON jme.id_medico = jum.id_medico
      WHERE NOT EXISTS (
        SELECT 1 FROM Junction_Unidade_Especialidade jue
        WHERE jue.id_unidade = jum.id_unidade
          AND jue.id_especialidade = jme.id_especialidade
      )
      GROUP BY jum.id_unidade, jme.id_especialidade
      ORDER BY jum.id_unidade, jme.id_especialidade
    `);
    
    console.log(`Especialidades a serem inseridas: ${derivadas.length}\n`);
    
    if (derivadas.length === 0) {
      console.log('⚠️  Nenhuma especialidade nova para inserir.');
      console.log('   Todas as unidades já têm especialidades derivadas dos médicos.\n');
      await connection.query('ROLLBACK');
      return;
    }
    
    // Agrupar por unidade para exibir estatísticas
    const porUnidade = derivadas.reduce((acc, row) => {
      if (!acc[row.id_unidade]) acc[row.id_unidade] = 0;
      acc[row.id_unidade]++;
      return acc;
    }, {});
    
    const unidadesAfetadas = Object.keys(porUnidade).length;
    console.log(`Unidades que receberão especialidades: ${unidadesAfetadas}\n`);
    
    // Exibir amostra (primeiras 10 unidades)
    console.log('=== AMOSTRA (primeiras 10 unidades) ===\n');
    const [amostra] = await connection.query(`
      SELECT 
        u.id,
        u.nome,
        COUNT(DISTINCT jme.id_especialidade) as qtd_especialidades,
        GROUP_CONCAT(DISTINCT e.nome ORDER BY e.nome SEPARATOR ', ') as especialidades
      FROM PROD_Unidade_Saude u
      INNER JOIN Junction_Unidade_Medico jum ON jum.id_unidade = u.id
      INNER JOIN Junction_Medico_Especialidade jme ON jme.id_medico = jum.id_medico
      INNER JOIN PROD_Especialidade e ON e.id = jme.id_especialidade
      WHERE u.ativo = TRUE
        AND NOT EXISTS (
          SELECT 1 FROM Junction_Unidade_Especialidade jue
          WHERE jue.id_unidade = u.id
        )
      GROUP BY u.id, u.nome
      ORDER BY u.id
      LIMIT 10
    `);
    
    amostra.forEach(row => {
      console.log(`ID ${row.id}: ${row.nome}`);
      console.log(`  → ${row.qtd_especialidades} especialidades: ${row.especialidades}`);
      console.log();
    });
    
    // ========================================================================
    // INSERIR ESPECIALIDADES
    // ========================================================================
    
    console.log('=== INSERÇÃO ===\n');
    console.log('Operação: INSERT INTO Junction_Unidade_Especialidade');
    console.log(`Registros: ${derivadas.length}\n`);
    
    const answer = await question('Deseja fazer COMMIT das alterações? (s/n): ');
    
    if (answer.toLowerCase() !== 's') {
      console.log('\n❌ Operação cancelada. ROLLBACK executado.\n');
      await connection.query('ROLLBACK');
      return;
    }
    
    // Inserir em lotes de 500 para evitar query muito grande
    const BATCH_SIZE = 500;
    let inserted = 0;
    
    for (let i = 0; i < derivadas.length; i += BATCH_SIZE) {
      const batch = derivadas.slice(i, i + BATCH_SIZE);
      const values = batch.map(row => `(${row.id_unidade}, ${row.id_especialidade}, NOW())`).join(',\n      ');
      
      const insertQuery = `
        INSERT INTO Junction_Unidade_Especialidade (id_unidade, id_especialidade, created_at)
        VALUES ${values}
      `;
      
      const [result] = await connection.query(insertQuery);
      inserted += result.affectedRows;
      
      console.log(`  Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${result.affectedRows} inseridos`);
    }
    
    console.log(`\n✓ Total inserido: ${inserted} vínculos\n`);
    
    // ========================================================================
    // VALIDAÇÃO FINAL
    // ========================================================================
    
    console.log('=== VALIDAÇÃO FINAL ===\n');
    
    const [finalUnidadesComEsp] = await connection.query(`
      SELECT COUNT(DISTINCT id_unidade) as total 
      FROM Junction_Unidade_Especialidade
    `);
    console.log(`Unidades COM especialidades: ${finalUnidadesComEsp[0].total}`);
    
    const [finalUnidadesSemEsp] = await connection.query(`
      SELECT COUNT(*) as total 
      FROM PROD_Unidade_Saude u
      WHERE u.ativo = TRUE
        AND NOT EXISTS (
          SELECT 1 FROM Junction_Unidade_Especialidade jue
          WHERE jue.id_unidade = u.id
        )
    `);
    console.log(`Unidades SEM especialidades: ${finalUnidadesSemEsp[0].total}`);
    
    const [totalVinculos] = await connection.query(`
      SELECT COUNT(*) as total FROM Junction_Unidade_Especialidade
    `);
    console.log(`Total de vínculos unidade-especialidade: ${totalVinculos[0].total}\n`);
    
    // Top 10 especialidades mais comuns nas unidades
    console.log('=== TOP 10 ESPECIALIDADES NAS UNIDADES ===\n');
    const [topEsp] = await connection.query(`
      SELECT 
        e.nome,
        COUNT(DISTINCT jue.id_unidade) as qtd_unidades
      FROM Junction_Unidade_Especialidade jue
      INNER JOIN PROD_Especialidade e ON e.id = jue.id_especialidade
      GROUP BY e.id, e.nome
      ORDER BY qtd_unidades DESC
      LIMIT 10
    `);
    
    topEsp.forEach((row, index) => {
      console.log(`${index + 1}. ${row.nome}: ${row.qtd_unidades} unidades`);
    });
    
    console.log('\n=== COMMIT ===\n');
    await connection.query('COMMIT');
    console.log('✓ Transação confirmada com sucesso!\n');
    
    console.log('============================================================');
    console.log('CONCLUSÃO');
    console.log('============================================================');
    console.log(`✓ ${inserted} especialidades inseridas para ${unidadesAfetadas} unidades`);
    console.log(`✓ Sistema agora exibe especialidades no frontend automaticamente\n`);
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    if (connection) {
      await connection.query('ROLLBACK');
      console.log('   ROLLBACK executado\n');
    }
    throw error;
  } finally {
    if (connection) await connection.end();
    rl.close();
  }
}

main().catch(console.error);
