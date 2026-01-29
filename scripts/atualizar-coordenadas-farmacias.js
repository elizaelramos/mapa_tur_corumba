// Script para atualizar as coordenadas das farmácias no banco de dados
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function atualizarCoordenadasFarmacias() {
  try {
    console.log('📖 Lendo arquivo de farmácias atualizado...');
    const jsonPath = path.join(__dirname, '..', 'farmacias_corumba.json');
    const farmaciasData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    console.log(`✅ Encontradas ${farmaciasData.length} farmácias para atualizar\n`);
    console.log('🔄 Atualizando coordenadas...\n');

    let sucessos = 0;
    let naoEncontradas = 0;
    let erros = 0;
    const detalhes = [];

    for (const farmacia of farmaciasData) {
      try {
        // Buscar a farmácia pelo nome_fantasia
        const unidade = await prisma.pROD_UnidadeTuristica.findFirst({
          where: {
            nome_fantasia: farmacia.nome_fantasia
          }
        });

        if (!unidade) {
          console.log(`  ⚠️  [${farmacia.item}] ${farmacia.nome_fantasia} - NÃO ENCONTRADA`);
          naoEncontradas++;
          continue;
        }

        // Atualizar as coordenadas
        await prisma.pROD_UnidadeTuristica.update({
          where: { id: unidade.id },
          data: {
            latitude: farmacia.latitude,
            longitude: farmacia.longitude
          }
        });

        console.log(`  ✅ [${farmacia.item}] ${farmacia.nome_fantasia} - Atualizada (ID: ${unidade.id})`);
        console.log(`      Coordenadas: ${farmacia.latitude}, ${farmacia.longitude}`);
        sucessos++;

      } catch (error) {
        console.error(`  ❌ [${farmacia.item}] ${farmacia.nome_fantasia} - ERRO: ${error.message}`);
        detalhes.push({
          item: farmacia.item,
          nome: farmacia.nome_fantasia,
          erro: error.message
        });
        erros++;
      }
    }

    // Resumo
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA ATUALIZAÇÃO');
    console.log('='.repeat(60));
    console.log(`Total de registros: ${farmaciasData.length}`);
    console.log(`✅ Atualizados: ${sucessos}`);
    console.log(`⚠️  Não encontrados: ${naoEncontradas}`);
    console.log(`❌ Erros: ${erros}`);
    console.log('='.repeat(60));

    if (detalhes.length > 0) {
      console.log('\n⚠️  Erros detalhados:');
      detalhes.forEach(e => {
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
atualizarCoordenadasFarmacias()
  .then(() => {
    console.log('\n✅ Atualização concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Falha na atualização:', error);
    process.exit(1);
  });
