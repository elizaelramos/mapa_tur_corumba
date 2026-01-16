// ============================================================================
// Script: Mesclar Unidades Duplicadas - Lote 3
// ============================================================================
// Mescla unidades duplicadas identificadas pelo usuário
// Transfere dados (coordenadas, imagens, telefones) e vínculos de médicos
// da unidade antiga para a nova, depois desativa a antiga
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

// Pares de unidades duplicadas: [ID_ANTIGA, ID_NOVA_CNES]
const DUPLICATES = [
  { old_id: 6, new_id: 31, nome: 'UBS DR BONIFACIO TIKAYOSHI TIAEN' },
  { old_id: 7, new_id: 47, nome: 'UBS DR BRENO DE MEDEIROS' },
  { old_id: 12, new_id: 58, nome: 'UBS DR HUMBERTO PEREIRA' },
  { old_id: 21, new_id: 55, nome: 'UBS DR ENIO CUNHA II' },
];

async function main() {
  let connection;
  const autoConfirm = process.argv[2] === '--confirm';
  
  try {
    console.log('============================================================');
    console.log('MESCLAR UNIDADES DUPLICADAS - LOTE 3');
    console.log('============================================================\n');
    
    connection = await mysql.createConnection(buildDatabaseUrl());
    console.log('✓ Conectado ao MySQL\n');
    
    await connection.query('START TRANSACTION');
    
    // ========================================================================
    // ANÁLISE INICIAL
    // ========================================================================
    
    console.log('=== ANÁLISE DAS DUPLICATAS ===\n');
    
    for (const dup of DUPLICATES) {
      console.log(`\n${dup.nome}`);
      console.log('─'.repeat(70));
      
      // Dados da unidade ANTIGA
      const [oldUnit] = await connection.query(`
        SELECT 
          u.id, u.nome, u.latitude, u.longitude, u.telefone, u.whatsapp,
          u.imagem_url, u.icone_url, u.endereco, u.ativo,
          (SELECT COUNT(*) FROM Junction_Unidade_Medico jum WHERE jum.id_unidade = u.id) as qtd_medicos,
          (SELECT COUNT(*) FROM Junction_Unidade_Especialidade jue WHERE jue.id_unidade = u.id) as qtd_especialidades
        FROM PROD_Unidade_Saude u
        WHERE u.id = ?
      `, [dup.old_id]);
      
      // Dados da unidade NOVA
      const [newUnit] = await connection.query(`
        SELECT 
          u.id, u.nome, u.latitude, u.longitude, u.telefone, u.whatsapp,
          u.imagem_url, u.icone_url, u.endereco, u.ativo,
          (SELECT COUNT(*) FROM Junction_Unidade_Medico jum WHERE jum.id_unidade = u.id) as qtd_medicos,
          (SELECT COUNT(*) FROM Junction_Unidade_Especialidade jue WHERE jue.id_unidade = u.id) as qtd_especialidades
        FROM PROD_Unidade_Saude u
        WHERE u.id = ?
      `, [dup.new_id]);
      
      if (oldUnit.length === 0) {
        console.log(`⚠️  ANTIGA (ID ${dup.old_id}): NÃO ENCONTRADA`);
      } else {
        const old = oldUnit[0];
        console.log(`ANTIGA (ID ${dup.old_id}):`);
        console.log(`  Nome: ${old.nome}`);
        console.log(`  Coords: ${old.latitude}, ${old.longitude}`);
        console.log(`  Telefone: ${old.telefone || 'N/A'}`);
        console.log(`  WhatsApp: ${old.whatsapp || 'N/A'}`);
        console.log(`  Imagem: ${old.imagem_url || 'N/A'}`);
        console.log(`  Ícone: ${old.icone_url || 'N/A'}`);
        console.log(`  Médicos: ${old.qtd_medicos}`);
        console.log(`  Especialidades: ${old.qtd_especialidades}`);
        console.log(`  Ativo: ${old.ativo ? 'SIM' : 'NÃO'}`);
      }
      
      console.log();
      
      if (newUnit.length === 0) {
        console.log(`⚠️  NOVA (ID ${dup.new_id}): NÃO ENCONTRADA`);
      } else {
        const newU = newUnit[0];
        console.log(`NOVA (ID ${dup.new_id}):`);
        console.log(`  Nome: ${newU.nome}`);
        console.log(`  Endereço: ${newU.endereco || 'N/A'}`);
        console.log(`  Coords: ${newU.latitude}, ${newU.longitude}`);
        console.log(`  Telefone: ${newU.telefone || 'N/A'}`);
        console.log(`  WhatsApp: ${newU.whatsapp || 'N/A'}`);
        console.log(`  Imagem: ${newU.imagem_url || 'N/A'}`);
        console.log(`  Ícone: ${newU.icone_url || 'N/A'}`);
        console.log(`  Médicos: ${newU.qtd_medicos}`);
        console.log(`  Especialidades: ${newU.qtd_especialidades}`);
        console.log(`  Ativo: ${newU.ativo ? 'SIM' : 'NÃO'}`);
      }
    }
    
    // ========================================================================
    // MESCLAR DADOS
    // ========================================================================
    
    console.log('\n\n=== OPERAÇÕES A SEREM REALIZADAS ===\n');
    console.log('Para cada par de duplicatas:');
    console.log('1. Copiar coordenadas (lat/lng) da ANTIGA para NOVA');
    console.log('2. Copiar telefone da ANTIGA para NOVA (SOMENTE se NOVA não tiver)');
    console.log('3. Copiar WhatsApp da ANTIGA para NOVA (SOMENTE se NOVA não tiver)');
    console.log('4. Copiar imagem_url da ANTIGA para NOVA (se houver)');
    console.log('5. Copiar icone_url da ANTIGA para NOVA (se houver)');
    console.log('6. MANTER vínculos com médicos da NOVA (CNES) - PRIORIDADE');
    console.log('7. REMOVER todos os vínculos da ANTIGA');
    console.log('8. Recalcular especialidades da NOVA baseado nos médicos dela');
    console.log('9. Desativar unidade ANTIGA (ativo = FALSE)\n');
    
    let answer;
    if (autoConfirm) {
      console.log('Modo auto-confirmação ativado (--confirm)');
      answer = 's';
    } else {
      answer = await question('Deseja fazer COMMIT das alterações? (s/n): ');
    }
    
    if (answer.toLowerCase() !== 's') {
      console.log('\n❌ Operação cancelada. ROLLBACK executado.\n');
      await connection.query('ROLLBACK');
      return;
    }
    
    console.log('\n=== EXECUTANDO MESCLAGEM ===\n');
    
    let totalVinculosRemovidos = 0;
    let totalEspecialidadesRecalculadas = 0;
    let totalUnidadesDesativadas = 0;
    
    for (const dup of DUPLICATES) {
      console.log(`\nProcessando: ${dup.nome}`);
      console.log('─'.repeat(70));
      
      // Verificar se nova tem telefone/whatsapp válidos (não são endereços)
      const [checkNew] = await connection.query(`
        SELECT telefone, whatsapp FROM PROD_Unidade_Saude WHERE id = ?
      `, [dup.new_id]);
      
      const newTelefone = checkNew[0]?.telefone;
      const newWhatsapp = checkNew[0]?.whatsapp;
      
      // Telefone/WhatsApp inválidos são aqueles que parecem endereços
      const telefoneLooksLikeAddress = newTelefone && (
        newTelefone.toUpperCase().includes('RUA') ||
        newTelefone.toUpperCase().includes('AVENIDA') ||
        newTelefone.toUpperCase().includes('RODOVIA') ||
        newTelefone.toUpperCase().includes('ALAMEDA') ||
        newTelefone.length > 30
      );
      
      // 1. Copiar dados seletivos da ANTIGA para NOVA
      await connection.query(`
        UPDATE PROD_Unidade_Saude new
        INNER JOIN PROD_Unidade_Saude old ON old.id = ?
        SET
          new.latitude = old.latitude,
          new.longitude = old.longitude,
          new.telefone = CASE 
            WHEN new.telefone IS NULL OR ? THEN old.telefone 
            ELSE new.telefone 
          END,
          new.whatsapp = COALESCE(new.whatsapp, old.whatsapp),
          new.imagem_url = COALESCE(new.imagem_url, old.imagem_url),
          new.icone_url = COALESCE(new.icone_url, old.icone_url),
          new.updated_at = NOW()
        WHERE new.id = ?
      `, [dup.old_id, telefoneLooksLikeAddress ? 1 : 0, dup.new_id]);
      
      console.log('  ✓ Dados copiados (coordenadas, imagens)');
      if (telefoneLooksLikeAddress) {
        console.log('  ✓ Telefone corrigido (era endereço)');
      }
      
      // 2. Contar vínculos que serão removidos da ANTIGA
      const [countOld] = await connection.query(`
        SELECT 
          (SELECT COUNT(*) FROM Junction_Unidade_Medico WHERE id_unidade = ?) as medicos,
          (SELECT COUNT(*) FROM Junction_Unidade_Especialidade WHERE id_unidade = ?) as especialidades
      `, [dup.old_id, dup.old_id]);
      
      const vinculosRemovidos = countOld[0].medicos + countOld[0].especialidades;
      totalVinculosRemovidos += vinculosRemovidos;
      
      console.log(`  ℹ️  Unidade ANTIGA tinha ${countOld[0].medicos} médicos e ${countOld[0].especialidades} especialidades`);
      
      // 3. REMOVER todos os vínculos da unidade ANTIGA
      await connection.query(`
        DELETE FROM Junction_Unidade_Medico WHERE id_unidade = ?
      `, [dup.old_id]);
      
      await connection.query(`
        DELETE FROM Junction_Unidade_Especialidade WHERE id_unidade = ?
      `, [dup.old_id]);
      
      console.log(`  ✓ Vínculos da ANTIGA removidos: ${vinculosRemovidos}`);
      
      // 4. Recalcular especialidades da NOVA baseado nos médicos CNES
      // Primeiro, remover especialidades antigas da NOVA
      await connection.query(`
        DELETE FROM Junction_Unidade_Especialidade WHERE id_unidade = ?
      `, [dup.new_id]);
      
      // Derivar especialidades dos médicos que trabalham na NOVA
      const [novasEsp] = await connection.query(`
        INSERT INTO Junction_Unidade_Especialidade (id_unidade, id_especialidade, created_at)
        SELECT DISTINCT
          ?,
          jme.id_especialidade,
          NOW()
        FROM Junction_Unidade_Medico jum
        INNER JOIN Junction_Medico_Especialidade jme ON jme.id_medico = jum.id_medico
        WHERE jum.id_unidade = ?
      `, [dup.new_id, dup.new_id]);
      
      totalEspecialidadesRecalculadas += novasEsp.affectedRows;
      console.log(`  ✓ Especialidades recalculadas para NOVA: ${novasEsp.affectedRows}`);
      
      // 5. Desativar unidade ANTIGA
      await connection.query(`
        UPDATE PROD_Unidade_Saude
        SET ativo = FALSE, updated_at = NOW()
        WHERE id = ?
      `, [dup.old_id]);
      
      totalUnidadesDesativadas++;
      console.log(`  ✓ Unidade ANTIGA (ID ${dup.old_id}) desativada`);
    }
    
    // ========================================================================
    // VALIDAÇÃO FINAL
    // ========================================================================
    
    console.log('\n\n=== VALIDAÇÃO FINAL ===\n');
    
    for (const dup of DUPLICATES) {
      const [result] = await connection.query(`
        SELECT 
          u.id, u.nome, u.ativo,
          (SELECT COUNT(*) FROM Junction_Unidade_Medico jum WHERE jum.id_unidade = u.id) as qtd_medicos,
          (SELECT COUNT(*) FROM Junction_Unidade_Especialidade jue WHERE jue.id_unidade = u.id) as qtd_especialidades
        FROM PROD_Unidade_Saude u
        WHERE u.id IN (?, ?)
        ORDER BY u.id
      `, [dup.old_id, dup.new_id]);
      
      console.log(`${dup.nome}:`);
      result.forEach(r => {
        console.log(`  ID ${r.id}: Ativo=${r.ativo ? 'SIM' : 'NÃO'}, Médicos=${r.qtd_medicos}, Especialidades=${r.qtd_especialidades}`);
      });
      console.log();
    }
    
    console.log('=== RESUMO ===\n');
    console.log(`✓ ${totalUnidadesDesativadas} unidades antigas desativadas`);
    console.log(`✓ ${totalVinculosRemovidos} vínculos antigos removidos`);
    console.log(`✓ ${totalEspecialidadesRecalculadas} especialidades recalculadas nas unidades NOVAS`);
    console.log(`✓ Dados CNES mantidos como prioritários\n`);
    
    console.log('=== COMMIT ===\n');
    await connection.query('COMMIT');
    console.log('✓ Transação confirmada com sucesso!\n');
    
    console.log('============================================================');
    console.log('MESCLAGEM CONCLUÍDA');
    console.log('============================================================\n');
    
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
