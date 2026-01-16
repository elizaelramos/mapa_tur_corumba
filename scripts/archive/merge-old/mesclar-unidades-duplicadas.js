const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { buildDatabaseUrl } = require('../packages/database/build-database-url');

async function mesclarUnidadesDuplicadas() {
  console.log('\n=== Mesclagem de Unidades Duplicadas ===\n');
  
  const mysql = require('mysql2/promise');
  const connection = await mysql.createConnection(buildDatabaseUrl());
  
  try {
    await connection.query('START TRANSACTION');
    console.log('✅ Transação iniciada\n');
    
    // Mapeamento manual das duplicações identificadas
    const duplicacoes = [
      { antiga_id: 10, nova_id: 61, nome: 'Angelica Anache' },
      { antiga_id: 13, nova_id: 49, nome: 'Dr Enio Cunha' },
      { antiga_id: 9, nova_id: 48, nome: 'Fernando Moutinho' },
      { antiga_id: 17, nova_id: 32, nome: 'Jardim dos Estados' },
      { antiga_id: 24, nova_id: 71, nome: 'João Fernandes' },
      { antiga_id: 16, nova_id: 44, nome: 'Luis Fragelli' },
      { antiga_id: 15, nova_id: 50, nome: 'Nova Corumbá' },
      { antiga_id: 2, nova_id: 46, nome: 'Padre Ernesto Sassida' },
      { antiga_id: 22, nova_id: 75, nome: 'Popular Velha' },
      { antiga_id: 18, nova_id: 34, nome: 'Rosimeire dos Santos Ajala' }
    ];
    
    console.log(`📋 ${duplicacoes.length} pares de duplicações identificados\n`);
    
    let totalMesclados = 0;
    let totalVinculosTransferidos = 0;
    
    for (const dup of duplicacoes) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🔄 Mesclando: ${dup.nome}`);
      console.log(`   Antiga [${dup.antiga_id}] → Nova [${dup.nova_id}]\n`);
      
      // 1. Buscar dados da unidade antiga
      const [antiga] = await connection.query(`
        SELECT latitude, longitude, imagem_url, icone_url, telefone, whatsapp
        FROM PROD_Unidade_Saude
        WHERE id = ?
      `, [dup.antiga_id]);
      
      if (antiga.length === 0) {
        console.log(`   ⚠️  Unidade antiga [${dup.antiga_id}] não encontrada. Pulando...\n`);
        continue;
      }
      
      const dadosAntiga = antiga[0];
      
      // 2. Buscar dados da unidade nova
      const [nova] = await connection.query(`
        SELECT latitude, longitude, imagem_url, icone_url, telefone, whatsapp
        FROM PROD_Unidade_Saude
        WHERE id = ?
      `, [dup.nova_id]);
      
      if (nova.length === 0) {
        console.log(`   ⚠️  Unidade nova [${dup.nova_id}] não encontrada. Pulando...\n`);
        continue;
      }
      
      const dadosNova = nova[0];
      
      console.log(`   📍 Dados da antiga:`);
      console.log(`      Coordenadas: ${dadosAntiga.latitude}, ${dadosAntiga.longitude}`);
      console.log(`      Imagem: ${dadosAntiga.imagem_url || 'N/A'}`);
      console.log(`      Ícone: ${dadosAntiga.icone_url || 'N/A'}`);
      console.log(`      Telefone: ${dadosAntiga.telefone || 'N/A'}`);
      console.log(`      WhatsApp: ${dadosAntiga.whatsapp || 'N/A'}\n`);
      
      // 3. Atualizar unidade nova com dados da antiga (só se a nova não tiver)
      const updates = [];
      const values = [];
      
      // Sempre copiar coordenadas se a nova tiver coordenadas padrão
      const defaultLat = -19.0078;
      const defaultLng = -57.6547;
      
      if (parseFloat(dadosNova.latitude) === defaultLat && parseFloat(dadosNova.longitude) === defaultLng) {
        updates.push('latitude = ?', 'longitude = ?');
        values.push(dadosAntiga.latitude, dadosAntiga.longitude);
        console.log(`   ✅ Coordenadas copiadas: ${dadosAntiga.latitude}, ${dadosAntiga.longitude}`);
      }
      
      // Copiar imagem_url se a nova não tiver
      if (dadosAntiga.imagem_url && !dadosNova.imagem_url) {
        updates.push('imagem_url = ?');
        values.push(dadosAntiga.imagem_url);
        console.log(`   ✅ Imagem URL copiada`);
      }
      
      // Copiar icone_url se a nova não tiver
      if (dadosAntiga.icone_url && !dadosNova.icone_url) {
        updates.push('icone_url = ?');
        values.push(dadosAntiga.icone_url);
        console.log(`   ✅ Ícone URL copiado`);
      }
      
      // Copiar telefone se a nova não tiver ou antiga for melhor
      if (dadosAntiga.telefone && (!dadosNova.telefone || dadosAntiga.telefone.length > dadosNova.telefone.length)) {
        updates.push('telefone = ?');
        values.push(dadosAntiga.telefone);
        console.log(`   ✅ Telefone copiado: ${dadosAntiga.telefone}`);
      }
      
      // Copiar whatsapp se a nova não tiver
      if (dadosAntiga.whatsapp && !dadosNova.whatsapp) {
        updates.push('whatsapp = ?');
        values.push(dadosAntiga.whatsapp);
        console.log(`   ✅ WhatsApp copiado: ${dadosAntiga.whatsapp}`);
      }
      
      if (updates.length > 0) {
        updates.push('updated_at = NOW()');
        values.push(dup.nova_id);
        
        const sql = `UPDATE PROD_Unidade_Saude SET ${updates.join(', ')} WHERE id = ?`;
        await connection.query(sql, values);
        console.log(`   ✅ Unidade nova [${dup.nova_id}] atualizada\n`);
      } else {
        console.log(`   ℹ️  Nenhum dado novo para copiar\n`);
      }
      
      // 4. Transferir vínculos de profissionais
      console.log(`   🔗 Transferindo vínculos de profissionais...`);
      
      // Contar vínculos da antiga
      const [vinculosAntiga] = await connection.query(`
        SELECT COUNT(*) as total
        FROM Junction_Unidade_Medico
        WHERE id_unidade = ?
      `, [dup.antiga_id]);
      
      console.log(`      Vínculos na antiga: ${vinculosAntiga[0].total}`);
      
      if (vinculosAntiga[0].total > 0) {
        // Transferir vínculos que ainda não existem na nova
        const [resultTransferencia] = await connection.query(`
          INSERT INTO Junction_Unidade_Medico (id_unidade, id_medico, created_at)
          SELECT ?, id_medico, created_at
          FROM Junction_Unidade_Medico
          WHERE id_unidade = ?
            AND id_medico NOT IN (
              SELECT id_medico 
              FROM Junction_Unidade_Medico 
              WHERE id_unidade = ?
            )
        `, [dup.nova_id, dup.antiga_id, dup.nova_id]);
        
        console.log(`      ✅ ${resultTransferencia.affectedRows} vínculos transferidos para nova`);
        totalVinculosTransferidos += resultTransferencia.affectedRows;
        
        // Deletar vínculos da antiga
        await connection.query(`
          DELETE FROM Junction_Unidade_Medico
          WHERE id_unidade = ?
        `, [dup.antiga_id]);
        
        console.log(`      ✅ Vínculos removidos da antiga`);
      }
      
      // 5. Desativar unidade antiga
      await connection.query(`
        UPDATE PROD_Unidade_Saude
        SET ativo = FALSE, updated_at = NOW()
        WHERE id = ?
      `, [dup.antiga_id]);
      
      console.log(`      ✅ Unidade antiga [${dup.antiga_id}] desativada\n`);
      
      totalMesclados++;
    }
    
    // Validações finais
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log('📊 VALIDAÇÕES FINAIS\n');
    
    const [unidadesAtivas] = await connection.query(`
      SELECT COUNT(*) as total
      FROM PROD_Unidade_Saude
      WHERE ativo = TRUE
    `);
    console.log(`✅ Unidades ativas: ${unidadesAtivas[0].total}`);
    
    const [unidadesInativas] = await connection.query(`
      SELECT COUNT(*) as total
      FROM PROD_Unidade_Saude
      WHERE ativo = FALSE
    `);
    console.log(`⚠️  Unidades inativas: ${unidadesInativas[0].total}`);
    
    const [comCoordPadrao] = await connection.query(`
      SELECT COUNT(*) as total
      FROM PROD_Unidade_Saude
      WHERE latitude = -19.0078 AND longitude = -57.6547 AND ativo = TRUE
    `);
    console.log(`⚠️  Unidades ativas com coordenadas padrão: ${comCoordPadrao[0].total}`);
    
    const [totalVinculos] = await connection.query(`
      SELECT COUNT(*) as total
      FROM Junction_Unidade_Medico j
      INNER JOIN PROD_Unidade_Saude u ON u.id = j.id_unidade
      WHERE u.ativo = TRUE
    `);
    console.log(`🔗 Vínculos em unidades ativas: ${totalVinculos[0].total}`);
    
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log('✅ RESUMO DA MESCLAGEM\n');
    console.log(`📋 ${totalMesclados} unidades mescladas com sucesso`);
    console.log(`🔗 ${totalVinculosTransferidos} vínculos transferidos`);
    console.log(`⚠️  ${duplicacoes.length - totalMesclados} unidades não processadas (se houver)\n`);
    
    // Aguardar confirmação
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('Deseja fazer COMMIT das alterações? (s/n): ', async (answer) => {
      if (answer.toLowerCase() === 's') {
        await connection.query('COMMIT');
        console.log('\n✅ COMMIT realizado com sucesso!\n');
        console.log('As unidades antigas foram desativadas e seus dados foram');
        console.log('mesclados nas unidades novas com CNES oficial.\n');
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
    console.error('\n❌ Erro durante mesclagem:', error.message);
    console.error('\n🔄 Executando ROLLBACK...');
    await connection.query('ROLLBACK');
    console.error('✅ Rollback concluído. Nenhuma alteração foi feita.\n');
    await connection.end();
    process.exit(1);
  }
}

mesclarUnidadesDuplicadas().catch(console.error);
