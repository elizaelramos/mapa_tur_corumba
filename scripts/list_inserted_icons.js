#!/usr/bin/env node
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { prisma } = require('@mapatur/database')

const names = [
  'Imersão Pesca - Barcos',
  'Imersão Pesca - Pousadas',
  'Lanchonete',
  'Locadoras Veiculos (2)',
  'Locadoras Veiculos',
  'Pizzaria',
  'Restaurante Multisserviços',
  'Serviço Apoio',
  'Serviço Emergência',
  'Sorveteria_Gelateria',
  'Transportadoras',
  'Hotel Urbano',
  'Hotel Rural',
  'Hamburgueria',
  'Compras _ Economia Criativa'
]

async function main() {
  const rows = await prisma.pROD_Icone.findMany({ where: { nome: { in: names } }, orderBy: { ordem: 'asc' } })
  console.log('Encontrados:', rows.length)
  rows.forEach(r => console.log(r.id, r.nome, r.url, r.ordem))
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
