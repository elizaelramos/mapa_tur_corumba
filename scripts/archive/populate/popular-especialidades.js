const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { buildDatabaseUrl } = require('../packages/database/build-database-url');

async function popularEspecialidades() {
  console.log('\n=== Popular Especialidades dos Médicos CNES ===\n');
  
  const mysql = require('mysql2/promise');
  const connection = await mysql.createConnection(buildDatabaseUrl());
  
  try {
    await connection.query('START TRANSACTION');
    console.log('✅ Transação iniciada\n');
    
    // 1. Ler CSV e extrair CBOs únicos
    console.log('📂 Lendo CSV de profissionais...');
    const csvPath = path.join(__dirname, '../uploads/processed/profissionais_parsed_clean.csv');
    const csv = fs.readFileSync(csvPath, 'utf8');
    const lines = csv.split('\n').slice(1); // Pula header
    
    const cboMap = new Map(); // cbo_code -> cbo_text
    const medicoPorCpf = new Map(); // cpf -> { cbo_code, cbo_text }
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const parts = line.split(',');
      if (parts.length >= 7) {
        const cpf = parts[2];
        const cboCode = parts[5];
        const cboText = parts[6]?.replace(/"/g, '').trim();
        
        if (cboCode && cboText) {
          cboMap.set(cboCode, cboText);
          
          if (!medicoPorCpf.has(cpf)) {
            medicoPorCpf.set(cpf, { cboCode, cboText });
          }
        }
      }
    }
    
    console.log(`✅ ${cboMap.size} códigos CBO únicos encontrados`);
    console.log(`✅ ${medicoPorCpf.size} profissionais com CPF\n`);
    
    // 2. Criar especialidades que não existem
    console.log('🔨 Criando especialidades baseadas nos CBOs...\n');
    
    let especialidadesCriadas = 0;
    const especialidadeIdMap = new Map(); // nome_normalizado -> id
    
    for (const [cboCode, cboText] of cboMap.entries()) {
      // Normalizar nome da especialidade
      let nomeEspecialidade = cboText
        .replace(/,/g, '')
        .split(' ')
        .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase())
        .join(' ');
      
      // Verificar se especialidade já existe
      const [existe] = await connection.query(`
        SELECT id FROM PROD_Especialidade
        WHERE nome = ?
      `, [nomeEspecialidade]);
      
      if (existe.length === 0) {
        // Criar nova especialidade
        const [result] = await connection.query(`
          INSERT INTO PROD_Especialidade (nome, ativo, created_at, updated_at)
          VALUES (?, TRUE, NOW(), NOW())
        `, [nomeEspecialidade]);
        
        especialidadeIdMap.set(nomeEspecialidade, result.insertId);
        especialidadesCriadas++;
        
        if (especialidadesCriadas <= 10) {
          console.log(`   ✅ Criada: "${nomeEspecialidade}" (CBO: ${cboCode})`);
        }
      } else {
        especialidadeIdMap.set(nomeEspecialidade, existe[0].id);
      }
    }
    
    if (especialidadesCriadas > 10) {
      console.log(`   ... e mais ${especialidadesCriadas - 10} especialidades`);
    }
    
    console.log(`\n✅ Total de especialidades criadas: ${especialidadesCriadas}\n`);
    
    // 3. Vincular médicos às especialidades
    console.log('🔗 Vinculando médicos às especialidades...\n');
    
    let vinculosCriados = 0;
    let medicosProcessados = 0;
    let medicosNaoEncontrados = 0;
    
    for (const [cpf, dados] of medicoPorCpf.entries()) {
      // Buscar médico por CPF
      const [medico] = await connection.query(`
        SELECT id FROM PROD_Medico
        WHERE cpf = ? AND ativo = TRUE
      `, [cpf]);
      
      if (medico.length === 0) {
        medicosNaoEncontrados++;
        continue;
      }
      
      const medicoId = medico[0].id;
      
      // Normalizar nome da especialidade
      let nomeEspecialidade = dados.cboText
        .replace(/,/g, '')
        .split(' ')
        .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase())
        .join(' ');
      
      const especialidadeId = especialidadeIdMap.get(nomeEspecialidade);
      
      if (!especialidadeId) {
        // Tentar buscar no banco
        const [esp] = await connection.query(`
          SELECT id FROM PROD_Especialidade WHERE nome = ?
        `, [nomeEspecialidade]);
        
        if (esp.length === 0) continue;
        especialidadeIdMap.set(nomeEspecialidade, esp[0].id);
      }
      
      // Verificar se vínculo já existe
      const [vinculoExiste] = await connection.query(`
        SELECT 1 FROM Junction_Medico_Especialidade
        WHERE id_medico = ? AND id_especialidade = ?
      `, [medicoId, especialidadeIdMap.get(nomeEspecialidade)]);
      
      if (vinculoExiste.length === 0) {
        // Criar vínculo
        await connection.query(`
          INSERT INTO Junction_Medico_Especialidade (id_medico, id_especialidade, created_at)
          VALUES (?, ?, NOW())
        `, [medicoId, especialidadeIdMap.get(nomeEspecialidade)]);
        
        vinculosCriados++;
      }
      
      medicosProcessados++;
      
      if (medicosProcessados % 100 === 0) {
        console.log(`   Processados: ${medicosProcessados}/${medicoPorCpf.size}...`);
      }
    }
    
    console.log(`\n✅ ${vinculosCriados} vínculos médico-especialidade criados`);
    console.log(`✅ ${medicosProcessados} médicos processados`);
    if (medicosNaoEncontrados > 0) {
      console.log(`⚠️  ${medicosNaoEncontrados} médicos não encontrados no banco\n`);
    }
    
    // 4. Validações finais
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 VALIDAÇÕES FINAIS\n');
    
    const [totalEsp] = await connection.query(`
      SELECT COUNT(*) as total FROM PROD_Especialidade WHERE ativo = TRUE
    `);
    console.log(`✅ Total de especialidades ativas: ${totalEsp[0].total}`);
    
    const [totalVinculos] = await connection.query(`
      SELECT COUNT(*) as total FROM Junction_Medico_Especialidade
    `);
    console.log(`✅ Total de vínculos médico-especialidade: ${totalVinculos[0].total}`);
    
    const [medicosSemEsp] = await connection.query(`
      SELECT COUNT(*) as total
      FROM PROD_Medico m
      WHERE m.ativo = TRUE
        AND NOT EXISTS (
          SELECT 1 FROM Junction_Medico_Especialidade jme 
          WHERE jme.id_medico = m.id
        )
    `);
    console.log(`⚠️  Médicos ativos SEM especialidade: ${medicosSemEsp[0].total}`);
    
    const [medicosComEsp] = await connection.query(`
      SELECT COUNT(DISTINCT jme.id_medico) as total
      FROM Junction_Medico_Especialidade jme
      INNER JOIN PROD_Medico m ON m.id = jme.id_medico
      WHERE m.ativo = TRUE
    `);
    console.log(`✅ Médicos ativos COM especialidade: ${medicosComEsp[0].total}`);
    
    // Top especialidades
    console.log('\n📋 Top 10 especialidades mais comuns:\n');
    const [topEsp] = await connection.query(`
      SELECT e.nome, COUNT(jme.id_medico) as total
      FROM PROD_Especialidade e
      INNER JOIN Junction_Medico_Especialidade jme ON jme.id_especialidade = e.id
      GROUP BY e.id, e.nome
      ORDER BY total DESC
      LIMIT 10
    `);
    
    topEsp.forEach((esp, i) => {
      console.log(`   ${i+1}. ${esp.nome}: ${esp.total} profissionais`);
    });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Aguardar confirmação
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('Deseja fazer COMMIT das alterações? (s/n): ', async (answer) => {
      if (answer.toLowerCase() === 's') {
        await connection.query('COMMIT');
        console.log('\n✅ COMMIT realizado com sucesso!\n');
        console.log('As especialidades foram criadas e vinculadas aos médicos.\n');
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
    console.error('\n❌ Erro:', error.message);
    console.error(error.stack);
    console.error('\n🔄 Executando ROLLBACK...');
    await connection.query('ROLLBACK');
    console.error('✅ Rollback concluído. Nenhuma alteração foi feita.\n');
    await connection.end();
    process.exit(1);
  }
}

popularEspecialidades().catch(console.error);
