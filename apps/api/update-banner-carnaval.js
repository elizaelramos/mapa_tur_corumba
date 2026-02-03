// Script para atualizar banner de Carnaval em todas as unidades
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'mysql://tableau:dose25_teq2@172.16.0.117:3306/mapa_tur'
    }
  }
});

const BANNER_IMAGE = '/uploads/imagem_Padrão_Mapas_Carnaval_2026.png';

(async () => {
  try {
    console.log('🎭 Atualizando banner de Carnaval...\n');

    // Atualizar todas as unidades com a imagem do Carnaval
    const result = await prisma.pROD_UnidadeTuristica.updateMany({
      data: {
        imagem_url: BANNER_IMAGE
      }
    });

    console.log(`✅ ${result.count} unidades atualizadas com o banner do Carnaval!`);
    console.log(`📸 Imagem: ${BANNER_IMAGE}`);
    console.log(`🔗 Link: https://corumba.ms.gov.br/paginas/ver/carnaval-2026\n`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
})();
