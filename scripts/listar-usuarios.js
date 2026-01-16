/**
 * Listar usuários do sistema
 */

const { PrismaClient } = require('@mapatur/database');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      ativo: true,
      created_at: true
    },
    orderBy: {
      id: 'asc'
    }
  });

  console.log('Usuários cadastrados:\n');
  users.forEach(u => {
    console.log(`ID ${u.id}:`);
    console.log(`  Username: ${u.username}`);
    console.log(`  Email: ${u.email || 'N/A'}`);
    console.log(`  Role: ${u.role}`);
    console.log(`  Ativo: ${u.ativo}`);
    console.log(`  Criado em: ${u.created_at}`);
    console.log('');
  });

  await prisma.$disconnect();
}

main().catch(console.error);
