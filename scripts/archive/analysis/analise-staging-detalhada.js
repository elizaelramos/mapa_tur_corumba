// Carregar variáveis de ambiente
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ============================================================================
// ANÁLISE DETALHADA DOS DADOS DE STAGING
// ============================================================================

/**
 * Calcula a distância de Levenshtein entre duas strings
 * Usada para detectar similaridade entre nomes
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  // Inicializar matriz
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Calcular distância
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calcula similaridade percentual entre duas strings (0-100%)
 */
function calcularSimilaridade(str1, str2) {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 100;

  const distance = levenshteinDistance(str1, str2);
  return ((maxLen - distance) / maxLen) * 100;
}

/**
 * Agrupa strings similares usando threshold de similaridade
 */
function agruparSimilares(items, threshold = 80) {
  const grupos = [];
  const processados = new Set();

  for (let i = 0; i < items.length; i++) {
    if (processados.has(items[i].nome)) continue;

    const grupo = {
      representante: items[i].nome,
      items: [items[i]],
      totalRegistros: items[i].count,
    };

    // Buscar itens similares
    for (let j = i + 1; j < items.length; j++) {
      if (processados.has(items[j].nome)) continue;

      const similaridade = calcularSimilaridade(items[i].nome, items[j].nome);

      if (similaridade >= threshold) {
        grupo.items.push(items[j]);
        grupo.totalRegistros += items[j].count;
        processados.add(items[j].nome);
      }
    }

    processados.add(items[i].nome);
    grupos.push(grupo);
  }

  return grupos.sort((a, b) => b.totalRegistros - a.totalRegistros);
}

/**
 * Análise principal
 */
async function analisarDados() {
  console.log('\n========================================');
  console.log('=== ANÁLISE DE DADOS STAGING ===');
  console.log('========================================\n');

  try {
    // 1. RESUMO GERAL
    console.log('📊 RESUMO GERAL:\n');

    const totalRegistros = await prisma.sTAGING_Info_Origem.count();
    console.log(`- Total de registros: ${totalRegistros}`);

    // Contar registros por status
    const porStatus = await prisma.sTAGING_Info_Origem.groupBy({
      by: ['status_processamento'],
      _count: true,
    });

    console.log('\n  Status dos registros:');
    porStatus.forEach(status => {
      console.log(`  - ${status.status_processamento}: ${status._count}`);
    });

    // 2. ANÁLISE DE UNIDADES
    console.log('\n\n🏥 ANÁLISE DE UNIDADES:\n');

    const unidadesRaw = await prisma.$queryRaw`
      SELECT
        nome_unidade_bruto as nome,
        COUNT(*) as count
      FROM STAGING_Info_Origem
      WHERE nome_unidade_bruto IS NOT NULL
      GROUP BY nome_unidade_bruto
      ORDER BY count DESC
    `;

    const unidadesArray = unidadesRaw.map(u => ({
      nome: u.nome,
      count: Number(u.count),
    }));

    console.log(`- Nomes únicos de unidades (exatos): ${unidadesArray.length}`);

    // Agrupar unidades similares
    const gruposUnidades = agruparSimilares(unidadesArray, 85);
    console.log(`- Unidades únicas (estimativa após agrupamento): ~${gruposUnidades.length}`);

    console.log('\n  🔝 TOP 15 UNIDADES (por número de registros):');
    gruposUnidades.slice(0, 15).forEach((grupo, idx) => {
      console.log(`\n  ${idx + 1}. ${grupo.representante}`);
      console.log(`     Total de registros: ${grupo.totalRegistros}`);

      if (grupo.items.length > 1) {
        console.log(`     ⚠️  Agrupado com ${grupo.items.length - 1} variação(ões):`);
        grupo.items.slice(1).forEach(item => {
          console.log(`        - ${item.nome} (${item.count} registros)`);
        });
      }
    });

    // 3. ANÁLISE DE ESPECIALIDADES
    console.log('\n\n💊 ANÁLISE DE ESPECIALIDADES:\n');

    const especialidadesRaw = await prisma.$queryRaw`
      SELECT
        nome_especialidade_bruto as nome,
        COUNT(*) as count
      FROM STAGING_Info_Origem
      WHERE nome_especialidade_bruto IS NOT NULL
      GROUP BY nome_especialidade_bruto
      ORDER BY count DESC
    `;

    const especialidadesArray = especialidadesRaw.map(e => ({
      nome: e.nome,
      count: Number(e.count),
    }));

    console.log(`- Especialidades brutas únicas: ${especialidadesArray.length}`);

    // Agrupar especialidades similares
    const gruposEspecialidades = agruparSimilares(especialidadesArray, 75);
    console.log(`- Especialidades normalizadas (estimativa): ~${gruposEspecialidades.length}`);

    console.log('\n  🔬 GRUPOS DE ESPECIALIDADES SIMILARES DETECTADAS:');

    // Mostrar apenas grupos com múltiplos itens (duplicatas)
    const gruposComDuplicatas = gruposEspecialidades.filter(g => g.items.length > 1);

    if (gruposComDuplicatas.length > 0) {
      console.log(`\n  Encontrados ${gruposComDuplicatas.length} grupos com variações:\n`);

      gruposComDuplicatas.slice(0, 10).forEach((grupo, idx) => {
        console.log(`  Grupo ${idx + 1} - "${grupo.representante}":`);
        grupo.items.forEach(item => {
          console.log(`    - ${item.nome} (${item.count} registros)`);
        });
        console.log(`    → Sugestão: normalizar para "${grupo.representante}"`);
        console.log('');
      });

      if (gruposComDuplicatas.length > 10) {
        console.log(`  ... e mais ${gruposComDuplicatas.length - 10} grupo(s)\n`);
      }
    } else {
      console.log('  ✅ Nenhuma duplicata detectada\n');
    }

    console.log('\n  📋 TODAS AS ESPECIALIDADES (por frequência):');
    especialidadesArray.forEach((esp, idx) => {
      console.log(`  ${idx + 1}. ${esp.nome} (${esp.count} registros)`);
    });

    // 4. ANÁLISE DE MÉDICOS
    console.log('\n\n👨‍⚕️ ANÁLISE DE MÉDICOS:\n');

    const medicosRaw = await prisma.$queryRaw`
      SELECT
        nome_medico_bruto as nome,
        COUNT(*) as count
      FROM STAGING_Info_Origem
      WHERE nome_medico_bruto IS NOT NULL
      GROUP BY nome_medico_bruto
      ORDER BY count DESC
    `;

    const medicosArray = medicosRaw.map(m => ({
      nome: m.nome,
      count: Number(m.count),
    }));

    console.log(`- Médicos únicos: ${medicosArray.length}`);

    // Médicos que atendem em múltiplas unidades
    const medicosMultiplasUnidades = await prisma.$queryRaw`
      SELECT
        nome_medico_bruto as medico,
        COUNT(DISTINCT nome_unidade_bruto) as num_unidades
      FROM STAGING_Info_Origem
      WHERE nome_medico_bruto IS NOT NULL
        AND nome_unidade_bruto IS NOT NULL
      GROUP BY nome_medico_bruto
      HAVING COUNT(DISTINCT nome_unidade_bruto) > 1
      ORDER BY num_unidades DESC
      LIMIT 10
    `;

    if (medicosMultiplasUnidades.length > 0) {
      console.log('\n  🏥 TOP 10 Médicos que atendem em múltiplas unidades:');
      medicosMultiplasUnidades.forEach((m, idx) => {
        console.log(`  ${idx + 1}. ${m.medico}`);
        console.log(`     Atende em ${m.num_unidades} unidades diferentes`);
      });
    }

    // Top 10 médicos por número de registros
    console.log('\n  🔝 TOP 10 Médicos (por número de registros):');
    medicosArray.slice(0, 10).forEach((m, idx) => {
      console.log(`  ${idx + 1}. ${m.nome} (${m.count} registros)`);
    });

    // 5. REGISTROS PROBLEMÁTICOS
    console.log('\n\n⚠️ REGISTROS PROBLEMÁTICOS:\n');

    const semUnidade = await prisma.sTAGING_Info_Origem.count({
      where: { nome_unidade_bruto: null },
    });

    const semMedico = await prisma.sTAGING_Info_Origem.count({
      where: { nome_medico_bruto: null },
    });

    const semEspecialidade = await prisma.sTAGING_Info_Origem.count({
      where: { nome_especialidade_bruto: null },
    });

    console.log(`- Registros sem nome de unidade: ${semUnidade}`);
    console.log(`- Registros sem médico: ${semMedico}`);
    console.log(`- Registros sem especialidade: ${semEspecialidade}`);

    // Registros já enriquecidos
    const comCoordenadas = await prisma.sTAGING_Info_Origem.count({
      where: {
        AND: [
          { latitude_manual: { not: null } },
          { longitude_manual: { not: null } },
        ],
      },
    });

    const comNomeFamiliar = await prisma.sTAGING_Info_Origem.count({
      where: { nome_familiar: { not: null } },
    });

    console.log(`\n✅ Progresso de enriquecimento:`);
    console.log(`- Registros com coordenadas: ${comCoordenadas}`);
    console.log(`- Registros com nome familiar: ${comNomeFamiliar}`);

    // 6. ESTIMATIVA DE TRABALHO
    console.log('\n\n📈 ESTIMATIVA DE TRABALHO PARA O ADMIN:\n');

    const unidadesParaValidar = gruposUnidades.length;
    const especialidadesParaNormalizar = especialidadesArray.length;

    console.log(`- Unidades únicas para validar: ~${unidadesParaValidar}`);
    console.log(`- Especialidades para normalizar: ${especialidadesParaNormalizar}`);
    console.log(`  (Podem ser agrupadas em ~${gruposEspecialidades.length} categorias)`);

    const tempoEstimadoUnidades = Math.ceil((unidadesParaValidar * 3) / 60); // 3 min por unidade
    const tempoEstimadoEspecialidades = Math.ceil((especialidadesParaNormalizar * 1) / 60); // 1 min por especialidade

    console.log(`\n⏱️  Tempo estimado:`);
    console.log(`- Normalização de especialidades: ~${tempoEstimadoEspecialidades}h`);
    console.log(`- Validação de unidades: ~${tempoEstimadoUnidades}h`);
    console.log(`- TOTAL: ~${tempoEstimadoUnidades + tempoEstimadoEspecialidades}h de trabalho`);

    console.log('\n========================================');
    console.log('=== FIM DA ANÁLISE ===');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Erro durante análise:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar análise
analisarDados()
  .then(() => {
    console.log('✅ Análise concluída com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
