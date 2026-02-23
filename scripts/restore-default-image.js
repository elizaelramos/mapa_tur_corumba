/**
 * Restaura a imagem padrão da prefeitura em todas as unidades
 * que estavam com a imagem do carnaval 2026
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { prisma } = require('../packages/database');

const CARNIVAL_IMAGE = '/uploads/imagem_Padrão_Mapas_Carnaval_2026.png';
const DEFAULT_IMAGE = '/uploads/Logo-Prefeitura-Padr--o-1767631304429-148006191.png';

async function main() {
  // Contar registros afetados
  const count = await prisma.pROD_UnidadeTuristica.count({
    where: { imagem_url: CARNIVAL_IMAGE },
  });

  console.log(`Unidades com imagem do carnaval: ${count}`);

  if (count === 0) {
    console.log('Nenhuma unidade para atualizar.');
    return;
  }

  // Executar o update
  const result = await prisma.pROD_UnidadeTuristica.updateMany({
    where: { imagem_url: CARNIVAL_IMAGE },
    data: { imagem_url: DEFAULT_IMAGE },
  });

  console.log(`✅ ${result.count} unidades atualizadas com a imagem padrão da prefeitura.`);
}

main()
  .catch((e) => {
    console.error('Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
