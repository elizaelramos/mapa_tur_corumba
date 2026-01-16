const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { buildDatabaseUrl } = require('../packages/database/build-database-url');

async function analisarDuplicacoes() {
  console.log('\n=== Análise de Duplicações no Banco de Dados ===\n');
  
  const mysql = require('mysql2/promise');
  const connection = await mysql.createConnection(buildDatabaseUrl());
  
  try {
    // 1. Buscar unidades com nomes similares
    console.log('🔍 ANÁLISE 1: Buscar nomes similares\n');
    
    const [todasUnidades] = await connection.query(`
      SELECT id, nome, id_origem, endereco, latitude, longitude, telefone, whatsapp, created_at
      FROM PROD_Unidade_Saude
      ORDER BY nome
    `);
    
    console.log(`📊 Total de unidades no banco: ${todasUnidades.length}\n`);
    
    // 2. Identificar padrões de duplicação
    console.log('🔍 ANÁLISE 2: Identificar possíveis duplicações por nome\n');
    
    const nomeMap = new Map();
    
    for (const unidade of todasUnidades) {
      // Normalizar nome: remover UBS, remover acentos, uppercase
      let nomeNormalizado = unidade.nome
        .toUpperCase()
        .replace(/UBS\s*/g, '')
        .replace(/UNIDADE\s*BASICA\s*DE\s*SAUDE\s*/g, '')
        .replace(/UNIDADE\s*BÁSICA\s*DE\s*SAÚDE\s*/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (!nomeMap.has(nomeNormalizado)) {
        nomeMap.set(nomeNormalizado, []);
      }
      nomeMap.get(nomeNormalizado).push(unidade);
    }
    
    // Encontrar duplicações
    let duplicacoesEncontradas = 0;
    const grupos = [];
    
    for (const [nomeNorm, unidades] of nomeMap.entries()) {
      if (unidades.length > 1) {
        duplicacoesEncontradas++;
        grupos.push({ nomeNorm, unidades });
      }
    }
    
    console.log(`⚠️  Encontrados ${duplicacoesEncontradas} grupos de possíveis duplicações:\n`);
    
    for (const grupo of grupos) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Grupo: "${grupo.nomeNorm}" (${grupo.unidades.length} registros)`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
      
      for (const unidade of grupo.unidades) {
        const idOrigem = unidade.id_origem || 'N/A';
        const isCnes = idOrigem.match(/^\d{7}$/);
        const tipo = isCnes ? '🆕 CNES' : '📍 Antiga';
        const coords = `${unidade.latitude}, ${unidade.longitude}`;
        const tel = unidade.telefone || 'N/A';
        const wpp = unidade.whatsapp || 'N/A';
        const endereco = (unidade.endereco || 'N/A').substring(0, 50);
        
        console.log(`${tipo} [ID: ${unidade.id}]`);
        console.log(`   Nome completo: ${unidade.nome}`);
        console.log(`   id_origem: ${idOrigem}`);
        console.log(`   Coordenadas: ${coords}`);
        console.log(`   Endereço: ${endereco}...`);
        console.log(`   Telefone: ${tel}`);
        console.log(`   WhatsApp: ${wpp}`);
        console.log(`   Criado em: ${unidade.created_at.toISOString().split('T')[0]}`);
        console.log('');
      }
    }
    
    // 3. Análise específica: UBS antigas vs novas
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 ANÁLISE 3: Unidades antigas (sem CNES numérico) vs novas (CNES)\n');
    
    const [antigas] = await connection.query(`
      SELECT COUNT(*) as total
      FROM PROD_Unidade_Saude
      WHERE id_origem NOT REGEXP '^[0-9]{7}$'
    `);
    
    const [novas] = await connection.query(`
      SELECT COUNT(*) as total
      FROM PROD_Unidade_Saude
      WHERE id_origem REGEXP '^[0-9]{7}$'
    `);
    
    console.log(`📍 Unidades antigas (id_origem não-numérico): ${antigas[0].total}`);
    console.log(`🆕 Unidades novas CNES (id_origem numérico): ${novas[0].total}\n`);
    
    // 4. Buscar unidades com coordenadas padrão
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 ANÁLISE 4: Unidades com coordenadas padrão (precisam geocoding)\n');
    
    const defaultLat = -19.0078;
    const defaultLng = -57.6547;
    
    const [comCoordPadrao] = await connection.query(`
      SELECT id, nome, id_origem, endereco
      FROM PROD_Unidade_Saude
      WHERE latitude = ? AND longitude = ?
      LIMIT 10
    `, [defaultLat, defaultLng]);
    
    console.log(`⚠️  ${comCoordPadrao.length} unidades com coordenadas padrão (mostrando 10):\n`);
    
    comCoordPadrao.forEach(u => {
      const isCnes = u.id_origem.match(/^\d{7}$/);
      const tipo = isCnes ? '🆕' : '📍';
      console.log(`${tipo} [${u.id}] ${u.nome.substring(0, 50)}...`);
      console.log(`   CNES: ${u.id_origem} | Endereço: ${(u.endereco || 'N/A').substring(0, 50)}...\n`);
    });
    
    // 5. Análise de vínculos
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 ANÁLISE 5: Distribuição de profissionais por tipo de unidade\n');
    
    const [vinculosAntigas] = await connection.query(`
      SELECT COUNT(DISTINCT j.id_medico) as total_profissionais
      FROM Junction_Unidade_Medico j
      INNER JOIN PROD_Unidade_Saude u ON u.id = j.id_unidade
      WHERE u.id_origem NOT REGEXP '^[0-9]{7}$'
    `);
    
    const [vinculosNovas] = await connection.query(`
      SELECT COUNT(DISTINCT j.id_medico) as total_profissionais
      FROM Junction_Unidade_Medico j
      INNER JOIN PROD_Unidade_Saude u ON u.id = j.id_unidade
      WHERE u.id_origem REGEXP '^[0-9]{7}$'
    `);
    
    console.log(`📍 Profissionais vinculados a unidades antigas: ${vinculosAntigas[0].total_profissionais}`);
    console.log(`🆕 Profissionais vinculados a unidades novas (CNES): ${vinculosNovas[0].total_profissionais}\n`);
    
    // 6. Recomendações
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 RECOMENDAÇÕES\n');
    
    if (duplicacoesEncontradas > 0) {
      console.log(`⚠️  Encontradas ${duplicacoesEncontradas} possíveis duplicações`);
      console.log('   Ações sugeridas:');
      console.log('   1. Revisar cada grupo de duplicação manualmente');
      console.log('   2. Para registros duplicados:');
      console.log('      a) Transferir vínculos da unidade antiga para a nova');
      console.log('      b) Atualizar coordenadas da nova com as da antiga (se melhor)');
      console.log('      c) Mesclar informações complementares (telefone, whatsapp)');
      console.log('      d) Marcar antiga como inativa ou deletar\n');
    }
    
    if (comCoordPadrao.length > 0) {
      console.log(`⚠️  ${comCoordPadrao.length} unidades precisam de geocoding`);
      console.log('   Ações sugeridas:');
      console.log('   1. Usar API de geocoding (Nominatim, Google Maps)');
      console.log('   2. Ou copiar coordenadas de unidades antigas equivalentes\n');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } finally {
    await connection.end();
  }
}

analisarDuplicacoes().catch(console.error);
