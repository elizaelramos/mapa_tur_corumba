const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { buildDatabaseUrl } = require('../packages/database/build-database-url');

async function analisarEspecialidades() {
  console.log('\n=== Análise de Especialidades dos Médicos ===\n');
  
  const mysql = require('mysql2/promise');
  const connection = await mysql.createConnection(buildDatabaseUrl());
  
  try {
    // 1. Verificar estrutura das especialidades
    console.log('🔍 ANÁLISE 1: Estrutura de especialidades\n');
    
    const [totalEspecialidades] = await connection.query(`
      SELECT COUNT(*) as total FROM PROD_Especialidade
    `);
    console.log(`📊 Total de especialidades cadastradas: ${totalEspecialidades[0].total}`);
    
    const [totalMedicos] = await connection.query(`
      SELECT COUNT(*) as total FROM PROD_Medico WHERE ativo = TRUE
    `);
    console.log(`📊 Total de médicos ativos: ${totalMedicos[0].total}`);
    
    const [totalVinculosMedicoEsp] = await connection.query(`
      SELECT COUNT(*) as total FROM Junction_Medico_Especialidade
    `);
    console.log(`📊 Total de vínculos médico-especialidade: ${totalVinculosMedicoEsp[0].total}`);
    
    // 2. Verificar médicos SEM especialidade
    console.log('\n🔍 ANÁLISE 2: Médicos sem especialidade\n');
    
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
    
    // Amostra de médicos sem especialidade
    if (medicosSemEsp[0].total > 0) {
      const [amostraSemEsp] = await connection.query(`
        SELECT m.id, m.nome, m.cpf, m.cbo
        FROM PROD_Medico m
        WHERE m.ativo = TRUE
          AND NOT EXISTS (
            SELECT 1 FROM Junction_Medico_Especialidade jme 
            WHERE jme.id_medico = m.id
          )
        LIMIT 10
      `);
      
      console.log('\n   Amostra de médicos sem especialidade (10 primeiros):');
      amostraSemEsp.forEach(m => {
        console.log(`   - [${m.id}] ${m.nome}`);
        console.log(`     CPF: ${m.cpf} | CBO: ${m.cbo || 'N/A'}\n`);
      });
    }
    
    // 3. Verificar se o campo CBO tem informação de especialidade
    console.log('🔍 ANÁLISE 3: Códigos CBO dos profissionais\n');
    
    const [cbosUnicos] = await connection.query(`
      SELECT cbo, COUNT(*) as total
      FROM PROD_Medico
      WHERE cbo IS NOT NULL AND cbo != '' AND ativo = TRUE
      GROUP BY cbo
      ORDER BY total DESC
      LIMIT 15
    `);
    
    console.log('   Top 15 códigos CBO mais comuns:');
    cbosUnicos.forEach(c => {
      console.log(`   - CBO ${c.cbo}: ${c.total} profissionais`);
    });
    
    // 4. Verificar unidades e suas especialidades
    console.log('\n🔍 ANÁLISE 4: Especialidades por unidade\n');
    
    const [unidadesComEsp] = await connection.query(`
      SELECT COUNT(DISTINCT u.id) as total
      FROM PROD_Unidade_Saude u
      WHERE u.ativo = TRUE
        AND EXISTS (
          SELECT 1 FROM Junction_Unidade_Especialidade jue
          WHERE jue.id_unidade = u.id
        )
    `);
    console.log(`📍 Unidades com especialidades vinculadas: ${unidadesComEsp[0].total}`);
    
    const [unidadesSemEsp] = await connection.query(`
      SELECT COUNT(*) as total
      FROM PROD_Unidade_Saude u
      WHERE u.ativo = TRUE
        AND NOT EXISTS (
          SELECT 1 FROM Junction_Unidade_Especialidade jue
          WHERE jue.id_unidade = u.id
        )
    `);
    console.log(`⚠️  Unidades SEM especialidades: ${unidadesSemEsp[0].total}`);
    
    // 5. Verificar se há mapeamento de especialidades
    console.log('\n🔍 ANÁLISE 5: Sistema de mapeamento de especialidades\n');
    
    const [totalMapeamentos] = await connection.query(`
      SELECT COUNT(*) as total FROM Especialidade_Mapeamento
    `);
    console.log(`📋 Total de mapeamentos de especialidades: ${totalMapeamentos[0].total}`);
    
    if (totalMapeamentos[0].total > 0) {
      const [amostraMapeamentos] = await connection.query(`
        SELECT especialidade_bruta, especialidade_normalizada
        FROM Especialidade_Mapeamento
        LIMIT 10
      `);
      
      console.log('\n   Amostra de mapeamentos (10 primeiros):');
      amostraMapeamentos.forEach(m => {
        console.log(`   "${m.especialidade_bruta}" → "${m.especialidade_normalizada}"`);
      });
    }
    
    // 6. Análise do CSV de profissionais (verificar se tem especialidade)
    console.log('\n🔍 ANÁLISE 6: Dados do CSV original\n');
    
    const fs = require('fs');
    const csvPath = path.join(__dirname, '../uploads/processed/profissionais_parsed_clean.csv');
    const csv = fs.readFileSync(csvPath, 'utf8');
    const lines = csv.split('\n');
    
    console.log(`📄 Estrutura do CSV:`);
    console.log(`   ${lines[0]}\n`);
    
    // Verificar se há coluna de especialidade ou CBO text
    const header = lines[0].toLowerCase();
    const temEspecialidade = header.includes('especialidade');
    const temCboText = header.includes('cbo_text');
    
    console.log(`   ✓ Tem campo de especialidade: ${temEspecialidade ? 'SIM' : 'NÃO'}`);
    console.log(`   ✓ Tem campo cbo_text: ${temCboText ? 'SIM' : 'NÃO'}`);
    
    if (temCboText) {
      console.log('\n   Amostra de profissionais com CBO (3 primeiros):');
      for (let i = 1; i <= 3 && i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length >= 7) {
          const nome = parts[4];
          const cboCode = parts[5];
          const cboText = parts[6]?.replace(/"/g, '');
          console.log(`   - ${nome}`);
          console.log(`     CBO: ${cboCode} (${cboText})\n`);
        }
      }
    }
    
    // 7. Recomendações
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 RECOMENDAÇÕES\n');
    
    if (medicosSemEsp[0].total > 0) {
      console.log(`⚠️  ${medicosSemEsp[0].total} médicos sem especialidade cadastrada`);
      console.log('\n   Opções para resolver:');
      console.log('   1. Criar especialidades baseadas no campo CBO (Classificação Brasileira de Ocupações)');
      console.log('   2. Importar texto do CBO do CSV (coluna cbo_text) como especialidade');
      console.log('   3. Criar sistema de mapeamento CBO → Especialidade');
      console.log('   4. Permitir cadastro manual no sistema\n');
    }
    
    if (temCboText) {
      console.log('✅ O CSV possui informação de especialidade (campo cbo_text)');
      console.log('   Podemos usar essa informação para:');
      console.log('   - Criar especialidades automaticamente');
      console.log('   - Vincular médicos às suas especialidades');
      console.log('   - Popular Junction_Medico_Especialidade\n');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } finally {
    await connection.end();
  }
}

analisarEspecialidades().catch(console.error);
