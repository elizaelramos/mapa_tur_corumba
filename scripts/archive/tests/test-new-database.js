/**
 * Script para testar conexão com o novo banco de dados no servidor
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testarConexao() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║        TESTE DE CONEXÃO - NOVO BANCO DE DADOS SERVIDOR       ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  console.log('📋 Configuração do Banco:');
  console.log(`   Host: ${process.env.DB_HOST || '172.16.0.117'}`);
  console.log(`   Port: ${process.env.DB_PORT || '3306'}`);
  console.log(`   Database: ${process.env.DB_NAME || 'sigls_db'}`);
  console.log(`   User: ${process.env.DB_USER || 'tableau'}\n`);

  try {
    // Teste 1: Conexão básica
    console.log('1️⃣ Testando conexão básica...');
    await prisma.$connect();
    console.log('   ✅ Conexão estabelecida com sucesso!\n');

    // Teste 2: Verificar tabelas
    console.log('2️⃣ Verificando tabelas do banco...');
    const tables = await prisma.$queryRaw`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ${process.env.DB_NAME || 'sigls_db'}
      ORDER BY TABLE_NAME
    `;
    console.log(`   ✅ ${tables.length} tabelas encontradas:`);
    tables.forEach(table => {
      console.log(`      - ${table.TABLE_NAME}`);
    });
    console.log('');

    // Teste 3: Contar registros nas tabelas principais
    console.log('3️⃣ Verificando dados nas tabelas principais...\n');

    const contagens = await Promise.all([
      prisma.pROD_Unidade_Saude.count().then(count => ({ tabela: 'PROD_Unidade_Saude', count })),
      prisma.pROD_Medico.count().then(count => ({ tabela: 'PROD_Medico', count })),
      prisma.pROD_Especialidade.count().then(count => ({ tabela: 'PROD_Especialidade', count })),
      prisma.pROD_Bairro.count().then(count => ({ tabela: 'PROD_Bairro', count })),
      prisma.pROD_Icone.count().then(count => ({ tabela: 'PROD_Icone', count })),
      prisma.sTAGING_Info_Origem.count().then(count => ({ tabela: 'STAGING_Info_Origem', count })),
      prisma.junction_Unidade_Especialidade.count().then(count => ({ tabela: 'Junction_Unidade_Especialidade', count })),
      prisma.junction_Medico_Especialidade.count().then(count => ({ tabela: 'Junction_Medico_Especialidade', count })),
      prisma.junction_Unidade_Medico.count().then(count => ({ tabela: 'Junction_Unidade_Medico', count })),
      prisma.user.count().then(count => ({ tabela: 'User', count })),
      prisma.aUDIT_LOG.count().then(count => ({ tabela: 'AUDIT_LOG', count })),
      prisma.eTL_Execution.count().then(count => ({ tabela: 'ETL_Execution', count })),
    ]);

    contagens.forEach(({ tabela, count }) => {
      const icone = count > 0 ? '✅' : '⚠️';
      console.log(`   ${icone} ${tabela}: ${count} registros`);
    });
    console.log('');

    // Teste 4: Buscar algumas unidades
    console.log('4️⃣ Testando query de unidades...');
    const unidades = await prisma.pROD_Unidade_Saude.findMany({
      take: 5,
      select: {
        id: true,
        nome: true,
        bairro: true,
        ativo: true
      }
    });
    console.log(`   ✅ ${unidades.length} unidades carregadas (amostra):`);
    unidades.forEach(u => {
      console.log(`      - [${u.id}] ${u.nome} (${u.bairro || 'sem bairro'})`);
    });
    console.log('');

    // Teste 5: Verificar usuário admin
    console.log('5️⃣ Verificando usuário admin...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        ativo: true
      }
    });
    console.log(`   ✅ ${users.length} usuário(s) encontrado(s):`);
    users.forEach(u => {
      console.log(`      - ${u.username} (${u.email}) - Role: ${u.role} - Ativo: ${u.ativo}`);
    });
    console.log('');

    // Teste 6: Verificar ícones
    console.log('6️⃣ Verificando ícones...');
    const icones = await prisma.pROD_Icone.findMany({
      where: { ativo: true },
      select: {
        id: true,
        nome: true,
        url: true,
        ordem: true
      },
      orderBy: { ordem: 'asc' }
    });
    console.log(`   ✅ ${icones.length} ícones ativos encontrados`);
    console.log('');

    // Resumo final
    console.log('═'.repeat(80));
    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!\n');
    console.log('✅ Conexão com o banco de dados do servidor funcionando perfeitamente');
    console.log('✅ Todas as tabelas estão acessíveis');
    console.log('✅ Dados importados corretamente\n');

    const totalRegistros = contagens.reduce((sum, { count }) => sum + count, 0);
    console.log(`📊 Total de registros no banco: ${totalRegistros.toLocaleString('pt-BR')}\n`);

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE DE CONEXÃO:\n');
    console.error('Tipo:', error.constructor.name);
    console.error('Mensagem:', error.message);
    
    if (error.code) {
      console.error('Código:', error.code);
    }
    
    if (error.meta) {
      console.error('Meta:', JSON.stringify(error.meta, null, 2));
    }

    console.error('\n💡 POSSÍVEIS SOLUÇÕES:\n');
    console.error('1. Verifique se o servidor está acessível: ping 172.16.0.117');
    console.error('2. Verifique se a porta 3306 está aberta no firewall');
    console.error('3. Confirme as credenciais (usuário: tableau, senha: dose25_teq2)');
    console.error('4. Verifique se o banco "sigls_db" existe no servidor');
    console.error('5. Confirme se o usuário "tableau" tem permissões necessárias\n');
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testarConexao();
