#!/usr/bin/env node
/*
  scripts/restore_dump.js
  Restaura um arquivo dump MySQL para um banco alvo usando mysql2.

  Uso:
    node scripts/restore_dump.js <dump-file-path> [target_db]

  Observações:
  - Lê configuração de conexão a partir do arquivo .env na raiz (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD).
  - Tenta criar o banco destino com charset utf8mb4 COLLATE utf8mb4_unicode_ci.
  - Executa statements separados por ";\n". Não suporta dumps com DELIMITER alternado (procedures com delimitadores customizados).
*/

const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
const mysql = require('mysql2/promise')

const root = path.resolve(__dirname, '..')
dotenv.config({ path: path.join(root, '.env') })

const dumpFile = process.argv[2] || path.join(root, 'dump-sis_reme_db-202601161027.sql')
const targetDb = process.argv[3] || process.env.DB_NAME || 'mapa_tur'

if (!fs.existsSync(dumpFile)) {
  console.error(`Arquivo dump não encontrado: ${dumpFile}`)
  process.exit(1)
}

const DB_HOST = process.env.DB_HOST || '127.0.0.1'
const DB_PORT = process.env.DB_PORT || '3306'
const DB_USER = process.env.DB_USER || 'root'
const DB_PASSWORD = process.env.DB_PASSWORD || ''

async function main() {
  console.log('Conectando ao MySQL...', { host: DB_HOST, port: DB_PORT, user: DB_USER })
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  })

  try {
    console.log(`Criando banco destino (se não existir): ${targetDb}`)
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${targetDb}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`)

    console.log(`Selecionando banco destino: ${targetDb}`)
    await conn.changeUser({ database: targetDb })

    console.log(`Lendo dump: ${dumpFile}`)
    const dump = fs.readFileSync(dumpFile, 'utf8')

    // Remover instruções CREATE DATABASE / USE para garantir que restauremos no banco target
    const cleaned = dump.replace(/CREATE DATABASE [^;]+;/gi, '').replace(/USE `[^`]+`;/gi, '')

    // Dividir por terminador de instrução ';' seguido de nova linha
    const statements = cleaned.split(/;\r?\n/).map(s => s.trim()).filter(s => s.length > 0)

    console.log(`Total aproximado de statements: ${statements.length}`)

    // Desativar temporariamente verificações que podem bloquear a restauração
    console.log('Desativando FOREIGN_KEY_CHECKS e UNIQUE_CHECKS temporariamente')
    await conn.query('SET FOREIGN_KEY_CHECKS=0; SET UNIQUE_CHECKS=0;')

    let executed = 0
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i]
      // ignorar comentários isolados
      if (/^--/.test(stmt) || stmt.startsWith('/*')) {
        continue
      }

      try {
        await conn.query(stmt)
        executed++
        if (executed % 100 === 0) process.stdout.write(`.`)
      } catch (err) {
        console.error('\nErro ao executar statement #'+(i+1)+':', err.message)
        console.error('Statement que falhou (trecho):', stmt.slice(0, 500))
        // Reabilitar checks antes de sair para evitar deixar a conexão em estado inconsistente
        try { await conn.query('SET FOREIGN_KEY_CHECKS=1; SET UNIQUE_CHECKS=1;') } catch (e) { console.warn('Falha ao reativar checks:', e.message) }
        throw err
      }
    }

    // Reabilitar checagens
    console.log('Reativando FOREIGN_KEY_CHECKS e UNIQUE_CHECKS')
    await conn.query('SET FOREIGN_KEY_CHECKS=1; SET UNIQUE_CHECKS=1;')

    console.log(`\nConcluído: ${executed} statements executados. Banco '${targetDb}' restaurado com sucesso.`)
  } finally {
    await conn.end()
  }
}

main().catch(err => {
  console.error('Erro durante a restauração:', err)
  process.exit(1)
})
