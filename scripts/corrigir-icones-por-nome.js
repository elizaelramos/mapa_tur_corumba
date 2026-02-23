/**
 * Script para corrigir ícones das unidades baseado no NOME da categoria
 * Faz match entre nome da categoria e nome do ícone
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

// Normaliza string para comparação
function normalizar(str) {
  return str.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]/g, '') // Remove caracteres especiais
    .trim();
}

// Verifica se dois nomes são similares
function saoSimilares(nome1, nome2) {
  const n1 = normalizar(nome1);
  const n2 = normalizar(nome2);

  // Match exato
  if (n1 === n2) return true;

  // Um contém o outro
  if (n1.includes(n2) || n2.includes(n1)) return true;

  return false;
}

async function corrigirIcones() {
  console.log('🔧 CORREÇÃO DE ÍCONES POR NOME DA CATEGORIA\n');
  console.log('=' .repeat(70) + '\n');

  try {
    // 1. Buscar todos os ícones
    const icones = await prisma.pROD_Icone.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' }
    });

    console.log('🎨 Ícones disponíveis:\n');
    icones.forEach(i => console.log(`   [${i.id}] ${i.nome}`));
    console.log('');

    // 2. Buscar todas as categorias
    const categorias = await prisma.pROD_Categoria.findMany({
      orderBy: { nome: 'asc' }
    });

    console.log(`📂 Total de categorias: ${categorias.length}\n`);
    console.log('=' .repeat(70) + '\n');

    // 3. Para cada categoria, encontrar ícone correspondente
    const mapeamentos = [];

    for (const categoria of categorias) {
      // Buscar unidades desta categoria
      const unidades = await prisma.pROD_UnidadeTuristica.findMany({
        where: {
          categorias: {
            some: { id_categoria: categoria.id }
          }
        },
        select: { id: true }
      });

      if (unidades.length === 0) continue;

      // Tentar encontrar ícone com nome similar
      const iconeCorrespondente = icones.find(icone =>
        saoSimilares(categoria.nome, icone.nome)
      );

      if (iconeCorrespondente) {
        mapeamentos.push({
          categoria,
          icone: iconeCorrespondente,
          unidadeIds: unidades.map(u => u.id),
          quantidadeUnidades: unidades.length
        });
      }
    }

    // 4. Mostrar preview dos mapeamentos
    console.log('📝 MAPEAMENTOS PROPOSTOS:\n');

    if (mapeamentos.length === 0) {
      console.log('⚠️  Nenhum mapeamento automático encontrado.\n');
      return;
    }

    let totalUnidades = 0;
    mapeamentos.forEach(({ categoria, icone, quantidadeUnidades }) => {
      console.log(`✅ Categoria "${categoria.nome}" (${quantidadeUnidades} unidades)`);
      console.log(`   → Ícone "${icone.nome}" (ID: ${icone.id})`);
      console.log(`   URL: ${icone.url}\n`);
      totalUnidades += quantidadeUnidades;
    });

    console.log(`📊 Total: ${totalUnidades} unidades serão atualizadas\n`);
    console.log('=' .repeat(70) + '\n');

    // 5. Confirmar com usuário
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const resposta = await new Promise((resolve) => {
      rl.question('Deseja aplicar essas correções? (s/N): ', resolve);
    });
    rl.close();

    if (resposta.toLowerCase() !== 's' && resposta.toLowerCase() !== 'sim') {
      console.log('\n❌ Operação cancelada\n');
      return;
    }

    // 6. Aplicar correções
    console.log('\n🔄 Aplicando correções...\n');

    let totalAtualizado = 0;

    for (const { categoria, icone, unidadeIds, quantidadeUnidades } of mapeamentos) {
      const result = await prisma.pROD_UnidadeTuristica.updateMany({
        where: {
          id: { in: unidadeIds }
        },
        data: {
          icone_url: icone.url
        }
      });

      console.log(`✅ ${result.count} unidade(s) da categoria "${categoria.nome}" → ícone "${icone.nome}"`);
      totalAtualizado += result.count;
    }

    console.log(`\n✅ Correção concluída! ${totalAtualizado} unidades atualizadas\n`);

    // 7. Relatório de categorias sem ícone correspondente
    console.log('=' .repeat(70) + '\n');
    console.log('📋 CATEGORIAS SEM ÍCONE CORRESPONDENTE:\n');

    const categoriasComUnidades = await Promise.all(
      categorias.map(async (cat) => {
        const count = await prisma.pROD_UnidadeTuristica.count({
          where: {
            categorias: {
              some: { id_categoria: cat.id }
            }
          }
        });
        return { categoria: cat, count };
      })
    );

    const categoriasSemIcone = categoriasComUnidades.filter(({ categoria, count }) => {
      if (count === 0) return false;
      const temIcone = icones.some(i => saoSimilares(categoria.nome, i.nome));
      return !temIcone;
    });

    if (categoriasSemIcone.length > 0) {
      console.log('⚠️  As seguintes categorias têm unidades mas não têm ícone correspondente:\n');
      categoriasSemIcone.forEach(({ categoria, count }) => {
        console.log(`   - "${categoria.nome}" (${count} unidades)`);
      });
      console.log('\n💡 Essas unidades precisarão de um ícone genérico ou novo ícone criado.\n');
    } else {
      console.log('✅ Todas as categorias com unidades têm ícone correspondente!\n');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
corrigirIcones()
  .then(() => {
    console.log('✅ Script finalizado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
