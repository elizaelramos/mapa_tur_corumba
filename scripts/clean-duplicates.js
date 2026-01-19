const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDuplicates() {
  console.log('==========================================');
  console.log('LIMPANDO DUPLICATAS NO BANCO DE DADOS');
  console.log('==========================================\n');

  try {
    // Buscar todas as unidades
    const unidades = await prisma.pROD_UnidadeTuristica.findMany({
      orderBy: [
        { nome: 'asc' },
        { id: 'asc' }
      ]
    });

    console.log(`📊 Total de unidades no banco: ${unidades.length}\n`);

    // Agrupar por nome
    const unidadesPorNome = {};
    unidades.forEach(unidade => {
      const nome = unidade.nome;
      if (!unidadesPorNome[nome]) {
        unidadesPorNome[nome] = [];
      }
      unidadesPorNome[nome].push(unidade);
    });

    // Encontrar duplicatas e coletar IDs para deletar
    const idsParaDeletar = [];
    const unidadesParaManter = [];

    Object.entries(unidadesPorNome).forEach(([nome, unidadesComMesmoNome]) => {
      if (unidadesComMesmoNome.length > 1) {
        // Ordenar por ID (menor primeiro = mais antigo)
        unidadesComMesmoNome.sort((a, b) => a.id - b.id);

        // Manter o primeiro (mais antigo)
        unidadesParaManter.push(unidadesComMesmoNome[0]);

        // Deletar os demais
        for (let i = 1; i < unidadesComMesmoNome.length; i++) {
          idsParaDeletar.push(unidadesComMesmoNome[i].id);
        }

        console.log(`🔍 "${nome}":`);
        console.log(`   ✓ Mantendo ID ${unidadesComMesmoNome[0].id} (${unidadesComMesmoNome[0].created_at})`);
        console.log(`   ✗ Deletando ${unidadesComMesmoNome.length - 1} duplicata(s): [${unidadesComMesmoNome.slice(1).map(u => u.id).join(', ')}]`);
      } else {
        // Não tem duplicata, manter
        unidadesParaManter.push(unidadesComMesmoNome[0]);
      }
    });

    console.log(`\n\n📋 RESUMO DA OPERAÇÃO:`);
    console.log(`   Unidades a manter: ${unidadesParaManter.length}`);
    console.log(`   Duplicatas a deletar: ${idsParaDeletar.length}`);

    if (idsParaDeletar.length === 0) {
      console.log('\n✓ Nenhuma duplicata para deletar!\n');
      return;
    }

    console.log(`\n⚠️  ATENÇÃO: ${idsParaDeletar.length} registros serão deletados!`);
    console.log('   Iniciando limpeza em 2 segundos...\n');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Deletar duplicatas
    console.log('🗑️  Deletando duplicatas...\n');

    let deletados = 0;
    for (const id of idsParaDeletar) {
      try {
        // O cascade DELETE cuidará das redes sociais e categorias
        await prisma.pROD_UnidadeTuristica.delete({
          where: { id }
        });
        deletados++;

        if (deletados % 10 === 0) {
          console.log(`   Progresso: ${deletados}/${idsParaDeletar.length} deletados`);
        }
      } catch (error) {
        console.error(`   ✗ Erro ao deletar ID ${id}: ${error.message}`);
      }
    }

    console.log(`\n✅ LIMPEZA CONCLUÍDA!`);
    console.log(`   Registros deletados: ${deletados}`);
    console.log(`   Unidades restantes: ${unidadesParaManter.length}\n`);

    // Verificar resultado final
    const totalFinal = await prisma.pROD_UnidadeTuristica.count();
    console.log(`📊 Verificação: ${totalFinal} unidades no banco após limpeza\n`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  }
}

cleanDuplicates()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error('❌ ERRO FATAL:', error);
    prisma.$disconnect();
    process.exit(1);
  });
