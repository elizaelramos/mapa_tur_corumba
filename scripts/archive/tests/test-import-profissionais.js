const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { buildDatabaseUrl } = require('../packages/database/build-database-url');

async function importProfissionais() {
  console.log('\n=== Import de Profissionais CNES ===\n');
  
  const mysql = require('mysql2/promise');
  const connection = await mysql.createConnection(buildDatabaseUrl());
  
  try {
    // Iniciar transação
    await connection.query('START TRANSACTION');
    console.log('✅ Transação iniciada\n');
    
    // Criar tabela temporária
    console.log('📋 Criando tabela temporária...');
    await connection.query(`
      CREATE TEMPORARY TABLE profissionais_import_tmp (
        cpf VARCHAR(14),
        cns VARCHAR(15),
        nome VARCHAR(255),
        cbo VARCHAR(10),
        cnes_unidade VARCHAR(10)
      )
    `);
    console.log('✅ Tabela temporária criada\n');
    
    // Carregar CSV via Node.js
    console.log('📂 Carregando CSV via Node.js...');
    const csvPath = path.join(__dirname, '../uploads/processed/profissionais_parsed_clean.csv');
    const csv = fs.readFileSync(csvPath, 'utf8');
    const lines = csv.split('\n').slice(1); // Pula header
    
    let loaded = 0;
    for (const line of lines) {
      if (!line.trim()) continue;
      
      // CSV format: cnes,unidade,cpf,cns,nome,cbo_code,cbo_text
      const parts = line.split(',');
      if (parts.length >= 6) {
        const cnes = parts[0];
        const cpf = parts[2];
        const cns = parts[3];
        const nome = parts[4];
        const cbo = parts[5];
        
        await connection.query(
          'INSERT INTO profissionais_import_tmp VALUES (?, ?, ?, ?, ?)',
          [cpf, cns, nome, cbo, cnes]
        );
        loaded++;
      }
    }
    console.log(`✅ ${loaded} registros carregados\n`);
    
    // Validações
    console.log('=== VALIDAÇÕES PRÉ-IMPORT ===\n');
    
    const [total] = await connection.query('SELECT COUNT(*) as total FROM profissionais_import_tmp');
    console.log(`📊 Total de profissionais a importar: ${total[0].total}`);
    
    const [duplicados] = await connection.query(`
      SELECT COUNT(*) as total
      FROM (
        SELECT cpf
        FROM profissionais_import_tmp 
        GROUP BY cpf 
        HAVING COUNT(*) > 1
      ) d
    `);
    console.log(`📊 CPFs duplicados no CSV: ${duplicados[0].total}`);
    
    const [existentes] = await connection.query(`
      SELECT COUNT(*) as total
      FROM profissionais_import_tmp i 
      WHERE EXISTS (SELECT 1 FROM PROD_Medico m WHERE m.cpf = i.cpf)
    `);
    console.log(`📊 Profissionais que já existem: ${existentes[0].total}`);
    
    const [novos] = await connection.query(`
      SELECT COUNT(*) as total
      FROM profissionais_import_tmp i 
      WHERE NOT EXISTS (SELECT 1 FROM PROD_Medico m WHERE m.cpf = i.cpf)
    `);
    console.log(`📊 Profissionais novos a inserir: ${novos[0].total}\n`);
    
    // Validar unidades
    const [cnesUnicos] = await connection.query('SELECT COUNT(DISTINCT cnes_unidade) as total FROM profissionais_import_tmp');
    console.log(`📍 CNES únicos no import: ${cnesUnicos[0].total}`);
    
    const [cnesNaoExistem] = await connection.query(`
      SELECT COUNT(DISTINCT cnes_unidade) as total
      FROM profissionais_import_tmp i
      WHERE NOT EXISTS (SELECT 1 FROM PROD_Unidade_Saude u WHERE u.id_origem = i.cnes_unidade)
    `);
    console.log(`⚠️  CNES que NÃO existem no sistema: ${cnesNaoExistem[0].total}`);
    
    if (cnesNaoExistem[0].total > 0) {
      const [listaNaoExistem] = await connection.query(`
        SELECT DISTINCT cnes_unidade
        FROM profissionais_import_tmp p
        WHERE NOT EXISTS (SELECT 1 FROM PROD_Unidade_Saude u WHERE u.id_origem = p.cnes_unidade)
        LIMIT 5
      `);
      console.log('\n   CNES não encontrados (primeiros 5):');
      listaNaoExistem.forEach(row => console.log(`   - ${row.cnes_unidade}`));
    }
    
    console.log('\n');
    
    // Amostra
    const [amostra] = await connection.query('SELECT cpf, LEFT(nome, 40) as nome, cbo, cnes_unidade FROM profissionais_import_tmp LIMIT 3');
    console.log('📋 Amostra de profissionais:');
    amostra.forEach(p => console.log(`   - ${p.nome} (CPF: ${p.cpf}, CBO: ${p.cbo}, CNES: ${p.cnes_unidade})`));
    
    console.log('\n=== EXECUTANDO UPSERT ===\n');
    
    // Atualizar existentes
    console.log('🔄 Atualizando profissionais existentes...');
    const [updateResult] = await connection.query(`
      UPDATE PROD_Medico m
      INNER JOIN profissionais_import_tmp tmp ON m.cpf = tmp.cpf
      SET 
        m.cns = CASE 
          WHEN m.cns IS NULL OR m.cns = '' THEN tmp.cns 
          ELSE m.cns 
        END,
        m.cbo = CASE 
          WHEN m.cbo IS NULL OR m.cbo = '' THEN tmp.cbo 
          ELSE m.cbo 
        END,
        m.updated_at = NOW()
    `);
    console.log(`✅ ${updateResult.affectedRows} profissionais atualizados\n`);
    
    // Inserir novos (apenas um registro por CPF - usa MIN para desempate)
    console.log('➕ Inserindo novos profissionais...');
    const [insertResult] = await connection.query(`
      INSERT INTO PROD_Medico (cpf, cns, nome, cbo, id_origem, ativo, created_at, updated_at)
      SELECT 
        tmp.cpf,
        MIN(tmp.cns) as cns,
        MIN(tmp.nome) as nome,
        MIN(tmp.cbo) as cbo,
        CONCAT('medico_cpf_', tmp.cpf) AS id_origem,
        TRUE AS ativo,
        NOW(),
        NOW()
      FROM profissionais_import_tmp tmp
      WHERE NOT EXISTS (
        SELECT 1 FROM PROD_Medico m WHERE m.cpf = tmp.cpf
      )
      GROUP BY tmp.cpf
    `);
    console.log(`✅ ${insertResult.affectedRows} novos profissionais inseridos\n`);
    
    // Criar vínculos
    console.log('🔗 Criando vínculos com unidades...');
    const [vinculosResult] = await connection.query(`
      INSERT INTO Junction_Unidade_Medico (id_unidade, id_medico, created_at)
      SELECT DISTINCT 
        u.id AS id_unidade,
        m.id AS id_medico,
        NOW()
      FROM profissionais_import_tmp tmp
      INNER JOIN PROD_Medico m ON m.cpf = tmp.cpf
      INNER JOIN PROD_Unidade_Saude u ON u.id_origem = tmp.cnes_unidade
      WHERE NOT EXISTS (
        SELECT 1 
        FROM Junction_Unidade_Medico j 
        WHERE j.id_unidade = u.id AND j.id_medico = m.id
      )
    `);
    console.log(`✅ ${vinculosResult.affectedRows} novos vínculos criados\n`);
    
    // Validações pós-import
    console.log('=== VALIDAÇÕES PÓS-IMPORT ===\n');
    
    const [totalMedicos] = await connection.query('SELECT COUNT(*) as total FROM PROD_Medico');
    console.log(`📊 Total de profissionais no banco: ${totalMedicos[0].total}`);
    
    const [comCpf] = await connection.query('SELECT COUNT(*) as total FROM PROD_Medico WHERE cpf IS NOT NULL');
    console.log(`📊 Profissionais com CPF: ${comCpf[0].total}`);
    
    const [totalVinculos] = await connection.query('SELECT COUNT(*) as total FROM Junction_Unidade_Medico');
    console.log(`📊 Total de vínculos: ${totalVinculos[0].total}`);
    
    const [semVinculo] = await connection.query(`
      SELECT COUNT(*) as total
      FROM PROD_Medico m
      WHERE m.cpf IN (SELECT cpf FROM profissionais_import_tmp)
        AND NOT EXISTS (SELECT 1 FROM Junction_Unidade_Medico j WHERE j.id_medico = m.id)
    `);
    console.log(`⚠️  Profissionais importados SEM vínculo: ${semVinculo[0].total}\n`);
    
    // Top unidades
    const [topUnidades] = await connection.query(`
      SELECT 
        u.nome AS unidade,
        u.id_origem AS cnes,
        COUNT(j.id_medico) AS total_profissionais
      FROM PROD_Unidade_Saude u
      LEFT JOIN Junction_Unidade_Medico j ON j.id_unidade = u.id
      GROUP BY u.id, u.nome, u.id_origem
      ORDER BY total_profissionais DESC
      LIMIT 5
    `);
    console.log('🏥 Top 5 unidades com mais profissionais:');
    topUnidades.forEach((u, i) => {
      console.log(`   ${i+1}. ${u.unidade.substring(0, 45)}... (${u.total_profissionais} profissionais)`);
    });
    
    console.log('\n=== RESUMO ===\n');
    console.log(`✅ ${insertResult.affectedRows} profissionais novos inseridos`);
    console.log(`✅ ${updateResult.affectedRows} profissionais existentes atualizados`);
    console.log(`✅ ${vinculosResult.affectedRows} vínculos criados`);
    console.log(`⚠️  ${semVinculo[0].total} profissionais sem vínculo (CNES não encontrado)\n`);
    
    console.log('=== DECISÃO ===\n');
    console.log('A transação está aberta. Os dados foram importados mas ainda não foram confirmados.');
    console.log('\nPara CONFIRMAR as alterações: Execute COMMIT no terminal MySQL');
    console.log('Para CANCELAR as alterações: Execute ROLLBACK no terminal MySQL\n');
    
    // Aguardar decisão do usuário
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('Deseja fazer COMMIT agora? (s/n): ', async (answer) => {
      if (answer.toLowerCase() === 's') {
        await connection.query('COMMIT');
        console.log('\n✅ COMMIT realizado com sucesso!\n');
        await connection.end();
        readline.close();
        process.exit(0);
      } else {
        await connection.query('ROLLBACK');
        console.log('\n🔄 ROLLBACK realizado. Nenhuma alteração foi feita.\n');
        await connection.end();
        readline.close();
        process.exit(0);
      }
    });
    
  } catch (error) {
    console.error('\n❌ Erro durante importação:', error.message);
    console.error('\n🔄 Executando ROLLBACK...');
    await connection.query('ROLLBACK');
    console.error('✅ Rollback concluído. Nenhuma alteração foi feita.\n');
    await connection.end();
    process.exit(1);
  }
}

importProfissionais().catch(console.error);
