/**
 * Script para mesclar unidades duplicadas (Batch 8):
 * - UBS Dr Walter Victorio (ID 11) → Unidade Básica de Saúde Dr. Walter Victorio (ID 67)
 * - Centro de Saúde da Ladeira Dr Moyses dos Reis Amaral (ID 8) → Centro de Saúde Dr. Moyses dos Reis Amaral (ID 37)
 * 
 * Estratégia:
 * - Manter dados CNES da unidade NOVA
 * - Copiar latitude/longitude da unidade ANTIGA se melhor que as coordenadas padrão
 * - Copiar telefone, whatsapp, imagem_url, icone_url da ANTIGA (se existirem)
 * - Remover todos os vínculos (Junction_Unidade_Medico) da unidade ANTIGA
 * - Recalcular especialidades da unidade NOVA baseado nos médicos
 * - Desativar unidade ANTIGA (ativo = FALSE)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { buildDatabaseUrl } = require('../packages/database/build-database-url');
const mysql = require('mysql2/promise');
const readline = require('readline');

// Pares de unidades duplicadas: [ID_ANTIGA, ID_NOVA_CNES]
const DUPLICATES = [
  { old_id: 11, new_id: 67, nome: 'UBS DR WALTER VICTORIO' },
  { old_id: 8, new_id: 37, nome: 'CENTRO DE SAUDE DA LADEIRA DR MOYSES DOS REIS AMARAL' },
];

// Coordenadas padrão (para detectar se precisam ser atualizadas)
const DEFAULT_LAT = -19.00780000;
const DEFAULT_LNG = -57.65470000;

async function main() {
  const databaseUrl = buildDatabaseUrl();
  const connection = await mysql.createConnection(databaseUrl);
  
  try {
    console.log('='.repeat(80));
    console.log('MESCLAGEM DE UNIDADES DUPLICADAS - BATCH 8');
    console.log('='.repeat(80));
    console.log();

    // Verificar argumento --confirm
    const autoConfirm = process.argv.includes('--confirm');

    for (const duplicate of DUPLICATES) {
      const { old_id, new_id, nome } = duplicate;

      console.log(`\n${'─'.repeat(80)}`);
      console.log(`📋 PROCESSANDO: ${nome}`);
      console.log(`   ANTIGA (ID ${old_id}) → NOVA (ID ${new_id})`);
      console.log('─'.repeat(80));
      console.log();

      // 1. Buscar dados das duas unidades
      console.log('📊 BUSCANDO DADOS DAS UNIDADES...\n');

      const [unidadeAntigaRows] = await connection.execute(`
        SELECT 
          u.*,
          COUNT(DISTINCT jum.id_medico) as qtd_medicos,
          COUNT(DISTINCT jue.id_especialidade) as qtd_especialidades
        FROM PROD_Unidade_Saude u
        LEFT JOIN Junction_Unidade_Medico jum ON u.id = jum.id_unidade
        LEFT JOIN Junction_Unidade_Especialidade jue ON u.id = jue.id_unidade
        WHERE u.id = ?
        GROUP BY u.id
      `, [old_id]);

      const [unidadeNovaRows] = await connection.execute(`
        SELECT 
          u.*,
          COUNT(DISTINCT jum.id_medico) as qtd_medicos,
          COUNT(DISTINCT jue.id_especialidade) as qtd_especialidades
        FROM PROD_Unidade_Saude u
        LEFT JOIN Junction_Unidade_Medico jum ON u.id = jum.id_unidade
        LEFT JOIN Junction_Unidade_Especialidade jue ON u.id = jue.id_unidade
        WHERE u.id = ?
        GROUP BY u.id
      `, [new_id]);

      if (unidadeAntigaRows.length === 0) {
        console.error(`❌ Unidade ANTIGA (ID ${old_id}) não encontrada! Pulando...\n`);
        continue;
      }

      if (unidadeNovaRows.length === 0) {
        console.error(`❌ Unidade NOVA (ID ${new_id}) não encontrada! Pulando...\n`);
        continue;
      }

      const unidadeAntiga = unidadeAntigaRows[0];
      const unidadeNova = unidadeNovaRows[0];

      // Exibir informações
      console.log('🏥 UNIDADE ANTIGA (será desativada):');
      console.log(`   ID: ${unidadeAntiga.id}`);
      console.log(`   Nome: ${unidadeAntiga.nome}`);
      console.log(`   Endereço: ${unidadeAntiga.endereco || 'N/A'}`);
      console.log(`   Coordenadas: ${unidadeAntiga.latitude}, ${unidadeAntiga.longitude}`);
      console.log(`   Telefone: ${unidadeAntiga.telefone || 'N/A'}`);
      console.log(`   WhatsApp: ${unidadeAntiga.whatsapp || 'N/A'}`);
      console.log(`   Imagem: ${unidadeAntiga.imagem_url || 'N/A'}`);
      console.log(`   Ícone: ${unidadeAntiga.icone_url || 'N/A'}`);
      console.log(`   Médicos: ${unidadeAntiga.qtd_medicos}`);
      console.log(`   Especialidades: ${unidadeAntiga.qtd_especialidades}`);
      console.log();

      console.log('🏥 UNIDADE NOVA (será mantida com dados CNES):');
      console.log(`   ID: ${unidadeNova.id}`);
      console.log(`   Nome: ${unidadeNova.nome}`);
      console.log(`   Endereço: ${unidadeNova.endereco || 'N/A'}`);
      console.log(`   Coordenadas: ${unidadeNova.latitude}, ${unidadeNova.longitude}`);
      console.log(`   Telefone: ${unidadeNova.telefone || 'N/A'}`);
      console.log(`   WhatsApp: ${unidadeNova.whatsapp || 'N/A'}`);
      console.log(`   Imagem: ${unidadeNova.imagem_url || 'N/A'}`);
      console.log(`   Ícone: ${unidadeNova.icone_url || 'N/A'}`);
      console.log(`   Médicos: ${unidadeNova.qtd_medicos}`);
      console.log(`   Especialidades: ${unidadeNova.qtd_especialidades}`);
      console.log();

      // Verificar se o telefone da unidade nova parece ser um endereço
      const telefoneParecemEndereco = (tel) => {
        if (!tel) return false;
        const upper = tel.toUpperCase();
        return upper.includes('RUA') || 
               upper.includes('AVENIDA') || 
               upper.includes('COLOMBO') ||
               upper.includes('CENTRO') ||
               upper.includes('LADEIRA') ||
               tel.length > 30;
      };

      const telefoneNovaInvalido = telefoneParecemEndereco(unidadeNova.telefone);

      // 2. Mostrar operações
      console.log('📋 OPERAÇÕES QUE SERÃO REALIZADAS:');
      console.log('   ✓ Copiar latitude/longitude da ANTIGA para NOVA');
      if (telefoneNovaInvalido || !unidadeNova.telefone) {
        console.log('   ✓ Copiar telefone da ANTIGA (telefone atual é inválido ou vazio)');
      }
      console.log('   ✓ Copiar whatsapp, imagem_url, icone_url da ANTIGA (se existirem)');
      console.log(`   ✓ Remover vínculos de médicos da ANTIGA (${unidadeAntiga.qtd_medicos} médicos)`);
      console.log('   ✓ Recalcular especialidades da NOVA baseado nos médicos');
      console.log('   ✓ Desativar unidade ANTIGA');
      console.log();

      if (!autoConfirm) {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const resposta = await new Promise((resolve) => {
          rl.question(`❓ Confirmar mesclagem de "${nome}"? (s/n): `, resolve);
        });
        rl.close();

        if (resposta.toLowerCase() !== 's') {
          console.log('\n❌ Operação cancelada pelo usuário. Pulando esta unidade...\n');
          continue;
        }
      }

      console.log('⚙️  INICIANDO MESCLAGEM...\n');

      // 3. Iniciar transação
      await connection.beginTransaction();

      try {
        // 4. Atualizar unidade NOVA com dados da ANTIGA
        console.log('📝 Atualizando dados da unidade NOVA...');
        
        // Construir SET dinamicamente
        const updates = [];
        const params = [];

        // Sempre copiar coordenadas (melhor que as padrão)
        updates.push('latitude = ?', 'longitude = ?');
        params.push(unidadeAntiga.latitude, unidadeAntiga.longitude);

        // Copiar telefone se o atual é inválido ou vazio
        if (telefoneNovaInvalido || !unidadeNova.telefone) {
          if (unidadeAntiga.telefone) {
            updates.push('telefone = ?');
            params.push(unidadeAntiga.telefone);
          }
        }

        // Usar COALESCE para whatsapp, imagem_url, icone_url
        updates.push('whatsapp = COALESCE(whatsapp, ?)');
        params.push(unidadeAntiga.whatsapp);

        updates.push('imagem_url = COALESCE(imagem_url, ?)');
        params.push(unidadeAntiga.imagem_url);

        updates.push('icone_url = COALESCE(icone_url, ?)');
        params.push(unidadeAntiga.icone_url);

        params.push(new_id);

        const updateSQL = `
          UPDATE PROD_Unidade_Saude 
          SET ${updates.join(', ')}
          WHERE id = ?
        `;

        await connection.execute(updateSQL, params);
        console.log('   ✓ Dados copiados da ANTIGA para NOVA');

        // 5. Remover vínculos da unidade ANTIGA
        console.log('📝 Removendo vínculos da unidade ANTIGA...');
        
        const [deleteResult] = await connection.execute(
          'DELETE FROM Junction_Unidade_Medico WHERE id_unidade = ?',
          [old_id]
        );
        console.log(`   ✓ ${deleteResult.affectedRows} vínculos removidos`);

        // 6. Recalcular especialidades da unidade NOVA
        console.log('📝 Recalculando especialidades da unidade NOVA...');
        
        // Remover especialidades antigas
        await connection.execute(
          'DELETE FROM Junction_Unidade_Especialidade WHERE id_unidade = ?',
          [new_id]
        );

        // Inserir novas especialidades baseadas nos médicos
        const [insertResult] = await connection.execute(`
          INSERT INTO Junction_Unidade_Especialidade (id_unidade, id_especialidade)
          SELECT DISTINCT ?, jme.id_especialidade
          FROM Junction_Unidade_Medico jum
          JOIN Junction_Medico_Especialidade jme ON jum.id_medico = jme.id_medico
          WHERE jum.id_unidade = ?
        `, [new_id, new_id]);
        
        console.log(`   ✓ ${insertResult.affectedRows} especialidades recalculadas`);

        // 7. Desativar unidade ANTIGA
        console.log('📝 Desativando unidade ANTIGA...');
        await connection.execute(
          'UPDATE PROD_Unidade_Saude SET ativo = FALSE WHERE id = ?',
          [old_id]
        );
        console.log('   ✓ Unidade ANTIGA desativada');

        // 8. Commit
        await connection.commit();
        console.log();
        console.log(`✅ MESCLAGEM DE "${nome}" CONCLUÍDA COM SUCESSO!`);
        console.log();

        // 9. Validação final
        console.log('🔍 VALIDAÇÃO FINAL:\n');

        const [antigaFinal] = await connection.execute(`
          SELECT 
            u.id, u.nome, u.ativo,
            COUNT(DISTINCT jum.id_medico) as qtd_medicos,
            COUNT(DISTINCT jue.id_especialidade) as qtd_especialidades
          FROM PROD_Unidade_Saude u
          LEFT JOIN Junction_Unidade_Medico jum ON u.id = jum.id_unidade
          LEFT JOIN Junction_Unidade_Especialidade jue ON u.id = jue.id_unidade
          WHERE u.id = ?
          GROUP BY u.id
        `, [old_id]);

        const [novaFinal] = await connection.execute(`
          SELECT 
            u.id, u.nome, u.ativo,
            COUNT(DISTINCT jum.id_medico) as qtd_medicos,
            COUNT(DISTINCT jue.id_especialidade) as qtd_especialidades
          FROM PROD_Unidade_Saude u
          LEFT JOIN Junction_Unidade_Medico jum ON u.id = jum.id_unidade
          LEFT JOIN Junction_Unidade_Especialidade jue ON u.id = jue.id_unidade
          WHERE u.id = ?
          GROUP BY u.id
        `, [new_id]);

        console.log(`ANTIGA (ID ${old_id}):`);
        console.log(`   Ativo: ${antigaFinal[0].ativo ? 'SIM' : 'NÃO'}`);
        console.log(`   Médicos: ${antigaFinal[0].qtd_medicos}`);
        console.log(`   Especialidades: ${antigaFinal[0].qtd_especialidades}`);
        console.log();

        console.log(`NOVA (ID ${new_id}):`);
        console.log(`   Ativo: ${novaFinal[0].ativo ? 'SIM' : 'NÃO'}`);
        console.log(`   Médicos: ${novaFinal[0].qtd_medicos}`);
        console.log(`   Especialidades: ${novaFinal[0].qtd_especialidades}`);
        console.log();

      } catch (error) {
        await connection.rollback();
        console.error(`\n❌ ERRO ao mesclar "${nome}":`, error.message);
        console.log('Rollback realizado. Continuando para próxima unidade...\n');
      }
    }

    console.log('='.repeat(80));
    console.log('✅ PROCESSAMENTO COMPLETO!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ ERRO GERAL:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main();
