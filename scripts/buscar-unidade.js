require('dotenv').config();
const { prisma } = require('@mapatur/database');

async function buscarUnidade() {
  const termoBusca = process.argv[2] || 'Belo Oyá';

  try {
    console.log(`🔍 Buscando unidades com termo: "${termoBusca}"\n`);

    // Buscar por nome, nome fantasia ou razão social
    const unidades = await prisma.pROD_UnidadeTuristica.findMany({
      where: {
        OR: [
          { nome: { contains: termoBusca } },
          { nome_fantasia: { contains: termoBusca } },
          { razao_social: { contains: termoBusca } },
        ]
      },
      include: {
        bairro: true,
        categorias: {
          include: {
            categoria: true
          }
        }
      }
    });

    if (unidades.length === 0) {
      console.log('❌ Nenhuma unidade encontrada com esse termo.\n');
      console.log('💡 Dica: Tente buscar com parte do nome ou verifique se o ponto foi cadastrado.\n');
      return;
    }

    console.log(`✅ Encontradas ${unidades.length} unidade(s):\n`);

    unidades.forEach((u, index) => {
      console.log(`${index + 1}. ${u.nome}`);
      console.log(`   ID: ${u.id}`);
      console.log(`   Nome Fantasia: ${u.nome_fantasia || 'N/A'}`);
      console.log(`   Razão Social: ${u.razao_social || 'N/A'}`);
      console.log(`   Setor: ${u.setor || 'N/A'}`);
      console.log(`   Endereço: ${u.endereco || 'N/A'}`);
      console.log(`   Bairro: ${u.bairro?.nome || 'N/A'} (ID: ${u.id_bairro || 'N/A'})`);
      console.log(`   Coordenadas: ${u.latitude}, ${u.longitude}`);
      console.log(`   Ativo: ${u.ativo ? '✅ SIM' : '❌ NÃO'}`);
      console.log(`   Categorias: ${u.categorias.length > 0 ? u.categorias.map(c => c.categoria.nome + (c.categoria.subcategoria ? ' - ' + c.categoria.subcategoria : '')).join(', ') : '⚠️  SEM CATEGORIA'}`);
      console.log(`   Data Cadastro: ${u.data_cadastro || 'N/A'}`);
      console.log(`   Data Vencimento: ${u.data_vencimento || 'N/A'}`);
      console.log('');

      // Diagnóstico de problemas
      const problemas = [];
      if (!u.ativo) problemas.push('❌ INATIVO');
      if (!u.latitude || !u.longitude) problemas.push('❌ SEM COORDENADAS');
      if (u.categorias.length === 0) problemas.push('⚠️  SEM CATEGORIA');
      if (!u.bairro) problemas.push('⚠️  SEM BAIRRO');

      if (problemas.length > 0) {
        console.log(`   🚨 PROBLEMAS DETECTADOS:`);
        problemas.forEach(p => console.log(`      ${p}`));
        console.log('');
      }
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  }
}

buscarUnidade()
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
