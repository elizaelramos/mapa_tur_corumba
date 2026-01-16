/**
 * Script para analisar e identificar arquivos desnecessários no projeto
 * Categoriza arquivos por tipo e sugere remoção
 */

const fs = require('fs').promises;
const path = require('path');

// Categorias de arquivos
const CATEGORIAS = {
  TEST_DEBUG: {
    nome: '🧪 Arquivos de Teste/Debug (ROOT)',
    descricao: 'Scripts temporários de teste e debug na raiz do projeto',
    acao: 'REMOVER',
    arquivos: []
  },
  MIGRATION_SCRIPTS: {
    nome: '📦 Scripts de Migração Única',
    descricao: 'Scripts que já foram executados e não serão mais necessários',
    acao: 'MOVER_PARA_ARQUIVO',
    arquivos: []
  },
  DUPLICATE_MERGE: {
    nome: '🔄 Scripts de Merge de Duplicatas',
    descricao: 'Múltiplas versões de scripts de merge (mesclar-unidades-duplicadas-X.js)',
    acao: 'CONSOLIDAR',
    arquivos: []
  },
  ETL_SCRIPTS: {
    nome: '📥 Scripts ETL Python',
    descricao: 'Scripts de extração e processamento de dados (podem ser arquivados se ETL estiver completo)',
    acao: 'REVISAR',
    arquivos: []
  },
  IMPORT_SCRIPTS: {
    nome: '💾 Scripts de Importação SQL',
    descricao: 'Scripts SQL de importação que já foram executados',
    acao: 'MOVER_PARA_ARQUIVO',
    arquivos: []
  },
  TEST_SCRIPTS: {
    nome: '🔍 Scripts de Teste (em /scripts)',
    descricao: 'Scripts de teste e validação',
    acao: 'REVISAR',
    arquivos: []
  },
  ANALISE_SCRIPTS: {
    nome: '📊 Scripts de Análise',
    descricao: 'Scripts de análise e diagnóstico (úteis para manutenção)',
    acao: 'MANTER',
    arquivos: []
  },
  POPULATE_SCRIPTS: {
    nome: '🌱 Scripts de População de Dados',
    descricao: 'Scripts que populam dados iniciais',
    acao: 'REVISAR',
    arquivos: []
  },
  UTILITY_SCRIPTS: {
    nome: '🛠️ Scripts Utilitários',
    descricao: 'Scripts úteis para administração',
    acao: 'MANTER',
    arquivos: []
  }
};

// Padrões de arquivos na raiz
const ARQUIVOS_ROOT = {
  TEST_DEBUG: [
    'check-audit.js',
    'check-bartolomeu.js',
    'check-icons.js',
    'check-production.js',
    'check-staging-713.js',
    'check-timestamps.js',
    'final-test.js',
    'fix-cem-icon.js',
    'test-icon-upload.js',
    'test-path-debug.js',
    'test-trigger.js',
    'update-icons.js',
    'update-production-icon.js',
    'validate-bartolomeu.js'
  ]
};

// Padrões de arquivos em /scripts
const ARQUIVOS_SCRIPTS = {
  MIGRATION_SCRIPTS: [
    'apply-migration-medico.js',
    'migrate-add-imagem-url.js',
    'migrate-especialidade-mapeamento.js',
    'apply-triggers.js'
  ],
  DUPLICATE_MERGE: [
    'mesclar-unidades-duplicadas.js',
    'mesclar-unidades-duplicadas-2.js',
    'mesclar-unidades-duplicadas-3.js',
    'mesclar-unidades-duplicadas-4.js',
    'mesclar-unidades-duplicadas-5.js',
    'mesclar-unidades-duplicadas-6.js',
    'mesclar-unidades-duplicadas-7.js',
    'mesclar-unidades-duplicadas-8.js'
  ],
  ETL_SCRIPTS: [
    'extract_pdf_tables.py',
    'extract_pdf_text.py',
    'extract_with_tabula.py',
    'fetch_cnes_addresses.py',
    'generate_unidades_cnes.py',
    'generate_unidades_final_csv.py',
    'parse_profissionais_text.py',
    'clean_profissionais_parsed.py',
    'merge_whatsapp.py',
    'retry_missing_cnes.py',
    'analise-profissionais-csv.js'
  ],
  IMPORT_SCRIPTS: [
    'import_profissionais_mysql.sql',
    'import_profissionais_safe.sql',
    'import_profissionais_safe_mysql.sql',
    'import_unidades_safe.sql'
  ],
  TEST_SCRIPTS: [
    'test-import-profissionais.js',
    'test-import-unidades.js',
    'test-mysql-connection.js',
    'test-postgres-connection.js'
  ],
  ANALISE_SCRIPTS: [
    'analise-duplicacoes.js',
    'analise-especialidades.js',
    'analise-staging-detalhada.js',
    'analise-tabelas-utilizacao.js',
    'check-database-status.js',
    'check-especialidades-unidades.js',
    'check-unidade-imagem.js',
    'check-unidades-sem-especialidades.js'
  ],
  POPULATE_SCRIPTS: [
    'popular-especialidades-unidades.js',
    'popular-especialidades.js',
    'populate-especialidades.js',
    'populate-junction-unidade-medico.js',
    'setup-database.js'
  ],
  UTILITY_SCRIPTS: [
    'atualizar-bairros.js',
    'atualizar-imagem-cem.js',
    'atualizar-imagem-unidade.js',
    'create-admin-quick.js',
    'create-superadmin.js',
    'listar-bairros.js',
    'reprocessar-unidade.js',
    'reset-admin-password.js'
  ]
};

async function verificarArquivoExiste(baseDir, arquivo) {
  try {
    await fs.access(path.join(baseDir, arquivo));
    return true;
  } catch {
    return false;
  }
}

async function obterTamanhoArquivo(caminho) {
  try {
    const stats = await fs.stat(caminho);
    return stats.size;
  } catch {
    return 0;
  }
}

function formatarBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function analisarArquivos() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║          ANÁLISE DE ARQUIVOS DESNECESSÁRIOS NO PROJETO       ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const baseDir = process.cwd();
  let totalArquivosParaRemover = 0;
  let totalTamanhoParaRemover = 0;

  // Analisar arquivos na raiz
  console.log('📁 ARQUIVOS NA RAIZ DO PROJETO:\n');
  
  for (const arquivo of ARQUIVOS_ROOT.TEST_DEBUG) {
    const existe = await verificarArquivoExiste(baseDir, arquivo);
    if (existe) {
      const tamanho = await obterTamanhoArquivo(path.join(baseDir, arquivo));
      CATEGORIAS.TEST_DEBUG.arquivos.push({ nome: arquivo, tamanho, local: 'root' });
      totalArquivosParaRemover++;
      totalTamanhoParaRemover += tamanho;
    }
  }

  // Analisar arquivos em /scripts
  console.log('📁 ARQUIVOS EM /scripts:\n');
  
  for (const [categoria, arquivos] of Object.entries(ARQUIVOS_SCRIPTS)) {
    for (const arquivo of arquivos) {
      const existe = await verificarArquivoExiste(path.join(baseDir, 'scripts'), arquivo);
      if (existe) {
        const tamanho = await obterTamanhoArquivo(path.join(baseDir, 'scripts', arquivo));
        CATEGORIAS[categoria].arquivos.push({ nome: arquivo, tamanho, local: 'scripts' });
        
        if (CATEGORIAS[categoria].acao === 'REMOVER' || CATEGORIAS[categoria].acao === 'MOVER_PARA_ARQUIVO') {
          totalArquivosParaRemover++;
          totalTamanhoParaRemover += tamanho;
        }
      }
    }
  }

  // Exibir resultados por categoria
  console.log('═'.repeat(80) + '\n');
  console.log('📋 RESULTADOS POR CATEGORIA:\n');

  for (const [key, categoria] of Object.entries(CATEGORIAS)) {
    if (categoria.arquivos.length === 0) continue;

    const iconeAcao = {
      'REMOVER': '🗑️',
      'MOVER_PARA_ARQUIVO': '📦',
      'CONSOLIDAR': '🔄',
      'REVISAR': '⚠️',
      'MANTER': '✅'
    }[categoria.acao];

    console.log(`${iconeAcao} ${categoria.nome}`);
    console.log(`   ${categoria.descricao}`);
    console.log(`   Ação recomendada: ${categoria.acao}`);
    console.log(`   Arquivos encontrados: ${categoria.arquivos.length}\n`);

    const tamanhoTotal = categoria.arquivos.reduce((sum, f) => sum + f.tamanho, 0);
    
    for (const arquivo of categoria.arquivos) {
      const localFormatado = arquivo.local === 'root' ? '/' : '/scripts/';
      console.log(`   - ${localFormatado}${arquivo.nome} (${formatarBytes(arquivo.tamanho)})`);
    }
    console.log(`   Total: ${formatarBytes(tamanhoTotal)}\n`);
  }

  // Resumo e recomendações
  console.log('═'.repeat(80) + '\n');
  console.log('📊 RESUMO E RECOMENDAÇÕES:\n');

  console.log(`Total de arquivos que podem ser removidos: ${totalArquivosParaRemover}`);
  console.log(`Espaço total que pode ser liberado: ${formatarBytes(totalTamanhoParaRemover)}\n`);

  // Recomendações específicas
  console.log('💡 RECOMENDAÇÕES DETALHADAS:\n');

  console.log('1️⃣ REMOVER IMEDIATAMENTE (Arquivos de teste/debug na raiz):');
  console.log('   Arquivos temporários criados durante desenvolvimento.');
  console.log('   Comando: rm check-*.js test-*.js fix-*.js update-*.js validate-*.js final-test.js\n');

  console.log('2️⃣ MOVER PARA ARQUIVO (Scripts de migração e importação):');
  console.log('   Scripts que já foram executados e não serão mais necessários.');
  console.log('   Sugestão: Criar pasta scripts/archive/ e mover para lá.\n');

  console.log('3️⃣ CONSOLIDAR (Scripts de merge duplicados):');
  console.log('   8 versões de mesclar-unidades-duplicadas-X.js');
  console.log('   Sugestão: Manter apenas a versão mais recente (-8.js) e arquivar as outras.\n');

  console.log('4️⃣ REVISAR (Scripts ETL Python):');
  console.log('   Se o processo ETL estiver completo, podem ser arquivados.');
  console.log('   Se ainda estiver em uso, manter.\n');

  console.log('5️⃣ MANTER (Scripts úteis):');
  console.log('   - Scripts de análise (úteis para diagnóstico)');
  console.log('   - Scripts utilitários (create-admin, reset-password, etc.)');
  console.log('   - Scripts de atualização de dados\n');

  // Gerar script de limpeza
  console.log('═'.repeat(80) + '\n');
  console.log('🤖 SCRIPTS DE LIMPEZA SUGERIDOS:\n');

  console.log('# Criar diretório de arquivo');
  console.log('New-Item -ItemType Directory -Force -Path "scripts/archive"\n');

  console.log('# Remover arquivos de teste/debug da raiz');
  const arquivosRoot = CATEGORIAS.TEST_DEBUG.arquivos.map(f => f.nome).join(', ');
  if (arquivosRoot) {
    console.log(`Remove-Item ${arquivosRoot}\n`);
  }

  console.log('# Mover scripts de migração para arquivo');
  const migrationFiles = CATEGORIAS.MIGRATION_SCRIPTS.arquivos.map(f => `"scripts/${f.nome}"`).join(', ');
  if (migrationFiles) {
    console.log(`Move-Item ${migrationFiles} -Destination "scripts/archive/"\n`);
  }

  console.log('# Mover scripts de importação SQL para arquivo');
  const importFiles = CATEGORIAS.IMPORT_SCRIPTS.arquivos.map(f => `"scripts/${f.nome}"`).join(', ');
  if (importFiles) {
    console.log(`Move-Item ${importFiles} -Destination "scripts/archive/"\n`);
  }

  console.log('# Mover versões antigas de mesclar-unidades-duplicadas para arquivo');
  const mergeOldFiles = CATEGORIAS.DUPLICATE_MERGE.arquivos
    .filter(f => !f.nome.includes('-8.js'))
    .map(f => `"scripts/${f.nome}"`).join(', ');
  if (mergeOldFiles) {
    console.log(`Move-Item ${mergeOldFiles} -Destination "scripts/archive/"\n`);
  }

  // Salvar relatório
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const relatorio = {
    dataAnalise: new Date().toISOString(),
    totalArquivos: totalArquivosParaRemover,
    tamanhoTotal: totalTamanhoParaRemover,
    categorias: Object.entries(CATEGORIAS).map(([key, cat]) => ({
      nome: cat.nome,
      acao: cat.acao,
      arquivos: cat.arquivos.length,
      detalhes: cat.arquivos
    }))
  };

  const nomeArquivo = `analise-arquivos-desnecessarios-${timestamp}.json`;
  const caminhoRelatorio = path.join(baseDir, 'logs', nomeArquivo);

  try {
    await fs.mkdir(path.join(baseDir, 'logs'), { recursive: true });
    await fs.writeFile(caminhoRelatorio, JSON.stringify(relatorio, null, 2));
    console.log(`💾 Relatório completo salvo em: logs/${nomeArquivo}\n`);
  } catch (error) {
    console.error('Erro ao salvar relatório:', error.message);
  }
}

analisarArquivos()
  .catch(error => {
    console.error('\n❌ Erro na análise:', error);
    process.exit(1);
  });
