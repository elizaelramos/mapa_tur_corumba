/**
 * Script para padronizar nomes de unidades e endereços
 * 
 * Converte textos em maiúsculas para formato Title Case,
 * mantendo siglas conhecidas em maiúsculas (CEMEI, EMEI, UBS, etc.)
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
  'EMEBS'
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
 * @param {boolean} isPrimeiraLinha - Se é a primeira linha (mantém artigos em maiúscula)
 * @returns {string} Texto padronizado
 */
function padronizarTexto(texto, isPrimeiraLinha = false) {
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

/**
 * Padroniza endereço (rua, avenida, etc.)
 * @param {string} endereco 
 * @returns {string}
 */
function padronizarEndereco(endereco) {
  if (!endereco) return endereco;
  
  // Lista de tipos de logradouro que devem ser capitalizados
  const tiposLogradouro = [
    'Rua', 'Avenida', 'Travessa', 'Alameda', 'Praça', 
    'Rodovia', 'Estrada', 'Viela', 'Beco', 'Largo'
  ];
  
  let enderecoProcessado = padronizarTexto(endereco);
  
  // Garante que tipos de logradouro estejam capitalizados corretamente
  tiposLogradouro.forEach(tipo => {
    const regex = new RegExp(`^${tipo.toLowerCase()}\\b`, 'i');
    if (regex.test(enderecoProcessado.toLowerCase())) {
      enderecoProcessado = enderecoProcessado.replace(regex, tipo);
    }
  });
  
  return enderecoProcessado;
}

async function main() {
  console.log('🔄 Iniciando padronização de nomes e endereços...\n');
  
  try {
    // Busca todas as unidades ativas
    const unidades = await prisma.pROD_Escola.findMany({
      select: {
        id: true,
        nome: true,
        endereco: true
      }
    });
    
    console.log(`📊 Total de unidades encontradas: ${unidades.length}\n`);
    
    let atualizadas = 0;
    let erros = 0;
    
    // Processa cada unidade
    for (const unidade of unidades) {
      try {
        const nomeOriginal = unidade.nome;
        const enderecoOriginal = unidade.endereco;
        
        const nomePadronizado = padronizarTexto(nomeOriginal);
        const enderecoPadronizado = padronizarEndereco(enderecoOriginal);
        
        // Verifica se houve mudança
        const nomeAlterado = nomeOriginal !== nomePadronizado;
        const enderecoAlterado = enderecoOriginal !== enderecoPadronizado;
        
        if (nomeAlterado || enderecoAlterado) {
          // Atualiza no banco
          await prisma.pROD_Escola.update({
            where: { id: unidade.id },
            data: {
              nome: nomePadronizado,
              endereco: enderecoPadronizado
            }
          });
          
          console.log(`✅ ID ${unidade.id}:`);
          if (nomeAlterado) {
            console.log(`   Nome:     "${nomeOriginal}"`);
            console.log(`          -> "${nomePadronizado}"`);
          }
          if (enderecoAlterado) {
            console.log(`   Endereço: "${enderecoOriginal}"`);
            console.log(`          -> "${enderecoPadronizado}"`);
          }
          console.log('');
          
          atualizadas++;
        }
      } catch (erro) {
        console.error(`❌ Erro ao processar unidade ID ${unidade.id}:`, erro.message);
        erros++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`✅ Padronização concluída!`);
    console.log(`   Total de unidades: ${unidades.length}`);
    console.log(`   Unidades atualizadas: ${atualizadas}`);
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
