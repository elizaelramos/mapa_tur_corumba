#!/usr/bin/env node
const path = require('path')
// Carregar .env antes de instanciar Prisma
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
const { prisma } = require('@mapatur/database')

// Lista de arquivos com paths relativos ao repositório
const icons = [
  'uploads/icones/Imersão Pesca - Barcos.png',
  'uploads/icones/Imersão Pesca - Pousadas.png',
  'uploads/icones/Lanchonete.png',
  'uploads/icones/Locadoras Veiculos (2).png',
  'uploads/icones/Locadoras Veiculos.png',
  'uploads/icones/Pizzaria.png',
  'uploads/icones/Restaurante Multisserviços.png',
  'uploads/icones/Serviço Apoio.png',
  'uploads/icones/Serviço Emergência.png',
  'uploads/icones/Sorveteria_Gelateria.png',
  'uploads/icones/Transportadoras.png',
  'uploads/icones/Hotel Urbano.png',
  'uploads/icones/Hotel Rural.png',
  'uploads/icones/Hamburgueria.png',
  'uploads/icones/Compras _ Economia Criativa.png'
]

async function main() {
  console.log('Conectando ao DB...')

  // pegar maior ordem atual
  const maxOrderRes = await prisma.pROD_Icone.findFirst({ orderBy: { ordem: 'desc' }, select: { ordem: true } })
  let ordem = (maxOrderRes && maxOrderRes.ordem) ? maxOrderRes.ordem + 1 : 1

  for (const p of icons) {
    const filename = path.basename(p)
    const nome = filename.replace(/\.[^.]+$/, '') // remover extensão
    const url = `/${p.replace(/\\/g, '/')}` // prefixar / para path web

    try {
      // upsert pela coluna nome
      const res = await prisma.pROD_Icone.upsert({
        where: { nome },
        update: { url, ativo: true, ordem },
        create: { nome, url, ativo: true, ordem }
      })
      console.log('Upserted:', nome, 'id:', res.id, 'ordem:', ordem)
      ordem++
    } catch (err) {
      console.error('Erro ao inserir ícone', nome, err.message)
    }
  }

  console.log('Concluído.');
  await prisma.$disconnect()
}

main().catch(err => { console.error(err); process.exit(1) })
