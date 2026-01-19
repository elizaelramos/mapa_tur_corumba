const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('Verificando estrutura do banco de dados...\n');

  try {
    // Verificar se tabelas novas existem
    console.log('📋 Verificando tabelas de unidades turísticas:');

    const unidadesCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'mapa_tur'
      AND table_name = 'prod_unidade_turistica'
    `;
    console.log(`  ✓ prod_unidade_turistica: ${unidadesCount[0].count > 0 ? 'Existe' : 'NÃO EXISTE'}`);

    const categoriasCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'mapa_tur'
      AND table_name = 'prod_categoria'
    `;
    console.log(`  ✓ prod_categoria: ${categoriasCount[0].count > 0 ? 'Existe' : 'NÃO EXISTE'}`);

    const junctionCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'mapa_tur'
      AND table_name = 'junction_unidade_categoria'
    `;
    console.log(`  ✓ junction_unidade_categoria: ${junctionCount[0].count > 0 ? 'Existe' : 'NÃO EXISTE'}`);

    const redesSociaisCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'mapa_tur'
      AND table_name = 'prod_unidade_turistica_redesocial'
    `;
    console.log(`  ✓ prod_unidade_turistica_redesocial: ${redesSociaisCount[0].count > 0 ? 'Existe' : 'NÃO EXISTE'}\n`);

    // Verificar se tabelas antigas ainda existem
    console.log('📋 Verificando tabelas antigas:');

    const escolasCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'mapa_tur'
      AND table_name = 'prod_escola'
    `;
    console.log(`  ${escolasCount[0].count > 0 ? '⚠ ' : '✓ '} prod_escola: ${escolasCount[0].count > 0 ? 'Ainda existe' : 'Removida'}`);

    const professoresCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'mapa_tur'
      AND table_name = 'prod_professor'
    `;
    console.log(`  ${professoresCount[0].count > 0 ? '⚠ ' : '✓ '} prod_professor: ${professoresCount[0].count > 0 ? 'Ainda existe' : 'Removida'}`);

    console.log('\n✅ Verificação concluída!');

    if (escolasCount[0].count > 0) {
      console.log('\n⚠️  ATENÇÃO: Tabelas antigas ainda existem.');
      console.log('   Precisamos remover manualmente.');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkDatabase()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error('❌ ERRO FATAL:', error);
    prisma.$disconnect();
    process.exit(1);
  });
