#!/usr/bin/env node

/**
 * Script para atualizar dados do banco a partir de planilha Excel
 * Atualiza apenas os campos que foram modificados
 */

const XLSX = require('xlsx');
const path = require('path');
const mysql = require('mysql2/promise');

// Carregar variáveis de ambiente
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Arquivo da planilha
const PLANILHA_PATH = path.join(__dirname, '..', 'Mapas_Tur_2026_01_20_Versão2.xlsx');

// Função para normalizar coordenadas (dividir por 10^15)
function normalizarCoordenada(valor) {
  if (!valor || valor === 0) return null;

  // Se o valor for muito grande (mais de 15 dígitos), normalizar
  if (Math.abs(valor) > 1e14) {
    return valor / 1e15;
  }

  return valor;
}

// Função para comparar valores (considerando null, undefined, string vazia como iguais)
function valoresIguais(val1, val2) {
  // Normalizar valores vazios
  const v1 = (val1 === null || val1 === undefined || val1 === '') ? null : val1;
  const v2 = (val2 === null || val2 === undefined || val2 === '') ? null : val2;

  if (v1 === null && v2 === null) return true;
  if (v1 === null || v2 === null) return false;

  // Para números (incluindo coordenadas), comparar com tolerância
  if (typeof v1 === 'number' && typeof v2 === 'number') {
    return Math.abs(v1 - v2) < 0.000001;
  }

  // Para strings, normalizar e comparar
  return String(v1).trim() === String(v2).trim();
}

async function atualizarDados() {
  console.log('============================================================');
  console.log('📊 ATUALIZAÇÃO DE DADOS - Mapa Turismo');
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

    const estatisticas = {
      processados: 0,
      atualizados: 0,
      naoEncontrados: [],
      erros: [],
      mudancas: []
    };

    // Processar cada linha
    for (const row of rows) {
      const nomeNaPlanilha = row['Nome'] || row['NOME FANTASIA'];

      if (!nomeNaPlanilha) {
        console.log('⚠️  Linha sem nome, pulando...');
        continue;
      }

      estatisticas.processados++;

      try {
        // Buscar unidade no banco pelo nome
        const [unidades] = await connection.execute(
          'SELECT * FROM prod_unidade_turistica WHERE nome = ? LIMIT 1',
          [nomeNaPlanilha.trim()]
        );

        if (unidades.length === 0) {
          console.log(`❌ Não encontrado no banco: "${nomeNaPlanilha}"`);
          estatisticas.naoEncontrados.push(nomeNaPlanilha);
          continue;
        }

        const unidade = unidades[0];

        // Preparar dados da planilha
        const dadosPlanilha = {
          nome: row['Nome'] || row['NOME FANTASIA'],
          endereco: row['Endereço'] || row['ENDEREÇO'],
          telefone: row['Contato'] || row['TELEFONE'],
          latitude: normalizarCoordenada(row['LATITUDE']),
          longitude: normalizarCoordenada(row['LONGITUDE']),
        };

        // Comparar e preparar update
        const updates = {};
        const mudancas = [];
        const updateFields = [];
        const updateValues = [];

        // Verificar cada campo
        if (!valoresIguais(dadosPlanilha.nome, unidade.nome)) {
          updates.nome = dadosPlanilha.nome;
          mudancas.push(`Nome: "${unidade.nome}" → "${dadosPlanilha.nome}"`);
          updateFields.push('nome = ?');
          updateValues.push(dadosPlanilha.nome);
        }

        if (!valoresIguais(dadosPlanilha.endereco, unidade.endereco)) {
          updates.endereco = dadosPlanilha.endereco;
          mudancas.push(`Endereço: "${unidade.endereco}" → "${dadosPlanilha.endereco}"`);
          updateFields.push('endereco = ?');
          updateValues.push(dadosPlanilha.endereco);
        }

        if (!valoresIguais(dadosPlanilha.telefone, unidade.telefone)) {
          updates.telefone = dadosPlanilha.telefone;
          mudancas.push(`Telefone: "${unidade.telefone}" → "${dadosPlanilha.telefone}"`);
          updateFields.push('telefone = ?');
          updateValues.push(dadosPlanilha.telefone);
        }

        if (dadosPlanilha.latitude && !valoresIguais(dadosPlanilha.latitude, unidade.latitude)) {
          updates.latitude = dadosPlanilha.latitude;
          mudancas.push(`Latitude: ${unidade.latitude} → ${dadosPlanilha.latitude}`);
          updateFields.push('latitude = ?');
          updateValues.push(dadosPlanilha.latitude);
        }

        if (dadosPlanilha.longitude && !valoresIguais(dadosPlanilha.longitude, unidade.longitude)) {
          updates.longitude = dadosPlanilha.longitude;
          mudancas.push(`Longitude: ${unidade.longitude} → ${dadosPlanilha.longitude}`);
          updateFields.push('longitude = ?');
          updateValues.push(dadosPlanilha.longitude);
        }

        // Se houver mudanças, atualizar
        if (updateFields.length > 0) {
          // Adicionar updated_at
          updateFields.push('updated_at = NOW()');
          updateValues.push(unidade.id);

          const query = `UPDATE prod_unidade_turistica SET ${updateFields.join(', ')} WHERE id = ?`;

          await connection.execute(query, updateValues);

          console.log(`✅ Atualizado: "${unidade.nome}" (ID: ${unidade.id})`);
          mudancas.forEach(m => console.log(`   • ${m}`));

          estatisticas.atualizados++;
          estatisticas.mudancas.push({
            unidade: unidade.nome,
            id: unidade.id,
            mudancas: mudancas
          });
        } else {
          console.log(`✓ Sem mudanças: "${unidade.nome}"`);
        }

      } catch (error) {
        console.error(`❌ Erro ao processar "${nomeNaPlanilha}":`, error.message);
        estatisticas.erros.push({ nome: nomeNaPlanilha, erro: error.message });
      }
    }

    // Relatório final
    console.log('\n============================================================');
    console.log('📈 RELATÓRIO FINAL');
    console.log('============================================================');
    console.log(`Total processados:    ${estatisticas.processados}`);
    console.log(`Atualizados:          ${estatisticas.atualizados}`);
    console.log(`Não encontrados:      ${estatisticas.naoEncontrados.length}`);
    console.log(`Erros:                ${estatisticas.erros.length}`);

    if (estatisticas.naoEncontrados.length > 0) {
      console.log('\n⚠️  Unidades não encontradas no banco:');
      estatisticas.naoEncontrados.slice(0, 20).forEach(nome => {
        console.log(`   • ${nome}`);
      });
      if (estatisticas.naoEncontrados.length > 20) {
        console.log(`   ... e mais ${estatisticas.naoEncontrados.length - 20} unidades`);
      }
    }

    if (estatisticas.erros.length > 0) {
      console.log('\n❌ Erros encontrados:');
      estatisticas.erros.slice(0, 10).forEach(({ nome, erro }) => {
        console.log(`   • ${nome}: ${erro}`);
      });
      if (estatisticas.erros.length > 10) {
        console.log(`   ... e mais ${estatisticas.erros.length - 10} erros`);
      }
    }

    // Salvar relatório em arquivo
    const fs = require('fs');
    const relatorioPath = path.join(__dirname, '..', `update-report-${Date.now()}.json`);
    fs.writeFileSync(relatorioPath, JSON.stringify(estatisticas, null, 2));
    console.log(`\n💾 Relatório detalhado salvo em: ${relatorioPath}`);

    console.log('\n✅ Atualização concluída com sucesso!');

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
atualizarDados()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
