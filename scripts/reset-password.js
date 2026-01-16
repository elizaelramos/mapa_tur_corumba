/**
 * Script para resetar senha de usuário
 * Uso: node scripts/reset-password.js
 */

const { PrismaClient } = require('@mapatur/database');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('   RESETAR SENHA DE USUÁRIO - SIGLS');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // Listar usuários
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true
      },
      orderBy: {
        id: 'asc'
      }
    });

    console.log('Usuários disponíveis:\n');
    users.forEach(u => {
      console.log(`  [${u.id}] ${u.username} (${u.role}) - ${u.email || 'Sem email'}`);
    });
    console.log('');

    // Solicitar ID ou username
    const userInput = await question('Digite o ID ou username do usuário: ');
    
    // Buscar usuário
    let user;
    if (/^\d+$/.test(userInput)) {
      user = await prisma.user.findUnique({
        where: { id: parseInt(userInput) }
      });
    } else {
      user = await prisma.user.findUnique({
        where: { username: userInput }
      });
    }

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    console.log(`\n✓ Usuário selecionado: ${user.username} (${user.role})\n`);

    // Solicitar nova senha
    const newPassword = await question('Nova senha (mínimo 6 caracteres): ');
    
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Senha deve ter pelo menos 6 caracteres');
    }

    const confirmPassword = await question('Confirme a nova senha: ');
    
    if (newPassword !== confirmPassword) {
      throw new Error('Senhas não conferem');
    }

    console.log('\n🔐 Atualizando senha...');

    // Hash da nova senha
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: passwordHash
      }
    });

    console.log('\n✅ Senha atualizada com sucesso!');
    console.log('═══════════════════════════════════════════════════');
    console.log(`   Usuário: ${user.username}`);
    console.log(`   Nova senha: ${newPassword}`);
    console.log('═══════════════════════════════════════════════════');
    console.log('\n💡 Use estas credenciais para fazer login\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();
