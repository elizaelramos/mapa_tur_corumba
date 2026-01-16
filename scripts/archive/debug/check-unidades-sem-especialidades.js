const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const { buildDatabaseUrl } = require('../packages/database/build-database-url');

(async () => {
  const conn = await mysql.createConnection(buildDatabaseUrl());
  
  const [rows] = await conn.query(`
    SELECT 
      u.id, 
      u.nome,
      (SELECT COUNT(*) FROM Junction_Unidade_Medico jum WHERE jum.id_unidade = u.id) as qtd_medicos
    FROM PROD_Unidade_Saude u
    WHERE u.ativo = TRUE
      AND NOT EXISTS (
        SELECT 1 FROM Junction_Unidade_Especialidade jue
        WHERE jue.id_unidade = u.id
      )
    ORDER BY u.id
  `);
  
  console.log('\n=== UNIDADES SEM ESPECIALIDADES ===\n');
  rows.forEach(r => {
    console.log(`ID ${r.id}: ${r.nome}`);
    console.log(`  Médicos: ${r.qtd_medicos}\n`);
  });
  
  await conn.end();
})();
