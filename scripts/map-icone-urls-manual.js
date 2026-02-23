/**
 * Script para mapear manualmente URLs antigas de ícones para novas
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

// Mapeamento manual de URLs antigas para IDs de ícones novos
// Baseado na análise do problema
const MANUAL_MAPPING = {
  '/uploads/icones/Pizzaria.png': 11, // Onde se alimentar
  '/uploads/icones/Lanchonete.png': 11, // Onde se alimentar
  '/uploads/icones/Sorveteria_Gelateria.png': 11, // Onde se alimentar
  '/uploads/icones/Restaurante Multisserviços.png': 11, // Onde se alimentar
  '/uploads/icones/Hotel Rural.png': 8, // Onde se Hospedar
  '/uploads/icones/Hotel Urbano.png': 8, // Onde se Hospedar
  '/uploads/icones/Imersão Pesca - Pousadas.png': 8, // Onde se Hospedar
  '/uploads/icones/Imersão Pesca - Barcos.png': 6, // Organize sua Viagem
  '/uploads/icones/Transportadoras.png': 16, // Transportadoras
  '/uploads/icones/Serviço Emergência.png': 14, // Apoio e Emergência
  '/uploads/icones/icone-1769618756388-504815632.png': 12, // Onde Comprar (chute educado)
};

async function mapIconeUrls() {
  console.log('🔄 Mapeamento manual de URLs de ícones\n');
  console.log('Este script irá atualizar as unidades para usar as URLs corretas dos ícones.\n');

  try {
    // 1. Buscar todos os ícones
    const icones = await prisma.pROD_Icone.findMany();
    const iconesMap = new Map(icones.map(i => [i.id, i]));

    // 2. Mostrar o mapeamento que será aplicado
    console.log('📋 Mapeamento a ser aplicado:\n');

    let totalUnidades = 0;
    const mappingDetails = [];

    for (const [urlAntiga, iconeId] of Object.entries(MANUAL_MAPPING)) {
      const icone = iconesMap.get(iconeId);
      if (!icone) {
        console.log(`⚠️  AVISO: Ícone ID ${iconeId} não encontrado!`);
        continue;
      }

      const count = await prisma.pROD_UnidadeTuristica.count({
        where: { icone_url: urlAntiga }
      });

      const oldFileName = path.basename(urlAntiga);
      const newFileName = path.basename(icone.url);

      mappingDetails.push({
        urlAntiga,
        urlNova: icone.url,
        count,
        iconeName: icone.nome
      });

      totalUnidades += count;

      console.log(`   ${count} unidade(s): ${oldFileName}`);
      console.log(`   → "${icone.nome}" (${newFileName})\n`);
    }

    console.log(`📊 Total de unidades a serem atualizadas: ${totalUnidades}\n`);

    if (totalUnidades === 0) {
      console.log('ℹ️  Nenhuma unidade precisa ser atualizada.');
      return;
    }

    // 3. Confirmar com o usuário
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const resposta = await new Promise((resolve) => {
      rl.question('Deseja prosseguir com as atualizações? (s/N): ', resolve);
    });
    rl.close();

    if (resposta.toLowerCase() !== 's' && resposta.toLowerCase() !== 'sim') {
      console.log('\n❌ Operação cancelada pelo usuário');
      return;
    }

    // 4. Aplicar as atualizações
    console.log('\n🔄 Aplicando atualizações...\n');

    let totalAtualizado = 0;
    for (const detail of mappingDetails) {
      if (detail.count === 0) continue;

      const result = await prisma.pROD_UnidadeTuristica.updateMany({
        where: { icone_url: detail.urlAntiga },
        data: { icone_url: detail.urlNova }
      });

      console.log(`✅ ${result.count} unidade(s) atualizadas para "${detail.iconeName}"`);
      totalAtualizado += result.count;
    }

    console.log(`\n✅ Sincronização concluída! Total: ${totalAtualizado} unidades atualizadas`);

    // 5. Verificar se ainda há unidades sem ícone registrado
    console.log('\n🔍 Verificando unidades restantes...\n');

    // Buscar unidades com ícones não registrados usando Prisma ORM
    const todasUnidades = await prisma.pROD_UnidadeTuristica.findMany({
      where: {
        icone_url: { not: null }
      },
      select: { icone_url: true }
    });

    const iconesRegistrados = new Set(icones.map(i => i.url));
    const urlsNaoRegistradas = {};

    todasUnidades.forEach(u => {
      if (!iconesRegistrados.has(u.icone_url)) {
        urlsNaoRegistradas[u.icone_url] = (urlsNaoRegistradas[u.icone_url] || 0) + 1;
      }
    });

    const unidadesRestantes = Object.entries(urlsNaoRegistradas)
      .map(([icone_url, count]) => ({ icone_url, count: BigInt(count) }))
      .sort((a, b) => Number(b.count - a.count));

    if (unidadesRestantes.length > 0) {
      console.log('⚠️  Ainda existem unidades com ícones não mapeados:\n');
      unidadesRestantes.forEach(row => {
        console.log(`   ${row.count} unidade(s): ${path.basename(row.icone_url)}`);
      });
      console.log('\n💡 Essas unidades precisam ser editadas manualmente no /admin');
    } else {
      console.log('✅ Todas as unidades agora estão usando ícones registrados!');
    }

  } catch (error) {
    console.error('❌ Erro durante o mapeamento:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
mapIconeUrls()
  .then(() => {
    console.log('\n✅ Script finalizado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
