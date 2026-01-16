const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { buildDatabaseUrl } = require('../packages/database/build-database-url');

async function checkDatabaseStatus() {
  console.log('\n=== Status Atual do Banco de Dados ===\n');
  
  const mysql = require('mysql2/promise');
  const connection = await mysql.createConnection(buildDatabaseUrl());
  
  try {
    // Contar unidades
    console.log('📍 UNIDADES DE SAÚDE:');
    const [unidades] = await connection.query(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN id_origem IS NOT NULL THEN 1 ELSE 0 END) as com_cnes
      FROM prod_unidade_saude
    `);
    console.log(`   Total: ${unidades[0].total}`);
    console.log(`   Com CNES (id_origem): ${unidades[0].com_cnes}\n`);
    
    // Amostra de unidades
    console.log('   Primeiras 5 unidades:');
    const [amostraUnidades] = await connection.query(`
      SELECT id, nome, id_origem as cnes, latitude, longitude
      FROM prod_unidade_saude
      ORDER BY id
      LIMIT 5
    `);
    amostraUnidades.forEach(u => {
      console.log(`   - [${u.id}] ${u.nome.substring(0, 40)}... (CNES: ${u.cnes || 'N/A'}) [${u.latitude},${u.longitude}]`);
    });
    
    // Contar médicos
    console.log('\n👨‍⚕️ PROFISSIONAIS:');
    const [medicos] = await connection.query(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN id_origem IS NOT NULL THEN 1 ELSE 0 END) as com_id_origem
      FROM prod_medico
    `);
    console.log(`   Total: ${medicos[0].total}`);
    console.log(`   Com id_origem: ${medicos[0].com_id_origem}\n`);
    
    // Amostra de médicos
    if (medicos[0].total > 0) {
      console.log('   Primeiras 3 profissionais:');
      const [amostraMedicos] = await connection.query(`
        SELECT id, nome, id_origem
        FROM prod_medico
        ORDER BY id
        LIMIT 3
      `);
      amostraMedicos.forEach(m => {
        console.log(`   - [${m.id}] ${m.nome.substring(0, 40)}... (id_origem: ${m.id_origem})`);
      });
      console.log('');
    }
    
    // Vínculos
    console.log('🔗 VÍNCULOS UNIDADE-MÉDICO:');
    const [vinculos] = await connection.query(`
      SELECT COUNT(*) as total
      FROM junction_unidade_medico
    `);
    console.log(`   Total de vínculos: ${vinculos[0].total}\n`);
    
    // Verificar sobreposição com CNES do CSV
    console.log('🔍 VERIFICAÇÃO DE SOBREPOSIÇÃO COM DADOS CNES:');
    
    // Lista de CNES do arquivo que vamos importar
    const cnesParaImportar = [
      '0148636', '0456462', '2376105', '2376121', '2376148', '2376156',
      '2376512', '2376520', '2536676', '2536684', '2558726', '2558742',
      '2558815', '2559498', '2591405', '2591553', '2599511', '2603470',
      '2676796', '2676818', '3043770', '3733300', '4844858', '5428343',
      '5457882', '5462258', '5721121', '6029043', '6091458', '6201385',
      '6356486', '6410812', '6450946', '6564070', '6585426', '6587720',
      '6921124', '7311141', '7311672', '7311680', '7320108', '7570643',
      '7573170', '7575297', '7575300', '7665199', '7789386', '7836546',
      '9191801'
    ];
    
    const placeholders = cnesParaImportar.map(() => '?').join(',');
    const [existentes] = await connection.query(`
      SELECT COUNT(*) as total
      FROM prod_unidade_saude
      WHERE id_origem IN (${placeholders})
    `, cnesParaImportar);
    
    console.log(`   CNES no CSV para importar: ${cnesParaImportar.length}`);
    console.log(`   CNES que JÁ existem no banco: ${existentes[0].total}`);
    console.log(`   CNES novos a inserir: ${cnesParaImportar.length - existentes[0].total}\n`);
    
    if (existentes[0].total > 0) {
      console.log('   ⚠️  Alguns CNES já existem - serão ATUALIZADOS (upsert)');
      const [exemplos] = await connection.query(`
        SELECT id, nome, id_origem as cnes
        FROM prod_unidade_saude
        WHERE id_origem IN (${placeholders})
        LIMIT 3
      `, cnesParaImportar);
      console.log('   Exemplos de unidades existentes:');
      exemplos.forEach(u => {
        console.log(`   - [${u.id}] ${u.nome.substring(0, 50)}... (CNES: ${u.cnes})`);
      });
    }
    
    console.log('\n✅ Análise concluída!\n');
    
  } finally {
    await connection.end();
  }
}

checkDatabaseStatus().catch(console.error);
