// Script para normalizar nomes de unidades turísticas
// Converte MAIÚSCULAS para Title Case, preservando abreviações
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Lista de abreviações que devem permanecer em MAIÚSCULAS
const ABREVIACOES = [
  'UPA', 'UBS', 'USF', 'CAPS', 'SAMU', 'SUS',
  'LTDA', 'ME', 'EPP', 'SA', 'S.A.', 'S/A',
  'AGETRAT', 'INSS', 'DETRAN', 'PROCON',
  'CEI', 'CRAS', 'CREAS', 'ONG', 'ONGs',
  'RH', 'TI', 'GPS', 'CNPJ', 'CPF',
  'II', 'III', 'IV', 'VI', 'VII', 'VIII', 'IX',
  'MS', 'SP', 'RJ', 'MG', 'PR', 'SC', 'RS', // Estados
  'BR', // Brasil
];

// Palavras que devem ficar em minúsculas (preposições, artigos, conjunções)
const PALAVRAS_MINUSCULAS = [
  'de', 'da', 'do', 'das', 'dos',
  'e', 'ou',
  'a', 'o', 'as', 'os',
  'em', 'no', 'na', 'nos', 'nas',
  'para', 'por', 'com', 'sem',
  'à', 'ao', 'aos', 'às'
];

/**
 * Converte texto para Title Case preservando abreviações
 * @param {boolean} forcar - Se true, processa mesmo textos já em formato misto
 */
function toTitleCase(texto, forcar = false) {
  if (!texto) return texto;

  // Se não forçar e já está em formato misto, retorna como está
  if (!forcar) {
    const temMinusculas = /[a-z]/.test(texto);
    const temMaiusculas = /[A-Z]/.test(texto);
    if (temMinusculas && temMaiusculas) {
      return texto; // Já está em formato misto, não altera
    }
  }

  // Divide em palavras
  const palavras = texto.split(/\s+/);

  const palavrasFormatadas = palavras.map((palavra, index) => {
    // Mantém pontuação
    const pontuacao = palavra.match(/[.,;:!?()[\]{}"""'']+$/);
    const palavraSemPont = palavra.replace(/[.,;:!?()[\]{}"""'']+$/g, '');

    // PRIMEIRO: Verifica se é preposição/artigo (prioridade máxima)
    const palavraMinuscula = palavraSemPont.toLowerCase();
    if (index > 0 && PALAVRAS_MINUSCULAS.includes(palavraMinuscula)) {
      return palavraMinuscula + (pontuacao ? pontuacao[0] : '');
    }

    // Verifica se é abreviação conhecida (lista predefinida)
    if (ABREVIACOES.includes(palavraSemPont.toUpperCase())) {
      return palavraSemPont.toUpperCase() + (pontuacao ? pontuacao[0] : '');
    }

    // Verifica se é uma sigla real (2-4 letras, SEM vogais intercaladas)
    // Ex: RJ, MS, CRP, HPO são siglas; mas RAIO, JOEL, GRILL não são
    const eSigla = /^[A-Z]{2,4}$/.test(palavraSemPont) &&
                   !/[A-Z][aeiou][A-Z]|[aeiou][A-Z][aeiou]/i.test(palavraSemPont);
    if (eSigla) {
      return palavraSemPont + (pontuacao ? pontuacao[0] : '');
    }

    // Converte para Title Case
    const resultado = palavraSemPont.charAt(0).toUpperCase() + palavraSemPont.slice(1).toLowerCase();
    return resultado + (pontuacao ? pontuacao[0] : '');
  });

  return palavrasFormatadas.join(' ');
}

async function normalizarNomes(forcarRenormalizacao = true) {
  try {
    console.log('🔍 Buscando unidades para normalizar...\n');
    if (forcarRenormalizacao) {
      console.log('⚙️  Modo: FORÇAR renormalização (processa todas as unidades)\n');
    }

    // Buscar todas as unidades
    const unidades = await prisma.pROD_UnidadeTuristica.findMany({
      select: {
        id: true,
        nome: true,
        nome_fantasia: true,
        razao_social: true,
        setor: true,
      },
      orderBy: { id: 'asc' }
    });

    console.log(`✅ Encontradas ${unidades.length} unidades no total\n`);

    let atualizados = 0;
    let semAlteracao = 0;
    const alteracoes = [];

    for (const unidade of unidades) {
      let precisaAtualizar = false;
      const updateData = {};

      // Verificar e normalizar NOME
      if (unidade.nome) {
        const nomeNormalizado = toTitleCase(unidade.nome, forcarRenormalizacao);
        if (nomeNormalizado !== unidade.nome) {
          updateData.nome = nomeNormalizado;
          precisaAtualizar = true;
          alteracoes.push({
            id: unidade.id,
            campo: 'nome',
            antes: unidade.nome,
            depois: nomeNormalizado
          });
        }
      }

      // Verificar e normalizar NOME_FANTASIA
      if (unidade.nome_fantasia) {
        const nomeFantasiaNormalizado = toTitleCase(unidade.nome_fantasia, forcarRenormalizacao);
        if (nomeFantasiaNormalizado !== unidade.nome_fantasia) {
          updateData.nome_fantasia = nomeFantasiaNormalizado;
          precisaAtualizar = true;
          alteracoes.push({
            id: unidade.id,
            campo: 'nome_fantasia',
            antes: unidade.nome_fantasia,
            depois: nomeFantasiaNormalizado
          });
        }
      }

      // Verificar e normalizar RAZAO_SOCIAL
      if (unidade.razao_social) {
        const razaoSocialNormalizada = toTitleCase(unidade.razao_social, forcarRenormalizacao);
        if (razaoSocialNormalizada !== unidade.razao_social) {
          updateData.razao_social = razaoSocialNormalizada;
          precisaAtualizar = true;
          alteracoes.push({
            id: unidade.id,
            campo: 'razao_social',
            antes: unidade.razao_social,
            depois: razaoSocialNormalizada
          });
        }
      }

      // Verificar e normalizar SETOR
      if (unidade.setor) {
        const setorNormalizado = toTitleCase(unidade.setor, forcarRenormalizacao);
        if (setorNormalizado !== unidade.setor) {
          updateData.setor = setorNormalizado;
          precisaAtualizar = true;
          alteracoes.push({
            id: unidade.id,
            campo: 'setor',
            antes: unidade.setor,
            depois: setorNormalizado
          });
        }
      }

      // Atualizar se necessário
      if (precisaAtualizar) {
        await prisma.pROD_UnidadeTuristica.update({
          where: { id: unidade.id },
          data: updateData
        });
        atualizados++;
      } else {
        semAlteracao++;
      }
    }

    // Exibir alterações
    console.log('─'.repeat(80));
    console.log('📝 ALTERAÇÕES REALIZADAS:\n');

    if (alteracoes.length > 0) {
      alteracoes.forEach(alt => {
        console.log(`ID ${alt.id} - ${alt.campo}:`);
        console.log(`  ANTES: ${alt.antes}`);
        console.log(`  DEPOIS: ${alt.depois}`);
        console.log('');
      });
    } else {
      console.log('✅ Nenhuma alteração necessária!\n');
    }

    // Resumo
    console.log('─'.repeat(80));
    console.log('📊 RESUMO DA NORMALIZAÇÃO');
    console.log('─'.repeat(80));
    console.log(`Total de unidades: ${unidades.length}`);
    console.log(`✅ Atualizadas: ${atualizados}`);
    console.log(`➖ Sem alteração: ${semAlteracao}`);
    console.log(`📝 Total de campos alterados: ${alteracoes.length}`);
    console.log('─'.repeat(80));

  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
normalizarNomes()
  .then(() => {
    console.log('\n✅ Normalização concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Falha na normalização:', error);
    process.exit(1);
  });
