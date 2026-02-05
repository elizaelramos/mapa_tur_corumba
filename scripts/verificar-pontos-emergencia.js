require('dotenv').config();

const { PrismaClient } = require('@mapatur/database');

const prisma = new PrismaClient();

async function verificarPontosEmergencia() {
  try {
    console.log('🔍 Buscando pontos de emergência importados...\n');

    // Buscar a categoria
    const categoria = await prisma.pROD_Categoria.findFirst({
      where: {
        nome: 'Serviços de Apoio e Emergência'
      }
    });

    if (!categoria) {
      console.log('❌ Categoria não encontrada!');
      return;
    }

    console.log(`✅ Categoria encontrada: ${categoria.nome} (ID: ${categoria.id})\n`);

    // Buscar unidades da categoria
    const junctions = await prisma.junction_UnidadeTuristica_Categoria.findMany({
      where: {
        id_categoria: categoria.id
      },
      include: {
        unidade: {
          include: {
            bairro: true,
            redes_sociais: true
          }
        }
      }
    });

    console.log(`📊 Total de pontos de emergência: ${junctions.length}\n`);
    console.log('='.repeat(80));

    junctions.forEach((junction, idx) => {
      const u = junction.unidade;
      console.log(`\n🚨 [${idx + 1}] ${u.nome}`);
      console.log(`   ID: ${u.id}`);
      console.log(`   Setor: ${u.setor || 'N/A'}`);
      console.log(`   Nome Fantasia: ${u.nome_fantasia || 'N/A'}`);
      console.log(`   Endereço: ${u.endereco || 'N/A'}`);
      console.log(`   Bairro: ${u.bairro?.nome || 'N/A'}`);
      console.log(`   Coordenadas: ${u.latitude}, ${u.longitude}`);
      console.log(`   Telefone: ${u.telefone || 'N/A'}`);
      console.log(`   Horário: ${u.horario_funcionamento || 'N/A'}`);
      console.log(`   Ativo: ${u.ativo ? 'Sim' : 'Não'}`);

      if (u.redes_sociais.length > 0) {
        console.log(`   Redes Sociais:`);
        u.redes_sociais.forEach(rede => {
          console.log(`      - ${rede.nome_rede}: ${rede.url_perfil}`);
        });
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n✨ Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarPontosEmergencia();
