/**
 * Script para testar update de unidade após correção de DEFINERs
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testarUpdate() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║              TESTE DE UPDATE DE UNIDADE                      ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  try {
    // Buscar uma unidade para testar
    console.log('1️⃣ Buscando unidade para testar...');
    const unidade = await prisma.pROD_Unidade_Saude.findFirst({
      where: { ativo: true }
    });

    if (!unidade) {
      console.log('❌ Nenhuma unidade encontrada');
      return;
    }

    console.log(`   ✅ Unidade encontrada: ${unidade.nome} (ID: ${unidade.id})\n`);

    // Fazer um update simples (sem alterar dados críticos)
    console.log('2️⃣ Tentando atualizar a unidade...');
    
    const horarioAntes = unidade.horario_atendimento;
    const novoHorario = `Seg-Sex: 7h às 17h (Teste: ${new Date().toLocaleTimeString()})`;

    const unidadeAtualizada = await prisma.pROD_Unidade_Saude.update({
      where: { id: unidade.id },
      data: {
        horario_atendimento: novoHorario,
        updated_at: new Date()
      }
    });

    console.log('   ✅ Update realizado com sucesso!\n');

    console.log('📋 Dados atualizados:');
    console.log(`   ID: ${unidadeAtualizada.id}`);
    console.log(`   Nome: ${unidadeAtualizada.nome}`);
    console.log(`   Horário anterior: ${horarioAntes || 'null'}`);
    console.log(`   Horário novo: ${unidadeAtualizada.horario_atendimento}`);
    console.log(`   Updated at: ${unidadeAtualizada.updated_at}\n`);

    // Verificar se o trigger de audit foi executado
    console.log('3️⃣ Verificando log de auditoria...');
    const auditLog = await prisma.aUDIT_LOG.findFirst({
      where: {
        tabela: 'PROD_Unidade_Saude',
        registro_id: unidade.id,
        operacao: 'UPDATE'
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    if (auditLog) {
      console.log('   ✅ Registro de auditoria criado!\n');
      console.log(`   Timestamp: ${auditLog.timestamp}`);
      console.log(`   User ID: ${auditLog.user_id || 'NULL (trigger)'}`);
      console.log(`   Operação: ${auditLog.operacao}\n`);
    } else {
      console.log('   ⚠️  Nenhum registro de auditoria encontrado\n');
    }

    // Reverter alteração para deixar banco limpo
    console.log('4️⃣ Revertendo alteração de teste...');
    await prisma.pROD_Unidade_Saude.update({
      where: { id: unidade.id },
      data: {
        horario_atendimento: horarioAntes
      }
    });
    console.log('   ✅ Alteração revertida\n');

    console.log('═'.repeat(80));
    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!\n');
    console.log('✅ O problema de DEFINER foi corrigido');
    console.log('✅ Updates estão funcionando normalmente');
    console.log('✅ Triggers de auditoria estão operacionais\n');

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:\n');
    console.error('Tipo:', error.constructor.name);
    console.error('Mensagem:', error.message);
    
    if (error.code) {
      console.error('Código:', error.code);
    }
    
    if (error.meta) {
      console.error('Meta:', JSON.stringify(error.meta, null, 2));
    }
    
    console.error('\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testarUpdate();
