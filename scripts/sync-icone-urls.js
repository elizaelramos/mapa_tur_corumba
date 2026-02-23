/**
 * Script para sincronizar URLs de ícones nas unidades turísticas
 *
 * Problema: Quando um ícone é atualizado (nova imagem), as unidades continuam
 * usando a URL antiga. Este script corrige isso atualizando as unidades para
 * usar as URLs atuais dos ícones.
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();

// Normaliza uma URL removendo origem quando existir (compara apenas o path)
const normalizePath = (url) => {
  if (!url) return '';
  try {
    if (url.startsWith('http')) {
      const parsed = new URL(url);
      return parsed.pathname + (parsed.search || '');
    }
  } catch (e) {
    // fallthrough
  }
  return url;
};

// Extrai o nome base do arquivo para comparação
const getBaseName = (url) => {
  if (!url) return '';
  const normalized = normalizePath(url);
  const fileName = path.basename(normalized);
  return fileName;
};

async function syncIconeUrls() {
  console.log('🔄 Iniciando sincronização de URLs de ícones...\n');

  try {
    // 1. Buscar todos os ícones registrados
    const icones = await prisma.pROD_Icone.findMany({
      where: { ativo: true },
    });

    console.log(`📋 Encontrados ${icones.length} ícones ativos\n`);

    // 2. Buscar todas as unidades turísticas
    const unidades = await prisma.pROD_UnidadeTuristica.findMany({
      where: {
        icone_url: { not: null },
      },
      select: {
        id: true,
        nome: true,
        icone_url: true,
      },
    });

    console.log(`📋 Encontradas ${unidades.length} unidades com ícones\n`);

    // 3. Criar mapa de URLs antigas -> URLs novas baseado em nomes similares
    const urlMap = new Map();

    // Para cada ícone, tentar identificar correspondências com base no nome do arquivo
    for (const icone of icones) {
      const iconeFileName = getBaseName(icone.url);

      // Se o nome do ícone contém informações úteis, usá-las para match
      const iconeNomeNormalizado = icone.nome.toLowerCase()
        .replace(/[^a-z0-9]/g, '');

      // Buscar unidades que possam estar usando este ícone com nome antigo
      for (const unidade of unidades) {
        const unidadeFileName = getBaseName(unidade.icone_url);
        const unidadeNomeNormalizado = unidadeFileName.toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .replace(/^icone-\d+-\d+/, ''); // Remove timestamp dos ícones gerados

        // Comparar nomes normalizados
        if (unidadeFileName !== iconeFileName &&
            (unidadeFileName.toLowerCase().includes(iconeNomeNormalizado) ||
             iconeNomeNormalizado.includes(unidadeNomeNormalizado) ||
             // Match por nome exato do arquivo (sem extensão)
             unidadeFileName.replace(/\.[^.]+$/, '').toLowerCase() ===
             icone.nome.toLowerCase().replace(/[^a-z0-9]/g, ''))) {

          if (!urlMap.has(unidade.icone_url)) {
            urlMap.set(unidade.icone_url, icone.url);
            console.log(`🔗 Mapeamento: "${unidadeFileName}" -> "${iconeFileName}" (${icone.nome})`);
          }
        }
      }
    }

    console.log(`\n📊 Total de mapeamentos encontrados: ${urlMap.size}\n`);

    // 4. Exibir preview das mudanças
    if (urlMap.size > 0) {
      console.log('📝 Preview das atualizações:\n');

      let totalUnidadesAfetadas = 0;
      for (const [urlAntiga, urlNova] of urlMap.entries()) {
        const count = unidades.filter(u => normalizePath(u.icone_url) === normalizePath(urlAntiga)).length;
        totalUnidadesAfetadas += count;
        console.log(`   ${count} unidade(s): ${getBaseName(urlAntiga)} -> ${getBaseName(urlNova)}`);
      }

      console.log(`\n📊 Total de unidades que serão atualizadas: ${totalUnidadesAfetadas}\n`);

      // 5. Perguntar confirmação
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const resposta = await new Promise((resolve) => {
        readline.question('Deseja prosseguir com as atualizações? (s/N): ', resolve);
      });
      readline.close();

      if (resposta.toLowerCase() !== 's' && resposta.toLowerCase() !== 'sim') {
        console.log('\n❌ Operação cancelada pelo usuário');
        return;
      }

      // 6. Aplicar atualizações
      console.log('\n🔄 Aplicando atualizações...\n');
      let totalAtualizado = 0;

      for (const [urlAntiga, urlNova] of urlMap.entries()) {
        const result = await prisma.pROD_UnidadeTuristica.updateMany({
          where: {
            icone_url: urlAntiga,
          },
          data: {
            icone_url: urlNova,
          },
        });

        if (result.count > 0) {
          console.log(`   ✅ ${result.count} unidade(s) atualizada(s): ${getBaseName(urlAntiga)} -> ${getBaseName(urlNova)}`);
          totalAtualizado += result.count;
        }
      }

      console.log(`\n✅ Sincronização concluída! Total de unidades atualizadas: ${totalAtualizado}`);
    } else {
      console.log('ℹ️  Nenhuma atualização necessária. Todas as unidades já estão sincronizadas.');
    }

  } catch (error) {
    console.error('❌ Erro durante a sincronização:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
syncIconeUrls()
  .then(() => {
    console.log('\n✅ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
