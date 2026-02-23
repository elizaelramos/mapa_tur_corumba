#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function verify() {
  try {
    const stats = await prisma.$queryRaw`
      SELECT
        COUNT(*) as total_unidades,
        SUM(CASE WHEN icone_id IS NOT NULL THEN 1 ELSE 0 END) as com_icone_id,
        SUM(CASE WHEN icone_url IS NOT NULL THEN 1 ELSE 0 END) as com_icone_url,
        SUM(CASE WHEN icone_id IS NOT NULL AND icone_url IS NOT NULL THEN 1 ELSE 0 END) as sincronizados
      FROM prod_unidade_turistica
    `

    console.log('\n📊 Estat\u00edsticas da Migração icone_url → icone_id:\n')
    console.log(`   Total de unidades: ${stats[0].total_unidades}`)
    console.log(`   Com icone_id: ${stats[0].com_icone_id}`)
    console.log(`   Com icone_url: ${stats[0].com_icone_url}`)
    console.log(`   Sincronizados: ${stats[0].sincronizados}`)

    const percentual = ((Number(stats[0].com_icone_id) / Number(stats[0].total_unidades)) * 100).toFixed(1)
    console.log(`   \n   ✅ ${percentual}% das unidades migradas para icone_id\n`)

  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

verify()
