/**
 * Script para análise de utilização de tabelas do banco de dados
 * Identifica tabelas que podem não estar sendo utilizadas no código
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

// Tabelas definidas no schema.prisma
const TABELAS_SCHEMA = [
  // STAGING
  { nome: 'STAGING_Info_Origem', categoria: 'STAGING', prismaModel: 'sTAGING_Info_Origem' },
  
  // PRODUCTION
  { nome: 'PROD_Unidade_Saude', categoria: 'PRODUCTION', prismaModel: 'pROD_Unidade_Saude' },
  { nome: 'PROD_Medico', categoria: 'PRODUCTION', prismaModel: 'pROD_Medico' },
  { nome: 'PROD_Especialidade', categoria: 'PRODUCTION', prismaModel: 'pROD_Especialidade' },
  { nome: 'PROD_Unidade_RedeSocial', categoria: 'PRODUCTION', prismaModel: 'pROD_Unidade_RedeSocial' },
  { nome: 'PROD_Bairro', categoria: 'PRODUCTION', prismaModel: 'pROD_Bairro' },
  { nome: 'PROD_Icone', categoria: 'PRODUCTION', prismaModel: 'pROD_Icone' },
  
  // JUNCTION
  { nome: 'Junction_Unidade_Especialidade', categoria: 'JUNCTION', prismaModel: 'junction_Unidade_Especialidade' },
  { nome: 'Junction_Medico_Especialidade', categoria: 'JUNCTION', prismaModel: 'junction_Medico_Especialidade' },
  { nome: 'Junction_Unidade_Medico', categoria: 'JUNCTION', prismaModel: 'junction_Unidade_Medico' },
  
  // NORMALIZATION
  { nome: 'Especialidade_Mapeamento', categoria: 'NORMALIZATION', prismaModel: 'especialidade_Mapeamento' },
  
  // USER MANAGEMENT
  { nome: 'User', categoria: 'USER_MANAGEMENT', prismaModel: 'user' },
  
  // AUDIT
  { nome: 'AUDIT_LOG', categoria: 'AUDIT', prismaModel: 'aUDIT_LOG' },
  
  // ETL
  { nome: 'ETL_Execution', categoria: 'ETL', prismaModel: 'eTL_Execution' },
];

// Diretórios para buscar referências
const DIRETORIOS_BUSCA = [
  'apps/api/src',
  'apps/etl-worker/src',
  'apps/web/src',
  'scripts',
];

/**
 * Busca recursivamente por arquivos JS/TS
 */
async function buscarArquivos(dir, baseDir = process.cwd()) {
  const fullPath = path.join(baseDir, dir);
  const arquivos = [];
  
  try {
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullEntryPath = path.join(fullPath, entry.name);
      const relativePath = path.relative(baseDir, fullEntryPath);
      
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
        const subFiles = await buscarArquivos(relativePath, baseDir);
        arquivos.push(...subFiles);
      } else if (entry.isFile() && /\.(js|jsx|ts|tsx)$/.test(entry.name)) {
        arquivos.push(relativePath);
      }
    }
  } catch (error) {
    console.error(`Erro ao ler diretório ${fullPath}:`, error.message);
  }
  
  return arquivos;
}

/**
 * Busca referências de uma tabela nos arquivos
 */
async function buscarReferencias(tabela, arquivos, baseDir = process.cwd()) {
  const referencias = [];
  const padroes = [
    new RegExp(`\\b${tabela.nome}\\b`, 'gi'),
    new RegExp(`\\bprisma\\.${tabela.prismaModel}\\b`, 'gi'),
    new RegExp(`\\b${tabela.prismaModel}\\b`, 'gi'),
  ];
  
  for (const arquivo of arquivos) {
    try {
      const fullPath = path.join(baseDir, arquivo);
      const conteudo = await fs.readFile(fullPath, 'utf-8');
      
      for (const padrao of padroes) {
        const matches = conteudo.match(padrao);
        if (matches && matches.length > 0) {
          referencias.push({
            arquivo,
            ocorrencias: matches.length,
            tipo: arquivo.includes('routes') ? 'API' : 
                  arquivo.includes('etl-worker') ? 'ETL' : 
                  arquivo.includes('web/src') ? 'FRONTEND' : 'SCRIPT'
          });
          break; // Não precisa verificar outros padrões para este arquivo
        }
      }
    } catch (error) {
      // Arquivo pode ter sido deletado ou inacessível
    }
  }
  
  return referencias;
}

/**
 * Verifica se a tabela existe no banco e retorna estatísticas
 */
async function verificarTabelaNoBanco(tabela) {
  try {
    // Tenta contar registros na tabela
    const query = `SELECT COUNT(*) as total FROM ${tabela.nome}`;
    const result = await prisma.$queryRawUnsafe(query);
    
    return {
      existe: true,
      totalRegistros: Number(result[0].total)
    };
  } catch (error) {
    return {
      existe: false,
      erro: error.message
    };
  }
}

/**
 * Gera relatório de utilização
 */
async function gerarRelatorio() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║      ANÁLISE DE UTILIZAÇÃO DE TABELAS DO BANCO DE DADOS      ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  console.log('📂 Buscando arquivos do projeto...\n');
  
  // Buscar todos os arquivos relevantes
  const todosArquivos = [];
  for (const dir of DIRETORIOS_BUSCA) {
    const arquivos = await buscarArquivos(dir);
    todosArquivos.push(...arquivos);
  }
  
  console.log(`✅ ${todosArquivos.length} arquivos encontrados\n`);
  console.log('═'.repeat(80));
  
  const resultados = [];
  
  for (const tabela of TABELAS_SCHEMA) {
    console.log(`\n🔍 Analisando: ${tabela.nome} (${tabela.categoria})`);
    
    // Buscar referências no código
    const referencias = await buscarReferencias(tabela, todosArquivos);
    
    // Verificar existência e dados no banco
    const statusBanco = await verificarTabelaNoBanco(tabela);
    
    const resultado = {
      tabela: tabela.nome,
      categoria: tabela.categoria,
      prismaModel: tabela.prismaModel,
      existeNoBanco: statusBanco.existe,
      totalRegistros: statusBanco.totalRegistros || 0,
      totalReferencias: referencias.length,
      referencias,
      utilizada: referencias.length > 0
    };
    
    resultados.push(resultado);
    
    // Exibir resumo
    console.log(`   📊 Banco: ${statusBanco.existe ? '✅ Existe' : '❌ Não existe'}`);
    if (statusBanco.existe) {
      console.log(`   📈 Registros: ${statusBanco.totalRegistros}`);
    }
    console.log(`   🔗 Referências: ${referencias.length} arquivo(s)`);
    
    if (referencias.length > 0) {
      const tipos = [...new Set(referencias.map(r => r.tipo))];
      console.log(`   📁 Tipos: ${tipos.join(', ')}`);
    } else {
      console.log(`   ⚠️  NENHUMA REFERÊNCIA ENCONTRADA NO CÓDIGO`);
    }
  }
  
  // Resumo final
  console.log('\n' + '═'.repeat(80));
  console.log('\n📋 RESUMO DA ANÁLISE\n');
  
  const tabelasNaoUtilizadas = resultados.filter(r => !r.utilizada && r.existeNoBanco);
  const tabelasComDados = resultados.filter(r => r.totalRegistros > 0);
  const tabelasVazias = resultados.filter(r => r.existeNoBanco && r.totalRegistros === 0);
  
  console.log(`Total de tabelas analisadas: ${resultados.length}`);
  console.log(`Tabelas com dados: ${tabelasComDados.length}`);
  console.log(`Tabelas vazias: ${tabelasVazias.length}`);
  console.log(`Tabelas SEM referências no código: ${tabelasNaoUtilizadas.length}`);
  
  if (tabelasNaoUtilizadas.length > 0) {
    console.log('\n⚠️  TABELAS POTENCIALMENTE NÃO UTILIZADAS:\n');
    
    for (const tabela of tabelasNaoUtilizadas) {
      console.log(`   • ${tabela.tabela}`);
      console.log(`     - Categoria: ${tabela.categoria}`);
      console.log(`     - Registros: ${tabela.totalRegistros}`);
      console.log(`     - Status: ${tabela.totalRegistros === 0 ? '🗑️  Vazia (pode ser removida)' : '⚠️  Contém dados (revisar antes de remover)'}`);
      console.log('');
    }
    
    console.log('💡 RECOMENDAÇÕES:');
    console.log('   1. Tabelas vazias sem referências podem ser removidas com segurança');
    console.log('   2. Tabelas com dados devem ser analisadas manualmente antes da remoção');
    console.log('   3. Verifique se não há queries SQL diretas (não pelo Prisma) usando essas tabelas');
    console.log('   4. Faça backup antes de remover qualquer tabela\n');
  } else {
    console.log('\n✅ Todas as tabelas estão sendo utilizadas no código!\n');
  }
  
  // Tabelas por categoria
  console.log('\n📊 ESTATÍSTICAS POR CATEGORIA:\n');
  
  const categorias = [...new Set(resultados.map(r => r.categoria))];
  for (const categoria of categorias) {
    const tabelasCategoria = resultados.filter(r => r.categoria === categoria);
    const utilizadas = tabelasCategoria.filter(r => r.utilizada).length;
    const total = tabelasCategoria.length;
    
    console.log(`   ${categoria}:`);
    console.log(`   - Total: ${total} tabelas`);
    console.log(`   - Utilizadas: ${utilizadas} (${Math.round(utilizadas/total*100)}%)`);
    console.log(`   - Não utilizadas: ${total - utilizadas}`);
    console.log('');
  }
  
  // Salvar relatório em JSON
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const nomeArquivo = `analise-tabelas-${timestamp}.json`;
  const caminhoRelatorio = path.join(process.cwd(), 'logs', nomeArquivo);
  
  try {
    await fs.mkdir(path.join(process.cwd(), 'logs'), { recursive: true });
    await fs.writeFile(caminhoRelatorio, JSON.stringify({
      dataAnalise: new Date().toISOString(),
      totalTabelas: resultados.length,
      tabelasNaoUtilizadas: tabelasNaoUtilizadas.map(t => t.tabela),
      detalhes: resultados
    }, null, 2));
    
    console.log(`\n💾 Relatório completo salvo em: ${nomeArquivo}\n`);
  } catch (error) {
    console.error('Erro ao salvar relatório:', error.message);
  }
}

// Executar análise
gerarRelatorio()
  .catch(error => {
    console.error('\n❌ Erro na análise:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
