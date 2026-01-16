/**
 * Script para popular a tabela Junction_Unidade_Medico
 * baseado nos dados da tabela STAGING_Info_Origem
 */

// Carregar variáveis de ambiente
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Iniciando população da tabela Junction_Unidade_Medico...\n');

  try {
    // 1. Buscar todos os registros validados do staging
    const stagingRecords = await prisma.sTAGING_Info_Origem.findMany({
      where: {
        status_processamento: 'validado',
      },
      select: {
        id: true,
        nome_medico_bruto: true,
        nome_unidade_bruto: true,
        nome_familiar: true,
      },
    });

    console.log(`📊 Encontrados ${stagingRecords.length} registros validados no staging\n`);

    // 2. Buscar todas as unidades e médicos em produção
    const unidades = await prisma.pROD_Unidade_Saude.findMany({
      select: { id: true, nome: true },
    });

    const medicos = await prisma.pROD_Medico.findMany({
      select: { id: true, nome: true },
    });

    console.log(`📊 Encontradas ${unidades.length} unidades e ${medicos.length} médicos em produção\n`);

    // 3. Criar mapa de relacionamentos únicos
    const relacionamentos = new Map();
    let matched = 0;
    let notMatched = 0;

    for (const record of stagingRecords) {
      if (!record.nome_medico_bruto || !record.nome_unidade_bruto) {
        continue;
      }

      // Buscar unidade por nome (usa nome_familiar se disponível, senão usa nome_unidade_bruto)
      const nomeUnidadeBusca = record.nome_familiar || record.nome_unidade_bruto;
      const unidade = unidades.find(u =>
        u.nome.toLowerCase() === nomeUnidadeBusca.toLowerCase() ||
        u.nome.toLowerCase().includes(nomeUnidadeBusca.toLowerCase()) ||
        nomeUnidadeBusca.toLowerCase().includes(u.nome.toLowerCase())
      );

      // Buscar médico por nome
      const medico = medicos.find(m =>
        m.nome.toLowerCase() === record.nome_medico_bruto.toLowerCase() ||
        m.nome.toLowerCase().includes(record.nome_medico_bruto.toLowerCase()) ||
        record.nome_medico_bruto.toLowerCase().includes(m.nome.toLowerCase())
      );

      if (unidade && medico) {
        const key = `${unidade.id}-${medico.id}`;
        relacionamentos.set(key, {
          id_unidade: unidade.id,
          id_medico: medico.id,
        });
        matched++;
      } else {
        notMatched++;
        if (notMatched <= 5) {
          console.log(`   ⚠️  Não encontrado: ${record.nome_unidade_bruto} / ${record.nome_medico_bruto}`);
        }
      }
    }

    console.log(`\n✅ Identificados ${relacionamentos.size} relacionamentos únicos unidade-médico`);
    console.log(`   Matched: ${matched}, Not Matched: ${notMatched}\n`);

    // 3. Limpar relacionamentos antigos
    console.log('🗑️  Limpando relacionamentos antigos...');
    const deleted = await prisma.junction_Unidade_Medico.deleteMany({});
    console.log(`   Removidos: ${deleted.count} registros\n`);

    // 4. Inserir novos relacionamentos
    console.log('💾 Inserindo novos relacionamentos...');

    let inserted = 0;
    for (const rel of relacionamentos.values()) {
      try {
        await prisma.junction_Unidade_Medico.create({
          data: rel,
        });
        inserted++;

        if (inserted % 100 === 0) {
          console.log(`   Inseridos: ${inserted}/${relacionamentos.size}`);
        }
      } catch (error) {
        // Ignora duplicatas
        if (!error.code || error.code !== 'P2002') {
          console.error(`   ❌ Erro ao inserir ${rel.id_unidade}-${rel.id_medico}:`, error.message);
        }
      }
    }

    console.log(`\n✅ Processo concluído!`);
    console.log(`   Total inserido: ${inserted} relacionamentos`);

    // 5. Exibir estatísticas
    const stats = await prisma.$queryRaw`
      SELECT
        COUNT(DISTINCT id_unidade) as unidades_com_medicos,
        COUNT(DISTINCT id_medico) as medicos_com_unidades,
        COUNT(*) as total_relacionamentos
      FROM Junction_Unidade_Medico
    `;

    console.log('\n📈 Estatísticas:');
    console.log(`   Unidades com médicos: ${stats[0].unidades_com_medicos}`);
    console.log(`   Médicos com unidades: ${stats[0].medicos_com_unidades}`);
    console.log(`   Total de relacionamentos: ${stats[0].total_relacionamentos}`);

  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
