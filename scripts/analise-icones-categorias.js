/**
 * Script para ANALISAR ícones e categorias
 * NÃO FAZ ALTERAÇÕES - apenas mostra o estado atual
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analisar() {
  console.log('📊 ANÁLISE DE ÍCONES E CATEGORIAS\n');
  console.log('=' .repeat(70) + '\n');

  try {
    // 1. Listar todos os ícones
    const icones = await prisma.pROD_Icone.findMany({
      orderBy: { nome: 'asc' }
    });

    console.log('🎨 ÍCONES DISPONÍVEIS:\n');
    icones.forEach(icone => {
      console.log(`   [ID ${icone.id}] ${icone.nome}`);
      console.log(`   URL: ${icone.url}`);
      console.log(`   Ativo: ${icone.ativo ? 'Sim' : 'Não'}\n`);
    });

    console.log('=' .repeat(70) + '\n');

    // 2. Listar todas as categorias e suas unidades
    const categorias = await prisma.pROD_Categoria.findMany({
      orderBy: { nome: 'asc' }
    });

    console.log('📂 CATEGORIAS E SUAS UNIDADES:\n');

    for (const categoria of categorias) {
      // Buscar unidades desta categoria
      const unidades = await prisma.pROD_UnidadeTuristica.findMany({
        where: {
          categorias: {
            some: {
              id_categoria: categoria.id
            }
          }
        },
        select: {
          id: true,
          nome: true,
          icone_url: true
        }
      });

      if (unidades.length > 0) {
        console.log(`\n📁 Categoria: "${categoria.nome}" (ID: ${categoria.id})`);
        console.log(`   Total de unidades: ${unidades.length}`);

        // Agrupar por ícone usado
        const iconesPorUrl = {};
        unidades.forEach(u => {
          const url = u.icone_url || 'SEM_ICONE';
          if (!iconesPorUrl[url]) {
            iconesPorUrl[url] = [];
          }
          iconesPorUrl[url].push(u);
        });

        console.log(`   Ícones em uso:`);
        Object.entries(iconesPorUrl).forEach(([url, unis]) => {
          if (url === 'SEM_ICONE') {
            console.log(`      ⚠️  ${unis.length} unidade(s) SEM ÍCONE`);
          } else {
            const icone = icones.find(i => i.url === url);
            if (icone) {
              console.log(`      ✅ ${unis.length} unidade(s) usando "${icone.nome}" (ID ${icone.id})`);
            } else {
              console.log(`      ❌ ${unis.length} unidade(s) usando URL não registrada: ${path.basename(url)}`);
            }
          }
        });

        // Mostrar algumas unidades de exemplo
        console.log(`   Exemplos de unidades:`);
        unidades.slice(0, 3).forEach(u => {
          console.log(`      - ${u.nome}`);
        });
        if (unidades.length > 3) {
          console.log(`      ... e mais ${unidades.length - 3} unidades`);
        }
      }
    }

    console.log('\n' + '=' .repeat(70) + '\n');

    // 3. Resumo geral
    const totalUnidades = await prisma.pROD_UnidadeTuristica.count();
    const unidadesComIcone = await prisma.pROD_UnidadeTuristica.count({
      where: { icone_url: { not: null } }
    });
    const unidadesSemIcone = await prisma.pROD_UnidadeTuristica.count({
      where: { icone_url: null }
    });

    console.log('📊 RESUMO GERAL:\n');
    console.log(`   Total de ícones registrados: ${icones.length}`);
    console.log(`   Total de categorias: ${categorias.length}`);
    console.log(`   Total de unidades: ${totalUnidades}`);
    console.log(`   Unidades com ícone: ${unidadesComIcone}`);
    console.log(`   Unidades sem ícone: ${unidadesSemIcone}`);

    console.log('\n' + '=' .repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Erro durante a análise:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
analisar()
  .then(() => {
    console.log('✅ Análise concluída\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
