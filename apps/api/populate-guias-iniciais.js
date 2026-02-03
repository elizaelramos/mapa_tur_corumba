// Script para popular banco com os 6 guias turísticos iniciais
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'mysql://tableau:dose25_teq2@172.16.0.117:3306/mapa_tur'
    }
  }
});

const guiasIniciais = [
  {
    nome: 'ANTONIO TAVARES DE LIRA NETO',
    whatsapp: '(67) 98132-5687',
    idiomas: 'Português',
    ordem: 1,
  },
  {
    nome: 'ERNESTO JOSE VIEIRA NETO',
    whatsapp: '(67) 99851-0040',
    idiomas: 'Espanhol, Português',
    ordem: 2,
  },
  {
    nome: 'NATANAEL AMARILHA DE FREITAS',
    whatsapp: '(67) 98461-0257',
    idiomas: 'Português, Espanhol',
    ordem: 3,
  },
  {
    nome: 'JULIETA SILVIA ALVES VELASCO PALMEIRA',
    whatsapp: '(67) 99645-0837',
    idiomas: 'Português',
    ordem: 4,
  },
  {
    nome: 'OFINY AMORIM DE MATOS',
    whatsapp: '(67) 99642-0640',
    idiomas: 'Espanhol, Português',
    ordem: 5,
  },
  {
    nome: 'PAULO CARNEIRO DE OLIVEIRA',
    whatsapp: '(48) 92000-2237',
    idiomas: 'Espanhol, Português',
    ordem: 6,
  },
];

(async () => {
  try {
    console.log('🚀 Populando banco com guias turísticos iniciais...\n');

    let criadosCount = 0;
    let ignoradosCount = 0;

    for (const guiaData of guiasIniciais) {
      // Verificar se o guia já existe (por nome)
      const existe = await prisma.pROD_GuiaTuristico.findFirst({
        where: { nome: guiaData.nome }
      });

      if (existe) {
        console.log(`⏭️  Guia já existe: ${guiaData.nome}`);
        ignoradosCount++;
        continue;
      }

      // Criar o guia
      const guia = await prisma.pROD_GuiaTuristico.create({
        data: {
          nome: guiaData.nome,
          whatsapp: guiaData.whatsapp,
          idiomas: guiaData.idiomas,
          ativo: true,
          ordem: guiaData.ordem,
        }
      });

      console.log(`✅ Criado: ${guia.nome} - ${guia.whatsapp}`);
      criadosCount++;
    }

    console.log(`\n📊 Resumo:`);
    console.log(`   Guias criados: ${criadosCount}`);
    console.log(`   Guias já existentes: ${ignoradosCount}`);
    console.log(`   Total: ${guiasIniciais.length}\n`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
