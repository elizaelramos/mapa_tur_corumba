const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

/**
 * Popula a tabela PROD_Especialidade baseado nos nomes normalizados
 * da tabela Especialidade_Mapeamento
 */
async function populateEspecialidades() {
  try {
    console.log('🔄 Iniciando população da tabela PROD_Especialidade...\n');

    // Buscar todos os nomes normalizados únicos dos mapeamentos
    const mapeamentos = await prisma.especialidade_Mapeamento.findMany({
      select: {
        especialidade_normalizada: true,
      },
    });

    // Extrair nomes únicos
    const nomesUnicos = [...new Set(mapeamentos.map(m => m.especialidade_normalizada))];

    console.log(`📊 Encontrados ${nomesUnicos.length} nomes de especialidades normalizadas únicas\n`);

    let criadas = 0;
    let jaExistiam = 0;

    // Para cada nome normalizado, criar ou verificar se já existe na PROD_Especialidade
    for (const nome of nomesUnicos) {
      try {
        // Tentar criar (upsert)
        const especialidade = await prisma.pROD_Especialidade.upsert({
          where: { nome },
          create: {
            nome,
            ativo: true,
          },
          update: {}, // Não atualizar se já existe
        });

        // Verificar se foi criado agora ou já existia
        const wasCreated = new Date(especialidade.created_at).getTime() > Date.now() - 1000;

        if (wasCreated) {
          criadas++;
          console.log(`✅ Criada: ${nome}`);
        } else {
          jaExistiam++;
          console.log(`ℹ️  Já existia: ${nome}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao processar "${nome}":`, error.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA OPERAÇÃO');
    console.log('='.repeat(60));
    console.log(`✅ Especialidades criadas: ${criadas}`);
    console.log(`ℹ️  Já existiam: ${jaExistiam}`);
    console.log(`📝 Total processadas: ${nomesUnicos.length}`);
    console.log('='.repeat(60) + '\n');

    console.log('✨ População concluída com sucesso!\n');

  } catch (error) {
    console.error('❌ Erro ao popular especialidades:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
populateEspecialidades()
  .then(() => {
    console.log('✅ Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script falhou:', error);
    process.exit(1);
  });
