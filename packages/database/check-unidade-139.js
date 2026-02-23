#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkUnidade() {
  try {
    console.log('\n🔍 Verificando Unidade ID 139 - Recanto Vale do Sol\n')

    const unidade = await prisma.pROD_UnidadeTuristica.findUnique({
      where: { id: 139 },
      include: {
        bairro: true,
        icone: true,
        categorias: {
          include: {
            categoria: true
          }
        },
        redes_sociais: true
      }
    })

    if (!unidade) {
      console.log('❌ Unidade não encontrada no banco de dados!')
      return
    }

    console.log('📊 Dados da Unidade:')
    console.log('─'.repeat(60))
    console.log(`ID: ${unidade.id}`)
    console.log(`Nome: ${unidade.nome}`)
    console.log(`Ativo: ${unidade.ativo ? '✅ SIM' : '❌ NÃO'}`)
    console.log(`Latitude: ${unidade.latitude}`)
    console.log(`Longitude: ${unidade.longitude}`)
    console.log(`Endereço: ${unidade.endereco || 'N/A'}`)
    console.log(`Bairro: ${unidade.bairro?.nome || 'N/A'}`)
    console.log(`Telefone: ${unidade.telefone || 'N/A'}`)
    console.log(`WhatsApp: ${unidade.whatsapp || 'N/A'}`)
    console.log(`Email: ${unidade.email || 'N/A'}`)
    console.log(`─`.repeat(60))
    console.log(`\n🎨 Ícone:`)
    console.log(`  icone_id: ${unidade.icone_id || 'NULL'}`)
    console.log(`  icone_url: ${unidade.icone_url || 'NULL'}`)
    if (unidade.icone) {
      console.log(`  Ícone (objeto):`)
      console.log(`    - ID: ${unidade.icone.id}`)
      console.log(`    - Nome: ${unidade.icone.nome}`)
      console.log(`    - URL: ${unidade.icone.url}`)
      console.log(`    - Ativo: ${unidade.icone.ativo}`)
    } else {
      console.log(`  ⚠️ Sem ícone associado`)
    }
    console.log(`─`.repeat(60))
    console.log(`\n📂 Categorias: ${unidade.categorias?.length || 0}`)
    if (unidade.categorias && unidade.categorias.length > 0) {
      unidade.categorias.forEach(c => {
        console.log(`  - ${c.categoria.nome}${c.categoria.subcategoria ? ' / ' + c.categoria.subcategoria : ''}`)
      })
    } else {
      console.log(`  ⚠️ Sem categorias`)
    }

    console.log(`\n📅 Timestamps:`)
    console.log(`  Criado em: ${unidade.created_at}`)
    console.log(`  Atualizado em: ${unidade.updated_at}`)
    console.log()

    // Verificar possíveis problemas
    console.log('🔎 Verificando possíveis problemas:\n')

    const problemas = []

    if (!unidade.ativo) {
      problemas.push('❌ Unidade está INATIVA (não aparecerá no mapa público)')
    }

    if (!unidade.latitude || !unidade.longitude) {
      problemas.push('❌ Coordenadas inválidas')
    }

    if (!unidade.icone_id && !unidade.icone_url) {
      problemas.push('⚠️ Sem ícone definido')
    }

    if (unidade.categorias?.length === 0) {
      problemas.push('⚠️ Sem categorias (pode não aparecer em filtros)')
    }

    if (problemas.length === 0) {
      console.log('✅ Nenhum problema detectado nos dados!')
    } else {
      problemas.forEach(p => console.log(p))
    }

    console.log()

  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkUnidade()
