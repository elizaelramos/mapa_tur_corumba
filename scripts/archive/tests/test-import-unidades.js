const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { buildDatabaseUrl } = require('../packages/database/build-database-url');

async function importUnidades() {
  console.log('\n=== Import de Unidades CNES ===\n');
  
  const mysql = require('mysql2/promise');
  const connection = await mysql.createConnection(buildDatabaseUrl());
  
  try {
    // Iniciar transação
    await connection.query('START TRANSACTION');
    console.log('✅ Transação iniciada\n');
    
    // Criar tabela temporária
    console.log('📋 Criando tabela temporária...');
    await connection.query(`
      CREATE TEMPORARY TABLE unidades_import_tmp (
        cnes VARCHAR(10),
        nome VARCHAR(255),
        endereco VARCHAR(500),
        telefone VARCHAR(100),
        whatsapp VARCHAR(100),
        detail_url VARCHAR(500)
      )
    `);
    console.log('✅ Tabela temporária criada\n');
    
    // Carregar CSV via Node.js
    console.log('📂 Carregando CSV via Node.js...');
    const csvPath = path.join(__dirname, '../uploads/processed/unidades_cnes_final.csv');
    const csv = fs.readFileSync(csvPath, 'utf8');
    const lines = csv.split('\n').slice(1); // Pula header
    
    let loaded = 0;
    for (const line of lines) {
      if (!line.trim()) continue;
      
      // Parser simples para CSV com campos possivelmente entre aspas
      const fields = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          fields.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      fields.push(current.trim()); // Último campo
      
      if (fields.length >= 6) {
        const [cnes, nome, endereco, telefone, whatsapp, detail_url] = fields;
        await connection.query(
          'INSERT INTO unidades_import_tmp VALUES (?, ?, ?, ?, ?, ?)',
          [cnes, nome, endereco, telefone || null, whatsapp || null, detail_url]
        );
        loaded++;
      }
    }
    console.log(`✅ ${loaded} registros carregados\n`);
    
    // Validações
    console.log('=== VALIDAÇÕES PRÉ-IMPORT ===\n');
    
    const [total] = await connection.query('SELECT COUNT(*) as total FROM unidades_import_tmp');
    console.log(`📊 Total de unidades a importar: ${total[0].total}`);
    
    const [comEndereco] = await connection.query('SELECT COUNT(*) as total FROM unidades_import_tmp WHERE endereco IS NOT NULL AND endereco != ""');
    console.log(`📊 Unidades com endereço: ${comEndereco[0].total}`);
    
    const [comTelefone] = await connection.query('SELECT COUNT(*) as total FROM unidades_import_tmp WHERE telefone IS NOT NULL AND telefone != ""');
    console.log(`📊 Unidades com telefone: ${comTelefone[0].total}`);
    
    const [comWhatsapp] = await connection.query('SELECT COUNT(*) as total FROM unidades_import_tmp WHERE whatsapp IS NOT NULL AND whatsapp != ""');
    console.log(`📊 Unidades com WhatsApp: ${comWhatsapp[0].total}`);
    
    const [existentes] = await connection.query(`
      SELECT COUNT(*) as total
      FROM unidades_import_tmp i 
      WHERE EXISTS (SELECT 1 FROM PROD_Unidade_Saude u WHERE u.id_origem = i.cnes)
    `);
    console.log(`📊 Unidades que já existem: ${existentes[0].total}`);
    
    const [novas] = await connection.query(`
      SELECT COUNT(*) as total
      FROM unidades_import_tmp i 
      WHERE NOT EXISTS (SELECT 1 FROM PROD_Unidade_Saude u WHERE u.id_origem = i.cnes)
    `);
    console.log(`📊 Unidades novas a inserir: ${novas[0].total}\n`);
    
    // Amostra
    const [amostra] = await connection.query('SELECT cnes, LEFT(nome, 50) as nome, LEFT(endereco, 40) as endereco FROM unidades_import_tmp LIMIT 3');
    console.log('📋 Amostra de unidades:');
    amostra.forEach(u => console.log(`   - [${u.cnes}] ${u.nome}\n     ${u.endereco || 'Sem endereço'}`));
    
    console.log('\n=== EXECUTANDO UPSERT ===\n');
    
    // Coordenadas padrão de Corumbá (centro)
    const defaultLat = -19.0078;
    const defaultLng = -57.6547;
    
    // Atualizar unidades existentes
    console.log('🔄 Atualizando unidades existentes...');
    const [updateResult] = await connection.query(`
      UPDATE PROD_Unidade_Saude u
      INNER JOIN unidades_import_tmp tmp ON u.id_origem = tmp.cnes
      SET 
        u.endereco = CASE 
          WHEN u.endereco IS NULL OR u.endereco = '' THEN tmp.endereco 
          ELSE u.endereco 
        END,
        u.telefone = CASE 
          WHEN u.telefone IS NULL OR u.telefone = '' THEN tmp.telefone 
          ELSE u.telefone 
        END,
        u.whatsapp = CASE 
          WHEN u.whatsapp IS NULL OR u.whatsapp = '' THEN tmp.whatsapp 
          ELSE u.whatsapp 
        END,
        u.updated_at = NOW()
    `);
    console.log(`✅ ${updateResult.affectedRows} unidades atualizadas\n`);
    
    // Inserir novas unidades
    console.log('➕ Inserindo novas unidades...');
    console.log(`⚠️  NOTA: Usando coordenadas padrão (${defaultLat}, ${defaultLng}) - necessário geocoding posterior\n`);
    
    const [insertResult] = await connection.query(`
      INSERT INTO PROD_Unidade_Saude (
        nome, 
        id_origem, 
        endereco, 
        telefone, 
        whatsapp, 
        latitude, 
        longitude, 
        ativo, 
        created_at, 
        updated_at
      )
      SELECT 
        tmp.nome,
        tmp.cnes AS id_origem,
        tmp.endereco,
        tmp.telefone,
        tmp.whatsapp,
        ? AS latitude,
        ? AS longitude,
        TRUE AS ativo,
        NOW(),
        NOW()
      FROM unidades_import_tmp tmp
      WHERE NOT EXISTS (
        SELECT 1 FROM PROD_Unidade_Saude u WHERE u.id_origem = tmp.cnes
      )
    `, [defaultLat, defaultLng]);
    console.log(`✅ ${insertResult.affectedRows} novas unidades inseridas\n`);
    
    // Validações pós-import
    console.log('=== VALIDAÇÕES PÓS-IMPORT ===\n');
    
    const [totalUnidades] = await connection.query('SELECT COUNT(*) as total FROM PROD_Unidade_Saude');
    console.log(`📊 Total de unidades no banco: ${totalUnidades[0].total}`);
    
    const [comCnes] = await connection.query('SELECT COUNT(*) as total FROM PROD_Unidade_Saude WHERE id_origem IS NOT NULL');
    console.log(`📊 Unidades com CNES (id_origem): ${comCnes[0].total}`);
    
    const [unidadesImportadas] = await connection.query(`
      SELECT COUNT(*) as total
      FROM PROD_Unidade_Saude u
      WHERE u.id_origem IN (SELECT cnes FROM unidades_import_tmp)
    `);
    console.log(`📊 Unidades do CNES importadas: ${unidadesImportadas[0].total}\n`);
    
    // Verificar unidades com coordenadas padrão
    const [comCoordPadrao] = await connection.query(`
      SELECT COUNT(*) as total
      FROM PROD_Unidade_Saude
      WHERE latitude = ? AND longitude = ?
    `, [defaultLat, defaultLng]);
    console.log(`⚠️  Unidades com coordenadas padrão (precisam geocoding): ${comCoordPadrao[0].total}\n`);
    
    // Amostras das unidades importadas
    const [unidadesImport] = await connection.query(`
      SELECT u.id, u.nome, u.id_origem as cnes, u.endereco, u.telefone, u.whatsapp
      FROM PROD_Unidade_Saude u
      WHERE u.id_origem IN (SELECT cnes FROM unidades_import_tmp)
      ORDER BY u.id DESC
      LIMIT 5
    `);
    console.log('🏥 Últimas 5 unidades importadas:');
    unidadesImport.forEach((u, i) => {
      const tel = u.telefone || 'N/A';
      const wpp = u.whatsapp || 'N/A';
      console.log(`   ${i+1}. [${u.id}] ${u.nome.substring(0, 45)}...`);
      console.log(`      CNES: ${u.cnes} | Tel: ${tel} | WhatsApp: ${wpp}`);
    });
    
    console.log('\n=== RESUMO ===\n');
    console.log(`✅ ${insertResult.affectedRows} unidades novas inseridas`);
    console.log(`✅ ${updateResult.affectedRows} unidades existentes atualizadas`);
    console.log(`✅ ${unidadesImportadas[0].total} unidades CNES agora disponíveis no banco`);
    console.log(`⚠️  ${comCoordPadrao[0].total} unidades precisam de geocoding (lat/lng padrão)\n`);
    
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

importUnidades().catch(console.error);
