require('dotenv').config();
const { prisma } = require('@mapatur/database');

async function verificarPostos() {
  try {
    console.log('📍 Verificando Postos de Combustível no banco de dados...\n');

    const postos = await prisma.pROD_UnidadeTuristica.findMany({
      where: {
        setor: 'POSTO DE COMBUSTÍVEL'
      },
      include: {
        bairro: true,
        categorias: {
          include: {
            categoria: true
          }
        }
      },
      orderBy: {
        id: 'asc'
      }
    });

    console.log(`✅ Total de postos encontrados: ${postos.length}\n`);

    postos.forEach((posto, index) => {
      console.log(`${index + 1}. ${posto.nome}`);
      console.log(`   ID: ${posto.id}`);
      console.log(`   Endereço: ${posto.endereco || 'N/A'}`);
      console.log(`   Bairro: ${posto.bairro?.nome || 'N/A'}`);
      console.log(`   Coordenadas: ${posto.latitude}, ${posto.longitude}`);
      console.log(`   Categorias: ${posto.categorias.map(c => c.categoria.nome + (c.categoria.subcategoria ? ' - ' + c.categoria.subcategoria : '')).join(', ')}`);
      console.log('');
    });

    // Verificar problemas
    console.log('🔍 Verificando problemas...\n');

    const bairrosInvalidos = postos.filter(p => p.bairro?.nome.match(/-?\d+\.\d+/));
    if (bairrosInvalidos.length > 0) {
      console.log(`⚠️  ${bairrosInvalidos.length} posto(s) com bairros inválidos (coordenadas):`);
      bairrosInvalidos.forEach(p => {
        console.log(`   - ${p.nome} (ID: ${p.id}) - Bairro: ${p.bairro?.nome}`);
      });
      console.log('');
    } else {
      console.log('✅ Todos os bairros estão corretos\n');
    }

    const semBairro = postos.filter(p => !p.bairro);
    if (semBairro.length > 0) {
      console.log(`⚠️  ${semBairro.length} posto(s) sem bairro:`);
      semBairro.forEach(p => {
        console.log(`   - ${p.nome} (ID: ${p.id})`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  }
}

verificarPostos()
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
