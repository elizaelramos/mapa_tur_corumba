#!/usr/bin/env node

/**
 * Script para atualizar dados do banco a partir de planilha Excel
 * Atualiza apenas os campos que foram modificados
 */

const XLSX = require('xlsx');
const path = require('path');

// Importar Prisma do package correto
const { PrismaClient } = require(path.join(__dirname, '..', 'node_modules', '@prisma', 'client'));

const prisma = new PrismaClient();

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

// Função para normalizar texto para comparação
function normalizarTexto(texto) {
  if (!texto) return '';
  return String(texto).trim().toLowerCase();
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

  try {
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
        const unidade = await prisma.unidade.findFirst({
          where: {
            OR: [
              { nome: { equals: nomeNaPlanilha.trim() } },
              { nome: { contains: nomeNaPlanilha.trim() } }
            ]
          }
        });

        if (!unidade) {
          console.log(`❌ Não encontrado no banco: "${nomeNaPlanilha}"`);
          estatisticas.naoEncontrados.push(nomeNaPlanilha);
          continue;
        }

        // Preparar dados da planilha
        const dadosPlanilha = {
          nome: row['Nome'] || row['NOME FANTASIA'],
          endereco: row['Endereço'] || row['ENDEREÇO'],
          bairro: row['Bairro'] || row['BAIRRO'],
          telefone: row['Contato'] || row['TELEFONE'],
          latitude: normalizarCoordenada(row['LATITUDE']),
          longitude: normalizarCoordenada(row['LONGITUDE']),
        };

        // Comparar e preparar update
        const updates = {};
        const mudancas = [];

        // Verificar cada campo
        if (!valoresIguais(dadosPlanilha.nome, unidade.nome)) {
          updates.nome = dadosPlanilha.nome;
          mudancas.push(`Nome: "${unidade.nome}" → "${dadosPlanilha.nome}"`);
        }

        if (!valoresIguais(dadosPlanilha.endereco, unidade.endereco)) {
          updates.endereco = dadosPlanilha.endereco;
          mudancas.push(`Endereço: "${unidade.endereco}" → "${dadosPlanilha.endereco}"`);
        }

        if (!valoresIguais(dadosPlanilha.bairro, unidade.bairro)) {
          updates.bairro = dadosPlanilha.bairro;
          mudancas.push(`Bairro: "${unidade.bairro}" → "${dadosPlanilha.bairro}"`);
        }

        if (!valoresIguais(dadosPlanilha.telefone, unidade.telefone)) {
          updates.telefone = dadosPlanilha.telefone;
          mudancas.push(`Telefone: "${unidade.telefone}" → "${dadosPlanilha.telefone}"`);
        }

        if (dadosPlanilha.latitude && !valoresIguais(dadosPlanilha.latitude, unidade.latitude)) {
          updates.latitude = dadosPlanilha.latitude;
          mudancas.push(`Latitude: ${unidade.latitude} → ${dadosPlanilha.latitude}`);
        }

        if (dadosPlanilha.longitude && !valoresIguais(dadosPlanilha.longitude, unidade.longitude)) {
          updates.longitude = dadosPlanilha.longitude;
          mudancas.push(`Longitude: ${unidade.longitude} → ${dadosPlanilha.longitude}`);
        }

        // Se houver mudanças, atualizar
        if (Object.keys(updates).length > 0) {
          await prisma.unidade.update({
            where: { id: unidade.id },
            data: updates
          });

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
      estatisticas.naoEncontrados.forEach(nome => {
        console.log(`   • ${nome}`);
      });
    }

    if (estatisticas.erros.length > 0) {
      console.log('\n❌ Erros encontrados:');
      estatisticas.erros.forEach(({ nome, erro }) => {
        console.log(`   • ${nome}: ${erro}`);
      });
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
    await prisma.$disconnect();
  }
}

// Executar
atualizarDados()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
