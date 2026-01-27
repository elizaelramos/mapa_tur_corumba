require('dotenv').config();
const { prisma } = require('@mapatur/database');

async function adicionarServicos() {
  try {
    console.log('🛠️  Adicionando descrição de serviços aos postos de combustível...\n');

    // Serviços comuns de postos de combustível
    const servicosComuns = `• Abastecimento de combustível (Gasolina, Etanol, Diesel)
• Calibragem de pneus
• Troca de óleo
• Loja de conveniência
• Pagamento por cartão
• Banheiros`;

    // Buscar todos os postos
    const postos = await prisma.pROD_UnidadeTuristica.findMany({
      where: {
        setor: 'POSTO DE COMBUSTÍVEL'
      }
    });

    console.log(`📊 Total de postos encontrados: ${postos.length}\n`);

    let atualizados = 0;

    for (const posto of postos) {
      // Verificar se já tem descrição
      if (posto.descricao_servicos) {
        console.log(`  ⏭️  ${posto.nome} - Já possui descrição de serviços`);
        continue;
      }

      // Atualizar com descrição padrão
      await prisma.pROD_UnidadeTuristica.update({
        where: { id: posto.id },
        data: {
          descricao_servicos: servicosComuns
        }
      });

      console.log(`  ✅ ${posto.nome} - Descrição de serviços adicionada`);
      atualizados++;
    }

    console.log(`\n📊 Resumo:`);
    console.log(`   ✅ Postos atualizados: ${atualizados}`);
    console.log(`   ⏭️  Postos já com descrição: ${postos.length - atualizados}`);
    console.log(`   📍 Total: ${postos.length}\n`);

    console.log('🎉 Processo concluído!\n');

  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  }
}

adicionarServicos()
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
