#!/usr/bin/env node

/**
 * Script para corrigir coordenadas inválidas no banco de dados
 * Busca coordenadas corretas na planilha e atualiza o banco
 */

const XLSX = require('xlsx');
const path = require('path');
const mysql = require('mysql2/promise');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const PLANILHA_PATH = path.join(__dirname, '..', 'Mapas_Tur_2026_01_20_Versão2.xlsx');

// Função para normalizar coordenadas (dividir por potência de 10 adequada)
function normalizarCoordenada(valor) {
  if (!valor || valor === 0) return null;

  const absValor = Math.abs(valor);

  // Se o valor for muito grande, encontrar a potência correta
  if (absValor > 1000) {
    // Determinar quantos dígitos temos
    const digitos = Math.floor(Math.log10(absValor)) + 1;

    // Para Corumbá, esperamos valores como -19.00 (latitude) e -57.65 (longitude)
    // Isso significa que devemos ter 2 dígitos antes do ponto decimal
    // Se tivermos mais, dividimos pela potência necessária

    if (digitos > 2) {
      const potencia = digitos - 2;
      return valor / Math.pow(10, potencia);
    }
  }

  return valor;
}

async function corrigirCoordenadas() {
  console.log('============================================================');
  console.log('🔧 CORREÇÃO DE COORDENADAS - Mapa Turismo');
  console.log('============================================================\n');

  let connection;

  try {
    // Conectar ao banco
    console.log('🔌 Conectando ao banco de dados...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    console.log('   ✓ Conectado com sucesso\n');

    // Ler planilha
    console.log('📖 Lendo planilha:', PLANILHA_PATH);
    const workbook = XLSX.readFile(PLANILHA_PATH);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

    console.log(`   ✓ ${rows.length} registros encontrados na planilha\n`);

    // Buscar unidades com coordenadas problemáticas
    console.log('🔍 Buscando unidades com coordenadas problemáticas...');
    const [unidadesProblematicas] = await connection.execute(`
      SELECT id, nome, latitude, longitude
      FROM prod_unidade_turistica
      WHERE
        (latitude = 0 AND longitude = 0)
        OR latitude < -25 OR latitude > -10
        OR longitude < -65 OR longitude > -50
        OR latitude IS NULL OR longitude IS NULL
    `);

    console.log(`   ✓ ${unidadesProblematicas.length} unidades encontradas\n`);

    const estatisticas = {
      processadas: 0,
      corrigidas: 0,
      naoEncontradas: [],
      erros: []
    };

    console.log('📝 Corrigindo coordenadas...\n');

    for (const unidade of unidadesProblematicas) {
      estatisticas.processadas++;

      try {
        // Buscar na planilha
        const rowPlanilha = rows.find(r => {
          const nome = r['Nome'] || r['NOME FANTASIA'];
          return nome && nome.trim() === unidade.nome.trim();
        });

        if (!rowPlanilha) {
          console.log(`⚠️  Não encontrado na planilha: "${unidade.nome}"`);
          estatisticas.naoEncontradas.push(unidade.nome);
          continue;
        }

        // Extrair e normalizar coordenadas
        const latPlanilha = rowPlanilha['LATITUDE'];
        const lngPlanilha = rowPlanilha['LONGITUDE'];

        if (!latPlanilha || !lngPlanilha) {
          console.log(`⚠️  Sem coordenadas na planilha: "${unidade.nome}"`);
          continue;
        }

        const latCorrigida = normalizarCoordenada(latPlanilha);
        const lngCorrigida = normalizarCoordenada(lngPlanilha);

        if (!latCorrigida || !lngCorrigida) {
          console.log(`⚠️  Coordenadas inválidas na planilha: "${unidade.nome}"`);
          continue;
        }

        // Verificar se está no range esperado para Corumbá
        if (latCorrigida < -25 || latCorrigida > -10 || lngCorrigida < -65 || lngCorrigida > -50) {
          console.log(`⚠️  Coordenadas fora do range esperado: "${unidade.nome}"`);
          console.log(`   Lat: ${latCorrigida}, Lng: ${lngCorrigida}`);
          continue;
        }

        // Atualizar no banco
        await connection.execute(
          'UPDATE prod_unidade_turistica SET latitude = ?, longitude = ?, updated_at = NOW() WHERE id = ?',
          [latCorrigida, lngCorrigida, unidade.id]
        );

        console.log(`✅ Corrigido: "${unidade.nome}" (ID: ${unidade.id})`);
        console.log(`   Antes: Lat ${unidade.latitude}, Lng ${unidade.longitude}`);
        console.log(`   Depois: Lat ${latCorrigida}, Lng ${lngCorrigida}`);

        estatisticas.corrigidas++;

      } catch (error) {
        console.error(`❌ Erro ao processar "${unidade.nome}":`, error.message);
        estatisticas.erros.push({ nome: unidade.nome, erro: error.message });
      }
    }

    // Relatório final
    console.log('\n============================================================');
    console.log('📈 RELATÓRIO FINAL');
    console.log('============================================================');
    console.log(`Total processadas:    ${estatisticas.processadas}`);
    console.log(`Corrigidas:           ${estatisticas.corrigidas}`);
    console.log(`Não encontradas:      ${estatisticas.naoEncontradas.length}`);
    console.log(`Erros:                ${estatisticas.erros.length}`);

    if (estatisticas.naoEncontradas.length > 0) {
      console.log('\n⚠️  Unidades não encontradas na planilha:');
      estatisticas.naoEncontradas.forEach(nome => {
        console.log(`   • ${nome}`);
      });
    }

    if (estatisticas.erros.length > 0) {
      console.log('\n❌ Erros encontrados:');
      estatisticas.erros.forEach(({ nome, erro }) => {
        console.log(`   • ${nome}: ${erro}`);
      });
    }

    console.log('\n✅ Correção concluída com sucesso!');

  } catch (error) {
    console.error('\n❌ Erro fatal:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão com banco de dados fechada');
    }
  }
}

// Executar
corrigirCoordenadas()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
