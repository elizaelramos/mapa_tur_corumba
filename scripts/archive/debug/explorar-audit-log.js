/**
 * Script para demonstrar como funciona a tabela AUDIT_LOG
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function explorarAuditLog() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║              EXPLORAÇÃO DA TABELA AUDIT_LOG                   ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Estatísticas gerais
    console.log('1️⃣ ESTATÍSTICAS GERAIS\n');
    
    const total = await prisma.aUDIT_LOG.count();
    console.log(`   Total de registros: ${total}\n`);

    // Por operação
    const porOperacao = await prisma.aUDIT_LOG.groupBy({
      by: ['operacao'],
      _count: true
    });

    console.log('   📊 Registros por operação:');
    porOperacao.forEach(op => {
      console.log(`      ${op.operacao}: ${op._count} registros`);
    });
    console.log('');

    // Por tabela
    const porTabela = await prisma.aUDIT_LOG.groupBy({
      by: ['tabela'],
      _count: true,
      orderBy: {
        _count: {
          tabela: 'desc'
        }
      }
    });

    console.log('   📊 Registros por tabela:');
    porTabela.forEach(t => {
      console.log(`      ${t.tabela}: ${t._count} registros`);
    });
    console.log('');

    // 2. Últimos registros
    console.log('2️⃣ ÚLTIMOS 10 REGISTROS\n');

    const ultimos = await prisma.aUDIT_LOG.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            username: true,
            role: true
          }
        }
      }
    });

    ultimos.forEach((log, index) => {
      console.log(`   ${index + 1}. [${log.id}] ${log.operacao} em ${log.tabela}`);
      console.log(`      Registro ID: ${log.registro_id}`);
      console.log(`      Usuário: ${log.user?.username || 'Sistema (Trigger)'} ${log.user ? `(${log.user.role})` : ''}`);
      console.log(`      Data/Hora: ${log.timestamp.toLocaleString('pt-BR')}`);
      
      if (log.valor_antigo) {
        try {
          const valorAntigo = JSON.parse(log.valor_antigo);
          console.log(`      Valor Antigo: ${Object.keys(valorAntigo).length} campo(s) alterado(s)`);
        } catch {
          console.log(`      Valor Antigo: [texto não-JSON]`);
        }
      }
      
      if (log.valor_novo) {
        try {
          const valorNovo = JSON.parse(log.valor_novo);
          console.log(`      Valor Novo: ${Object.keys(valorNovo).length} campo(s)`);
        } catch {
          console.log(`      Valor Novo: [texto não-JSON]`);
        }
      }
      
      console.log('');
    });

    // 3. Exemplo detalhado de um UPDATE
    console.log('3️⃣ EXEMPLO DETALHADO DE UM UPDATE\n');

    const exemploUpdate = await prisma.aUDIT_LOG.findFirst({
      where: {
        operacao: 'UPDATE',
        valor_antigo: { not: null },
        valor_novo: { not: null }
      },
      include: {
        user: true
      },
      orderBy: { timestamp: 'desc' }
    });

    if (exemploUpdate) {
      console.log(`   Operação: ${exemploUpdate.operacao}`);
      console.log(`   Tabela: ${exemploUpdate.tabela}`);
      console.log(`   Registro ID: ${exemploUpdate.registro_id}`);
      console.log(`   Usuário: ${exemploUpdate.user?.username || 'Sistema'}`);
      console.log(`   Data/Hora: ${exemploUpdate.timestamp.toLocaleString('pt-BR')}\n`);

      if (exemploUpdate.valor_antigo) {
        try {
          const antigo = JSON.parse(exemploUpdate.valor_antigo);
          console.log('   📋 Valor Antigo (JSON):');
          console.log(JSON.stringify(antigo, null, 4).split('\n').map(line => `      ${line}`).join('\n'));
          console.log('');
        } catch (e) {
          console.log(`   📋 Valor Antigo: ${exemploUpdate.valor_antigo}\n`);
        }
      }

      if (exemploUpdate.valor_novo) {
        try {
          const novo = JSON.parse(exemploUpdate.valor_novo);
          console.log('   📋 Valor Novo (JSON):');
          console.log(JSON.stringify(novo, null, 4).split('\n').map(line => `      ${line}`).join('\n'));
          console.log('');
        } catch (e) {
          console.log(`   📋 Valor Novo: ${exemploUpdate.valor_novo}\n`);
        }
      }
    } else {
      console.log('   ⚠️  Nenhum UPDATE com valores encontrado\n');
    }

    // 4. Comparação com o que aparece no /admin/audit
    console.log('═'.repeat(80));
    console.log('\n4️⃣ COMPARAÇÃO COM /admin/audit\n');

    console.log('   📺 O QUE APARECE NA PÁGINA /admin/audit:\n');
    console.log('   Colunas exibidas:');
    console.log('      • ID - identificador único do log');
    console.log('      • Tabela - qual tabela foi modificada');
    console.log('      • Operação - INSERT, UPDATE ou DELETE (com cores)');
    console.log('      • Registro ID - ID do registro afetado');
    console.log('      • Usuário - quem fez a alteração (ou "Sistema" se foi trigger)');
    console.log('      • Data/Hora - quando aconteceu\n');

    console.log('   📋 CAMPOS QUE EXISTEM MAS NÃO SÃO EXIBIDOS:\n');
    console.log('      • valor_antigo - estado anterior do registro (JSON)');
    console.log('      • valor_novo - estado novo do registro (JSON)');
    console.log('      • correlation_id - ID para agrupar operações relacionadas\n');

    console.log('   🔍 COMO FUNCIONA:\n');
    console.log('      1. Quando você CRIA uma unidade via API:');
    console.log('         → A API chama auditLog() manualmente');
    console.log('         → Cria registro com user_id do admin logado\n');
    
    console.log('      2. Quando um TRIGGER dispara (update direto no DB):');
    console.log('         → O trigger MySQL cria o registro automaticamente');
    console.log('         → user_id fica NULL (aparece como "Sistema")\n');

    console.log('      3. A página /admin/audit:');
    console.log('         → Faz GET /api/audit');
    console.log('         → Recebe os dados da tabela AUDIT_LOG');
    console.log('         → Exibe os 50 mais recentes com paginação\n');

    console.log('   ✅ SIM, são os MESMOS dados!');
    console.log('      A página /admin/audit apenas visualiza a tabela AUDIT_LOG\n');

    // 5. Registros criados por usuários vs triggers
    console.log('5️⃣ ORIGEM DOS REGISTROS\n');

    const comUsuario = await prisma.aUDIT_LOG.count({
      where: { user_id: { not: null } }
    });

    const semUsuario = await prisma.aUDIT_LOG.count({
      where: { user_id: null }
    });

    console.log(`   📊 Registros criados via API (com user_id): ${comUsuario}`);
    console.log(`   📊 Registros criados por Triggers (sem user_id): ${semUsuario}\n`);

    const percentualAPI = ((comUsuario / total) * 100).toFixed(1);
    const percentualTrigger = ((semUsuario / total) * 100).toFixed(1);

    console.log(`   Proporção: ${percentualAPI}% via API, ${percentualTrigger}% via Trigger\n`);

    console.log('═'.repeat(80));
    console.log('\n✅ RESUMO:\n');
    console.log('• A tabela AUDIT_LOG registra TODAS as alterações (INSERT/UPDATE/DELETE)');
    console.log('• Pode ser alimentada via API (com user_id) ou Triggers (sem user_id)');
    console.log('• A página /admin/audit mostra exatamente o conteúdo desta tabela');
    console.log('• Os campos valor_antigo e valor_novo contêm o diff completo em JSON');
    console.log('• É um log imutável - registros nunca são alterados ou deletados\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

explorarAuditLog();
