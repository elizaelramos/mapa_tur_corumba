const { PrismaClient } = require('@prisma/client');

async function checkIcons() {
  const prisma = new PrismaClient();

  try {
    const unidades = await prisma.unidade.findMany({
      where: {
        nome: {
          in: ['UBS PADRE ERNESTO SASSIDA', 'UBS São Bartolomeu']
        }
      },
      select: {
        id: true,
        nome: true,
        icone_url: true
      }
    });

    console.log('Unidades encontradas:', unidades);
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkIcons();