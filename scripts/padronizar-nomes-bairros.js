/**
 * Script para padronizar nomes de bairros
 * 
 * Converte textos em maiúsculas para formato Title Case,
 * mantendo siglas conhecidas em maiúsculas
 */

import { PrismaClient } from '@mapatur/database';

const prisma = new PrismaClient();

// Lista de siglas e abreviações que devem permanecer em MAIÚSCULAS
const SIGLAS = [
  'CEMEI',
  'EMEI',
  'EMEB',
  'UBS',
  'ESF',
  'CRAS',
  'CREAS',
  'CEU',
  'EE',
  'EM',
  'EMEIEF',
  'EMEIF',
  'CEI',
  'CIEP',
  'EMEF',
  'EMEFTI',
  'EMEBS',
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'
];

// Preposições e artigos que devem ficar em minúsculas (exceto no início)
const PALAVRAS_MINUSCULAS = [
  'de', 'da', 'do', 'das', 'dos',
  'e', 'a', 'o', 'as', 'os',
  'em', 'na', 'no', 'nas', 'nos',
  'para', 'com', 'por'
];

/**
 * Converte uma string para Title Case com regras especiais
 * @param {string} texto - Texto a ser convertido
 * @returns {string} Texto padronizado
 */
function padronizarTexto(texto) {
  if (!texto || typeof texto !== 'string') return texto;
  
  // Remove espaços extras
  texto = texto.trim().replace(/\s+/g, ' ');
  
  // Converte para lowercase primeiro
  texto = texto.toLowerCase();
  
  // Divide em palavras
  const palavras = texto.split(' ');
  
  // Processa cada palavra
  const palavrasProcessadas = palavras.map((palavra, index) => {
    // Verifica se é uma sigla conhecida
    const palavraUpper = palavra.toUpperCase();
    if (SIGLAS.includes(palavraUpper)) {
      return palavraUpper;
    }
    
    // Verifica se é uma palavra que deve ficar em minúscula
    // (exceto se for a primeira palavra)
    if (index > 0 && PALAVRAS_MINUSCULAS.includes(palavra.toLowerCase())) {
      return palavra.toLowerCase();
    }
    
    // Capitaliza a primeira letra
    return palavra.charAt(0).toUpperCase() + palavra.slice(1);
  });
  
  return palavrasProcessadas.join(' ');
}

async function main() {
  console.log('🔄 Iniciando padronização de nomes de bairros...\n');
  
  try {
    // Busca todos os bairros
    const bairros = await prisma.pROD_Bairro.findMany({
      select: {
        id: true,
        nome: true
      },
      orderBy: {
        nome: 'asc'
      }
    });
    
    console.log(`📊 Total de bairros encontrados: ${bairros.length}\n`);
    
    let atualizados = 0;
    let erros = 0;
    
    // Processa cada bairro
    for (const bairro of bairros) {
      try {
        const nomeOriginal = bairro.nome;
        const nomePadronizado = padronizarTexto(nomeOriginal);
        
        // Verifica se houve mudança
        if (nomeOriginal !== nomePadronizado) {
          // Atualiza no banco
          await prisma.pROD_Bairro.update({
            where: { id: bairro.id },
            data: {
              nome: nomePadronizado
            }
          });
          
          console.log(`✅ ID ${bairro.id}:`);
          console.log(`   "${nomeOriginal}"`);
          console.log(`   → "${nomePadronizado}"`);
          console.log('');
          
          atualizados++;
        }
      } catch (erro) {
        console.error(`❌ Erro ao processar bairro ID ${bairro.id}:`, erro.message);
        erros++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`✅ Padronização concluída!`);
    console.log(`   Total de bairros: ${bairros.length}`);
    console.log(`   Bairros atualizados: ${atualizados}`);
    console.log(`   Erros: ${erros}`);
    console.log('='.repeat(60));
    
  } catch (erro) {
    console.error('❌ Erro ao executar script:', erro);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
