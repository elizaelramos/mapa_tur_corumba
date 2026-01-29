// Script para verificar estatísticas de categorias de farmácias
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verificarStats() {
  try {
    console.log('🔍 Verificando categorias de Farmácia...\n');

    // Buscar todas as categorias que contêm "Farmácia"
    const categoriasFarmacia = await prisma.pROD_Categoria.findMany({
      where: {
        OR: [
          { nome: { contains: 'Farmácia' } },
          { subcategoria: { contains: 'Farmácia' } },
          { segmento: { contains: 'Farmácia' } },
        ]
      },
      include: {
        _count: {
          select: { unidades: true }
        },
        unidades: {
          select: {
            unidade: {
              select: {
                id: true,
                nome: true,
                nome_fantasia: true
              }
            }
          }
        }
      }
    });

    console.log(`✅ Encontradas ${categoriasFarmacia.length} categoria(s) relacionada(s) a Farmácia:\n`);

    categoriasFarmacia.forEach(cat => {
      console.log('─'.repeat(60));
      console.log(`ID: ${cat.id}`);
      console.log(`Hierarquia: ${cat.nome}${cat.subcategoria ? ' > ' + cat.subcategoria : ''}${cat.segmento ? ' > ' + cat.segmento : ''}`);
      console.log(`Ativo: ${cat.ativo ? 'Sim' : 'Não'}`);
      console.log(`Total de unidades: ${cat._count.unidades}`);

      if (cat.unidades.length > 0) {
        console.log('\nUnidades vinculadas:');
        cat.unidades.slice(0, 5).forEach((rel, idx) => {
          console.log(`  ${idx + 1}. ${rel.unidade.nome_fantasia || rel.unidade.nome} (ID: ${rel.unidade.id})`);
        });
        if (cat.unidades.length > 5) {
          console.log(`  ... e mais ${cat.unidades.length - 5} unidades`);
        }
      }
      console.log('');
    });

    // Verificar farmácias sem categoria
    console.log('─'.repeat(60));
    console.log('\n🔍 Verificando farmácias (setor="Farmácia") sem categoria...\n');

    const farmaciasSemCategoria = await prisma.pROD_UnidadeTuristica.findMany({
      where: {
        setor: 'Farmácia',
        categorias: {
          none: {}
        }
      },
      select: {
        id: true,
        nome: true,
        nome_fantasia: true,
        setor: true
      }
    });

    if (farmaciasSemCategoria.length > 0) {
      console.log(`⚠️  Encontradas ${farmaciasSemCategoria.length} farmácia(s) SEM categoria:\n`);
      farmaciasSemCategoria.forEach((f, idx) => {
        console.log(`  ${idx + 1}. ${f.nome_fantasia || f.nome} (ID: ${f.id})`);
      });
    } else {
      console.log('✅ Todas as farmácias têm categoria vinculada!');
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verificarStats()
  .then(() => {
    console.log('\n✅ Verificação concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Falha na verificação:', error);
    process.exit(1);
  });
