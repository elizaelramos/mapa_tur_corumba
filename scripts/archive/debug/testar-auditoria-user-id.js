/**
 * Script para testar o sistema de auditoria com user_id
 * Simula uma operação como se fosse feita por um usuário autenticado
 */

const { prisma } = require('@mapatur/database');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testarAuditoria() {
  console.log('🧪 Testando sistema de auditoria com user_id...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    // 1. Buscar um usuário de teste
    const [users] = await connection.query('SELECT id, username FROM User LIMIT 1');
    if (users.length === 0) {
      throw new Error('Nenhum usuário encontrado no banco');
    }
    const testUser = users[0];
    console.log(`👤 Usuário de teste: ${testUser.username} (ID: ${testUser.id})\n`);

    // 2. Setar a variável de sessão (simula o middleware)
    await connection.query(`SET @current_user_id = ${testUser.id}`);
    console.log('✓ Variável @current_user_id setada\n');

    // 3. Buscar uma unidade para atualizar
    const [unidades] = await connection.query('SELECT id, nome, horario_atendimento FROM PROD_Unidade_Saude LIMIT 1');
    if (unidades.length === 0) {
      throw new Error('Nenhuma unidade encontrada');
    }
    const unidade = unidades[0];
    console.log(`🏥 Unidade de teste: ${unidade.nome} (ID: ${unidade.id})`);
    console.log(`   Horário atual: ${unidade.horario_atendimento || 'NULL'}\n`);

    // 4. Atualizar a unidade
    const novoHorario = 'TESTE: 08:00-17:00';
    await connection.query(
      'UPDATE PROD_Unidade_Saude SET horario_atendimento = ? WHERE id = ?',
      [novoHorario, unidade.id]
    );
    console.log(`✓ Unidade atualizada: horario_atendimento = "${novoHorario}"\n`);

    // 5. Verificar o log de auditoria
    const [auditLogs] = await connection.query(
      `SELECT id, tabela, operacao, registro_id, user_id, timestamp 
       FROM AUDIT_LOG 
       WHERE tabela = 'PROD_Unidade_Saude' 
       AND registro_id = ? 
       ORDER BY id DESC 
       LIMIT 1`,
      [unidade.id]
    );

    if (auditLogs.length === 0) {
      console.error('❌ Nenhum log de auditoria criado!');
      return;
    }

    const auditLog = auditLogs[0];
    console.log('📋 Log de Auditoria Criado:');
    console.log(`   ID: ${auditLog.id}`);
    console.log(`   Tabela: ${auditLog.tabela}`);
    console.log(`   Operação: ${auditLog.operacao}`);
    console.log(`   Registro ID: ${auditLog.registro_id}`);
    console.log(`   User ID: ${auditLog.user_id}`);
    console.log(`   Timestamp: ${auditLog.timestamp}\n`);

    if (auditLog.user_id === testUser.id) {
      console.log('✅ SUCESSO! O user_id foi registrado corretamente!\n');
    } else {
      console.error(`❌ ERRO! Esperado user_id=${testUser.id}, recebido user_id=${auditLog.user_id}\n`);
    }

    // 6. Reverter a mudança
    await connection.query(`SET @current_user_id = ${testUser.id}`);
    await connection.query(
      'UPDATE PROD_Unidade_Saude SET horario_atendimento = ? WHERE id = ?',
      [unidade.horario_atendimento, unidade.id]
    );
    console.log('✓ Mudança revertida\n');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    throw error;
  } finally {
    await connection.end();
    await prisma.$disconnect();
  }
}

// Executar
testarAuditoria()
  .then(() => {
    console.log('🎉 Teste concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
