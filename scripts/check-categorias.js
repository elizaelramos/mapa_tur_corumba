require('dotenv').config();
const { PrismaClient } = require('@mapatur/database');
const prisma = new PrismaClient();

async function checkCategorias() {
  try {
    const categorias = await prisma.pROD_Categoria.findMany({
      where: { ativo: true },
      orderBy: [
        { nome: 'asc' },
        { subcategoria: 'asc' }
      ]
    });

    console.log('=== CATEGORIAS NO BANCO DE DADOS ===');
    console.log('Total:', categorias.length);

    const byCategoria = {};
    categorias.forEach(cat => {
      if (!byCategoria[cat.nome]) {
        byCategoria[cat.nome] = [];
      }
      byCategoria[cat.nome].push({
        id: cat.id,
        subcategoria: cat.subcategoria || '(sem subcategoria)'
      });
    });

    Object.entries(byCategoria).forEach(([nome, subs]) => {
      console.log(`\n📁 ${nome}`);
      subs.forEach(sub => console.log(`   → [${sub.id}] ${sub.subcategoria}`));
    });

    // Verificar se as unidades têm categorias associadas
    const unidadesComCategorias = await prisma.junction_UnidadeTuristica_Categoria.count();
    const totalUnidades = await prisma.pROD_UnidadeTuristica.count();

    console.log('\n=== ASSOCIAÇÕES ===');
    console.log('Total de unidades:', totalUnidades);
    console.log('Total de associações unidade-categoria:', unidadesComCategorias);

    if (totalUnidades > 0) {
      console.log('Média de categorias por unidade:', (unidadesComCategorias / totalUnidades).toFixed(2));
    }

    // Verificar quantas unidades importadas não têm categoria
    const unidadesSemCategoria = await prisma.pROD_UnidadeTuristica.findMany({
      where: {
        categorias: {
          none: {}
        }
      },
      select: {
        id: true,
        nome: true
      },
      take: 10
    });

    console.log('\n=== UNIDADES SEM CATEGORIA (primeiras 10) ===');
    if (unidadesSemCategoria.length === 0) {
      console.log('Todas as unidades têm categoria! ✅');
    } else {
      unidadesSemCategoria.forEach(u => {
        console.log(`  [${u.id}] ${u.nome}`);
      });
    }

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCategorias();
