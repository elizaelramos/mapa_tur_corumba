/**
 * Script para verificar sincronização de URLs de ícones
 * Apenas exibe o estado atual, sem fazer alterações
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkIconeSync() {
  console.log('🔍 Verificando sincronização de ícones...\n');

  try {
    // 1. Buscar todos os ícones registrados
    const icones = await prisma.pROD_Icone.findMany({
      orderBy: { nome: 'asc' },
    });

    console.log(`📋 Ícones registrados no sistema (${icones.length}):\n`);
    icones.forEach((icone, index) => {
      console.log(`${index + 1}. ${icone.nome}`);
      console.log(`   ID: ${icone.id}`);
      console.log(`   URL: ${icone.url}`);
      console.log(`   Ativo: ${icone.ativo ? 'Sim' : 'Não'}`);
      console.log('');
    });

    // 2. Buscar todas as URLs de ícones únicas usadas pelas unidades
    const unidades = await prisma.pROD_UnidadeTuristica.findMany({
      where: {
        icone_url: { not: null },
      },
      select: {
        icone_url: true,
      },
    });

    // Agrupar por URL
    const urlCounts = {};
    unidades.forEach(u => {
      if (u.icone_url) {
        urlCounts[u.icone_url] = (urlCounts[u.icone_url] || 0) + 1;
      }
    });

    console.log(`\n📊 URLs de ícones usadas pelas unidades (${Object.keys(urlCounts).length} URLs únicas):\n`);

    const iconeUrls = new Set(icones.map(i => i.url));

    Object.entries(urlCounts)
      .sort((a, b) => b[1] - a[1]) // Ordenar por quantidade
      .forEach(([url, count]) => {
        const isRegistered = iconeUrls.has(url);
        const status = isRegistered ? '✅' : '⚠️';
        const fileName = path.basename(url);

        console.log(`${status} ${fileName}`);
        console.log(`   URL: ${url}`);
        console.log(`   Usado por: ${count} unidade(s)`);

        if (!isRegistered) {
          console.log(`   ❌ PROBLEMA: Esta URL não está registrada na tabela de ícones!`);

          // Tentar sugerir correspondência
          const similarIcone = icones.find(i => {
            const iNome = i.nome.toLowerCase().replace(/[^a-z0-9]/g, '');
            const fNome = fileName.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/\.png$/, '');
            return iNome.includes(fNome) || fNome.includes(iNome);
          });

          if (similarIcone) {
            console.log(`   💡 Sugestão: Pode ser "${similarIcone.nome}" (ID: ${similarIcone.id})`);
            console.log(`      URL atual: ${similarIcone.url}`);
          }
        }
        console.log('');
      });

    // 3. Resumo
    const urlsNaoRegistradas = Object.keys(urlCounts).filter(url => !iconeUrls.has(url));
    const unidadesAfetadas = urlsNaoRegistradas.reduce((sum, url) => sum + urlCounts[url], 0);

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO:');
    console.log('='.repeat(60));
    console.log(`Total de ícones registrados: ${icones.length}`);
    console.log(`Total de URLs únicas em uso: ${Object.keys(urlCounts).length}`);
    console.log(`URLs não registradas: ${urlsNaoRegistradas.length}`);
    console.log(`Unidades afetadas: ${unidadesAfetadas}`);
    console.log('='.repeat(60) + '\n');

    if (unidadesAfetadas > 0) {
      console.log('⚠️  ATENÇÃO: Existem unidades usando URLs de ícones não registradas!');
      console.log('   Isso acontece quando um ícone é atualizado mas as unidades não são sincronizadas.\n');
      console.log('💡 SOLUÇÃO: Edite cada unidade afetada no /admin e reselecione o ícone correto.');
      console.log('   Ou execute o script sync-icone-urls.js para tentar sincronizar automaticamente.\n');
    } else {
      console.log('✅ Todas as unidades estão usando URLs de ícones registradas!');
    }

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
checkIconeSync()
  .then(() => {
    console.log('✅ Verificação concluída\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
