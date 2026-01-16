const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const { buildDatabaseUrl } = require('../packages/database/build-database-url');

(async () => {
  const conn = await mysql.createConnection(buildDatabaseUrl());
  
  // Todas unidades ordenadas por quantidade de especialidades
  const [rows] = await conn.query(`
    SELECT 
      u.id,
      u.nome,
      u.id_origem,
      (SELECT COUNT(*) FROM Junction_Unidade_Medico jum WHERE jum.id_unidade = u.id) as qtd_medicos,
      (SELECT COUNT(*) FROM Junction_Unidade_Especialidade jue WHERE jue.id_unidade = u.id) as qtd_especialidades
    FROM PROD_Unidade_Saude u
    WHERE u.ativo = TRUE
    ORDER BY qtd_especialidades DESC
    LIMIT 10
  `);
  
  console.log('\n=== TOP 10 UNIDADES COM MAIS ESPECIALIDADES ===\n');
  rows.forEach(r => {
    console.log(`ID ${r.id}: ${r.nome.substring(0, 50)}`);
    console.log(`  CNES: ${r.id_origem}`);
    console.log(`  Médicos: ${r.qtd_medicos} | Especialidades: ${r.qtd_especialidades}\n`);
  });
  
  // Exemplo de unidade específica com lista completa
  const [detalhe] = await conn.query(`
    SELECT 
      u.id,
      u.nome,
      GROUP_CONCAT(e.nome ORDER BY e.nome SEPARATOR ', ') as especialidades
    FROM PROD_Unidade_Saude u
    INNER JOIN Junction_Unidade_Especialidade jue ON jue.id_unidade = u.id
    INNER JOIN PROD_Especialidade e ON e.id = jue.id_especialidade
    WHERE u.id = ?
    GROUP BY u.id, u.nome
  `, [rows[0].id]);
  
  if (detalhe.length > 0) {
    console.log('=== EXEMPLO DETALHADO (UNIDADE COM MAIS ESPECIALIDADES) ===\n');
    console.log(`${detalhe[0].nome}\n`);
    console.log(`Especialidades: ${detalhe[0].especialidades}\n`);
  }
  
  await conn.end();
})();
