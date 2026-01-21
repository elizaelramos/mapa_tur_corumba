#!/usr/bin/env node

/**
 * Script para importar Segmentos (SubItem) da planilha para o banco de dados
 * Cria categorias com 3 níveis: Categoria > Subcategoria > Segmento
 * Depois associa as unidades turísticas às categorias corretas
 */

const XLSX = require('xlsx');
const path = require('path');
const mysql = require('mysql2/promise');

// Carregar variáveis de ambiente
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Arquivo da planilha
const PLANILHA_PATH = path.join(__dirname, '..', 'Mapas_Tur_2026_01_20_Versão2.xlsx');

// Função para normalizar segmento (ignorar valores vazios ou placeholders)
function normalizarSegmento(segmento) {
  if (!segmento) return null;
  const seg = String(segmento).trim();

  // Ignorar placeholders comuns
  if (seg === '--------------------------' ||
      seg === '---' ||
      seg === 'N/A' ||
      seg === '' ||
      seg.toLowerCase() === 'null') {
    return null;
  }

  return seg;
}

// Função para normalizar subcategoria
function normalizarSubcategoria(subcategoria) {
  if (!subcategoria) return null;
  let sub = String(subcategoria).trim();

  // Remover dois pontos no final se houver
  if (sub.endsWith(':')) {
    sub = sub.slice(0, -1).trim();
  }

  return sub || null;
}

async function importarSegmentos() {
  console.log('============================================================');
  console.log('📊 IMPORTAÇÃO DE SEGMENTOS - Mapa Turismo');
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
      categoriasNovas: 0,
      categoriasExistentes: 0,
      unidadesAtualizadas: 0,
      erros: [],
      categoriasCriadas: []
    };

    // Mapa para cachear IDs de categorias já processadas
    const categoriaCache = new Map();

    console.log('📝 Processando registros...\n');

    // Processar cada linha
    for (const row of rows) {
      const nomeUnidade = row['Nome'] || row['NOME FANTASIA'];
      const categoria = row['Categoria'];
      const subcategoria = normalizarSubcategoria(row['Subcategoria']);
      const segmento = normalizarSegmento(row['SubItem']);

      if (!nomeUnidade || !categoria) {
        console.log(`⚠️  Linha sem nome ou categoria, pulando...`);
        continue;
      }

      estatisticas.processados++;

      try {
        // Criar chave única para cache
        const cacheKey = `${categoria}|${subcategoria || ''}|${segmento || ''}`;

        let categoriaId;

        // Verificar se já processamos essa categoria
        if (categoriaCache.has(cacheKey)) {
          categoriaId = categoriaCache.get(cacheKey);
          estatisticas.categoriasExistentes++;
        } else {
          // Buscar ou criar categoria
          const [categorias] = await connection.execute(
            `SELECT id FROM prod_categoria
             WHERE nome = ?
             AND (subcategoria = ? OR (subcategoria IS NULL AND ? IS NULL))
             AND (segmento = ? OR (segmento IS NULL AND ? IS NULL))
             LIMIT 1`,
            [categoria, subcategoria, subcategoria, segmento, segmento]
          );

          if (categorias.length > 0) {
            // Categoria já existe
            categoriaId = categorias[0].id;
            categoriaCache.set(cacheKey, categoriaId);
            estatisticas.categoriasExistentes++;
          } else {
            // Criar nova categoria
            const [result] = await connection.execute(
              `INSERT INTO prod_categoria (nome, subcategoria, segmento, ativo, ordem, created_at, updated_at)
               VALUES (?, ?, ?, TRUE, 0, NOW(), NOW())`,
              [categoria, subcategoria, segmento]
            );

            categoriaId = result.insertId;
            categoriaCache.set(cacheKey, categoriaId);
            estatisticas.categoriasNovas++;

            const categoriaInfo = {
              id: categoriaId,
              categoria,
              subcategoria,
              segmento
            };
            estatisticas.categoriasCriadas.push(categoriaInfo);

            console.log(`✅ Categoria criada (ID: ${categoriaId}):`);
            console.log(`   • Categoria: ${categoria}`);
            if (subcategoria) console.log(`   • Subcategoria: ${subcategoria}`);
            if (segmento) console.log(`   • Segmento: ${segmento}`);
          }
        }

        // Buscar unidade turística
        const [unidades] = await connection.execute(
          'SELECT id FROM prod_unidade_turistica WHERE nome = ? LIMIT 1',
          [nomeUnidade.trim()]
        );

        if (unidades.length === 0) {
          // Unidade não encontrada, mas não é erro crítico
          continue;
        }

        const unidadeId = unidades[0].id;

        // Verificar se associação já existe
        const [juncoes] = await connection.execute(
          'SELECT * FROM junction_unidade_categoria WHERE id_unidade = ? AND id_categoria = ? LIMIT 1',
          [unidadeId, categoriaId]
        );

        if (juncoes.length === 0) {
          // Criar associação
          await connection.execute(
            'INSERT INTO junction_unidade_categoria (id_unidade, id_categoria, created_at) VALUES (?, ?, NOW())',
            [unidadeId, categoriaId]
          );

          estatisticas.unidadesAtualizadas++;
          console.log(`   → Associada unidade "${nomeUnidade}" à categoria ${categoriaId}`);
        }

      } catch (error) {
        console.error(`❌ Erro ao processar "${nomeUnidade}":`, error.message);
        estatisticas.erros.push({ nome: nomeUnidade, erro: error.message });
      }
    }

    // Relatório final
    console.log('\n============================================================');
    console.log('📈 RELATÓRIO FINAL');
    console.log('============================================================');
    console.log(`Total processados:        ${estatisticas.processados}`);
    console.log(`Categorias novas:         ${estatisticas.categoriasNovas}`);
    console.log(`Categorias existentes:    ${estatisticas.categoriasExistentes}`);
    console.log(`Unidades associadas:      ${estatisticas.unidadesAtualizadas}`);
    console.log(`Erros:                    ${estatisticas.erros.length}`);

    if (estatisticas.categoriasCriadas.length > 0) {
      console.log('\n✨ Novas categorias criadas:');
      estatisticas.categoriasCriadas.forEach(cat => {
        const partes = [cat.categoria];
        if (cat.subcategoria) partes.push(cat.subcategoria);
        if (cat.segmento) partes.push(cat.segmento);
        console.log(`   • ID ${cat.id}: ${partes.join(' > ')}`);
      });
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
    const relatorioPath = path.join(__dirname, '..', `import-segmentos-report-${Date.now()}.json`);
    fs.writeFileSync(relatorioPath, JSON.stringify(estatisticas, null, 2));
    console.log(`\n💾 Relatório detalhado salvo em: ${relatorioPath}`);

    console.log('\n✅ Importação concluída com sucesso!');

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
importarSegmentos()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
