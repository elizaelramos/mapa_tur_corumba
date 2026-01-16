/**
 * Script para listar bairros
 */

import { PrismaClient } from '@mapatur/database';

const prisma = new PrismaClient();

async function main() {
  const bairros = await prisma.pROD_Bairro.findMany({
    select: {
      id: true,
      nome: true
    },
    orderBy: {
      nome: 'asc'
    }
  });
  
  console.log('Bairros cadastrados:\n');
  bairros.forEach(b => {
    console.log(`ID ${b.id}: "${b.nome}"`);
  });
  
  await prisma.$disconnect();
}

main();
