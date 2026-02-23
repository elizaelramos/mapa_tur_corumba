#!/usr/bin/env node
/**
 * Script para aplicar migration SQL manualmente
 * Uso: node apply-migration.js <migration-file>
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function applyMigration(migrationFile) {
  try {
    console.log(`\n📦 Aplicando migration: ${migrationFile}\n`)

    // Ler arquivo SQL
    const sqlContent = fs.readFileSync(migrationFile, 'utf8')

    // Dividir em statements individuais (removendo comentários e linhas vazias)
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📝 ${statements.length} statements SQL encontrados\n`)

    // Executar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]

      // Pular comentários de bloco
      if (statement.startsWith('/*') || statement.includes('DELIMITER')) {
        continue
      }

      try {
        console.log(`⏳ Executando statement ${i + 1}/${statements.length}...`)
        await prisma.$executeRawUnsafe(statement)
        console.log(`✅ Statement ${i + 1} aplicado com sucesso`)
      } catch (error) {
        console.error(`❌ Erro no statement ${i + 1}:`)
        console.error(`   SQL: ${statement.substring(0, 100)}...`)
        console.error(`   Erro: ${error.message}`)

        // Continuar mesmo com erros (triggers podem já existir, etc)
        if (!error.message.includes('already exists')) {
          throw error
        }
      }
    }

    console.log(`\n✅ Migration aplicada com sucesso!\n`)

    // Verificar resultados
    const stats = await prisma.$queryRaw`
      SELECT
        COUNT(*) as total_unidades,
        SUM(CASE WHEN icone_id IS NOT NULL THEN 1 ELSE 0 END) as com_icone_id,
        SUM(CASE WHEN icone_url IS NOT NULL THEN 1 ELSE 0 END) as com_icone_url,
        SUM(CASE WHEN icone_id IS NOT NULL AND icone_url IS NOT NULL THEN 1 ELSE 0 END) as sincronizados
      FROM prod_unidade_turistica
    `

    console.log('📊 Estatísticas da Migração:')
    console.log(`   Total de unidades: ${stats[0].total_unidades}`)
    console.log(`   Com icone_id: ${stats[0].com_icone_id}`)
    console.log(`   Com icone_url: ${stats[0].com_icone_url}`)
    console.log(`   Sincronizados (ambos): ${stats[0].sincronizados}`)
    console.log()

  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Executar
const migrationFile = process.argv[2] || 'prisma/migrations/20260210074741_add_icone_id_relationship/migration.sql'
applyMigration(migrationFile)
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
