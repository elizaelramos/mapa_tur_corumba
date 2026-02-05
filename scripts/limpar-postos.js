require('dotenv').config();
const { prisma } = require('@mapatur/database');

async function limparPostos() {
  try {
    console.log('🗑️  Limpando postos de combustível duplicados...\n');

    // Buscar todos os postos
    const postos = await prisma.pROD_UnidadeTuristica.findMany({
      where: {
        setor: 'POSTO DE COMBUSTÍVEL'
      }
    });

    console.log(`📊 Total de postos encontrados: ${postos.length}`);

    if (postos.length === 0) {
      console.log('✅ Não há postos para limpar\n');
      return;
    }

    // Deletar todas as relações primeiro (junction table)
    for (const posto of postos) {
      await prisma.junction_UnidadeTuristica_Categoria.deleteMany({
        where: {
          id_unidade: posto.id
        }
      });
    }

    // Deletar os postos
    const resultado = await prisma.pROD_UnidadeTuristica.deleteMany({
      where: {
        setor: 'POSTO DE COMBUSTÍVEL'
      }
    });

    console.log(`✅ ${resultado.count} postos deletados com sucesso\n`);

    // Limpar bairro inválido se existir
    const bairroInvalido = await prisma.pROD_Bairro.findFirst({
      where: {
        nome: { contains: '-19.' }
      }
    });

    if (bairroInvalido) {
      await prisma.pROD_Bairro.delete({
        where: { id: bairroInvalido.id }
      });
      console.log(`✅ Bairro inválido "${bairroInvalido.nome}" removido\n`);
    }

    console.log('🎉 Limpeza concluída!\n');

  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  }
}

limparPostos()
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
