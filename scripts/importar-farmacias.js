// Script para importar farmácias do arquivo JSON para o banco de dados
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importarFarmacias() {
  try {
    console.log('📖 Lendo arquivo de farmácias...');
    const jsonPath = path.join(__dirname, '..', 'farmacias_corumba.json');
    const farmaciasData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    console.log(`✅ Encontradas ${farmaciasData.length} farmácias para importar\n`);

    // 1. Buscar ou criar a categoria "Farmácia"
    console.log('🏥 Verificando categoria Farmácia...');
    let categoria = await prisma.pROD_Categoria.findFirst({
      where: {
        nome: 'Organize sua Viagem',
        subcategoria: 'Saúde',
        segmento: 'Farmácia'
      }
    });

    if (!categoria) {
      categoria = await prisma.pROD_Categoria.create({
        data: {
          nome: 'Organize sua Viagem',
          subcategoria: 'Saúde',
          segmento: 'Farmácia',
          ativo: true,
          ordem: 0
        }
      });
      console.log('✅ Categoria criada:', categoria.id);
    } else {
      console.log('✅ Categoria encontrada:', categoria.id);
    }

    // 2. Mapear bairros únicos
    const bairrosUnicos = [...new Set(farmaciasData.map(f => f.bairro))];
    console.log(`\n📍 Processando ${bairrosUnicos.length} bairros únicos...`);

    const bairrosMap = {};
    for (const nomeBairro of bairrosUnicos) {
      let bairro = await prisma.pROD_Bairro.findFirst({
        where: { nome: nomeBairro }
      });

      if (!bairro) {
        bairro = await prisma.pROD_Bairro.create({
          data: {
            nome: nomeBairro,
            ativo: true
          }
        });
        console.log(`  ✅ Bairro criado: ${nomeBairro} (ID: ${bairro.id})`);
      } else {
        console.log(`  ✅ Bairro encontrado: ${nomeBairro} (ID: ${bairro.id})`);
      }
      bairrosMap[nomeBairro] = bairro.id;
    }

    // 3. Importar farmácias
    console.log('\n💊 Importando farmácias...\n');
    let sucessos = 0;
    let erros = 0;
    const errosDetalhes = [];

    for (const farmacia of farmaciasData) {
      try {
        // Verificar se já existe pelo nome
        const existente = await prisma.pROD_UnidadeTuristica.findFirst({
          where: {
            nome_fantasia: farmacia.nome_fantasia
          }
        });

        if (existente) {
          console.log(`  ⚠️  [${farmacia.item}] ${farmacia.nome_fantasia} - JÁ EXISTE (ID: ${existente.id})`);
          continue;
        }

        // Criar a unidade turística
        const unidade = await prisma.pROD_UnidadeTuristica.create({
          data: {
            nome: farmacia.nome_fantasia,
            nome_fantasia: farmacia.nome_fantasia,
            setor: farmacia.setor,
            endereco: farmacia.endereco,
            id_bairro: bairrosMap[farmacia.bairro],
            latitude: farmacia.latitude,
            longitude: farmacia.longitude,
            telefone: farmacia.contato,
            horario_funcionamento: farmacia.horario,
            ativo: true
          }
        });

        // Vincular com a categoria
        await prisma.junction_UnidadeTuristica_Categoria.create({
          data: {
            id_unidade: unidade.id,
            id_categoria: categoria.id
          }
        });

        console.log(`  ✅ [${farmacia.item}] ${farmacia.nome_fantasia} - Importada (ID: ${unidade.id})`);
        sucessos++;
      } catch (error) {
        console.error(`  ❌ [${farmacia.item}] ${farmacia.nome_fantasia} - ERRO: ${error.message}`);
        errosDetalhes.push({
          item: farmacia.item,
          nome: farmacia.nome_fantasia,
          erro: error.message
        });
        erros++;
      }
    }

    // Resumo
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA IMPORTAÇÃO');
    console.log('='.repeat(60));
    console.log(`Total de registros: ${farmaciasData.length}`);
    console.log(`✅ Sucessos: ${sucessos}`);
    console.log(`❌ Erros: ${erros}`);
    console.log('='.repeat(60));

    if (errosDetalhes.length > 0) {
      console.log('\n⚠️  Erros detalhados:');
      errosDetalhes.forEach(e => {
        console.log(`  [${e.item}] ${e.nome}: ${e.erro}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
importarFarmacias()
  .then(() => {
    console.log('\n✅ Importação concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Falha na importação:', error);
    process.exit(1);
  });
