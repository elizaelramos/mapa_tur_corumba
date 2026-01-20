const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDuplicates() {
  console.log('==========================================');
  console.log('VERIFICANDO DUPLICATAS NO BANCO DE DADOS');
  console.log('==========================================\n');

  try {
    // Buscar todas as unidades
    const unidades = await prisma.pROD_UnidadeTuristica.findMany({
      orderBy: [
        { nome: 'asc' },
        { id: 'asc' }
      ]
    });

    console.log(`✓ Total de unidades no banco: ${unidades.length}\n`);

    // Agrupar por nome para encontrar duplicatas
    const unidadesPorNome = {};

    unidades.forEach(unidade => {
      const nome = unidade.nome;
      if (!unidadesPorNome[nome]) {
        unidadesPorNome[nome] = [];
      }
      unidadesPorNome[nome].push(unidade);
    });

    // Encontrar nomes duplicados
    const nomesDuplicados = Object.entries(unidadesPorNome)
      .filter(([nome, unidades]) => unidades.length > 1)
      .sort((a, b) => b[1].length - a[1].length);

    if (nomesDuplicados.length === 0) {
      console.log('✓ Nenhuma duplicata encontrada!\n');
      return;
    }

    console.log(`⚠️  Encontradas ${nomesDuplicados.length} unidades com duplicatas:\n`);

    let totalDuplicatas = 0;
    nomesDuplicados.forEach(([nome, unidades]) => {
      console.log(`📍 "${nome}" - ${unidades.length} registros:`);
      unidades.forEach(u => {
        console.log(`   ID: ${u.id} | Lat: ${u.latitude} | Lng: ${u.longitude} | Criado: ${u.created_at}`);
      });
      console.log('');
      totalDuplicatas += (unidades.length - 1);
    });

    console.log(`\n📊 RESUMO:`);
    console.log(`   Total de unidades: ${unidades.length}`);
    console.log(`   Unidades únicas: ${Object.keys(unidadesPorNome).length}`);
    console.log(`   Registros duplicados a remover: ${totalDuplicatas}`);
    console.log(`   Após limpeza restará: ${unidades.length - totalDuplicatas} unidades\n`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkDuplicates()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error('❌ ERRO FATAL:', error);
    prisma.$disconnect();
    process.exit(1);
  });
