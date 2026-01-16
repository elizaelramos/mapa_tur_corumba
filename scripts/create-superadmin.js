/**
 * Script para criar usuário Superadmin
 * Uso: npm run create:superadmin
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
  console.log('   CRIAR USUÁRIO SUPERADMIN - SIGLS');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // Verificar se já existe um superadmin
    const existingSuperadmin = await prisma.user.findFirst({
      where: { role: 'superadmin' }
    });

    if (existingSuperadmin) {
      console.log('⚠️  Já existe um usuário Superadmin no sistema:');
      console.log(`   Username: ${existingSuperadmin.username}`);
      console.log(`   Email: ${existingSuperadmin.email || 'N/A'}\n`);
      
      const overwrite = await question('Deseja criar outro Superadmin? (s/n): ');
      if (overwrite.toLowerCase() !== 's') {
        console.log('\n❌ Operação cancelada.');
        rl.close();
        await prisma.$disconnect();
        return;
      }
      console.log('');
    }

    // Coletar dados do novo superadmin
    const username = await question('Username: ');
    if (!username || username.length < 3) {
      throw new Error('Username deve ter pelo menos 3 caracteres');
    }

    // Verificar se username já existe
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      throw new Error(`Username "${username}" já está em uso`);
    }

    const email = await question('Email (opcional): ');
    const password = await question('Password (mínimo 6 caracteres): ');
    
    if (!password || password.length < 6) {
      throw new Error('Password deve ter pelo menos 6 caracteres');
    }

    const confirmPassword = await question('Confirme o password: ');
    
    if (password !== confirmPassword) {
      throw new Error('Passwords não conferem');
    }

    console.log('\n🔐 Criando usuário Superadmin...');

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10);

    // Criar usuário
    const newUser = await prisma.user.create({
      data: {
        username,
        email: email || null,
        password_hash: passwordHash,
        role: 'superadmin',
        ativo: true
      }
    });

    console.log('\n✅ Superadmin criado com sucesso!');
    console.log('═══════════════════════════════════════════════════');
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Username: ${newUser.username}`);
    console.log(`   Email: ${newUser.email || 'N/A'}`);
    console.log(`   Role: ${newUser.role}`);
    console.log('═══════════════════════════════════════════════════');
    console.log('\n💡 Use estas credenciais para fazer login em /login\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();
