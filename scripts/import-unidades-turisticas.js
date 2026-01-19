const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('======================================');
  console.log('IMPORTAÇÃO DE UNIDADES TURÍSTICAS');
  console.log('======================================\n');

  // 1. Ler planilha
  console.log('📄 Lendo planilha Excel...');
  const workbook = XLSX.readFile('C:\\dev\\mapa_turismo_corumba\\Mapas_Turismo_Corumba_Pontos.xlsx');
  const sheetName = workbook.SheetNames[0];
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  console.log(`✓ Planilha lida com sucesso`);
  console.log(`  Aba: ${sheetName}`);
  console.log(`  Total de registros: ${data.length}\n`);

  // 2. Buscar/Criar categorias (estrutura simplificada)
  console.log('📂 Processando categorias...');
  const categoriasMap = new Map();

  for (const row of data) {
    if (!row.Categoria) continue;

    // Criar categoria completa (nome + subcategoria)
    const nomeCategoria = row.Categoria;
    const nomeSubcategoria = (row.Subcategoria && row.Subcategoria !== '--------------------------')
      ? row.Subcategoria
      : null;

    const key = `${nomeCategoria}::${nomeSubcategoria || 'NULL'}`;

    if (!categoriasMap.has(key)) {
      try {
        const categoria = await prisma.pROD_Categoria.upsert({
          where: {
            nome_subcategoria: {
              nome: nomeCategoria,
              subcategoria: nomeSubcategoria
            }
          },
          update: {},
          create: {
            nome: nomeCategoria,
            subcategoria: nomeSubcategoria
          }
        });
        categoriasMap.set(key, categoria);
        console.log(`  ✓ Categoria: ${nomeCategoria}${nomeSubcategoria ? ' → ' + nomeSubcategoria : ''}`);
      } catch (error) {
        console.error(`  ✗ Erro ao criar categoria ${nomeCategoria}:`, error.message);
      }
    }
  }

  console.log(`\n✓ Categorias processadas: ${categoriasMap.size}\n`);

  // 3. Importar unidades
  console.log('🏢 Importando unidades turísticas...\n');
  let importadas = 0;
  let erros = 0;
  const errosDetalhados = [];

  for (const row of data) {
    try {
      // CORRIGIR coordenadas (dividir por 10^15)
      const latitude = row.LATITUDE / 1000000000000000;
      const longitude = row.LONGITUDE / 1000000000000000;

      // Validar coordenadas
      if (!row.LATITUDE || !row.LONGITUDE || isNaN(latitude) || isNaN(longitude)) {
        throw new Error(`Coordenadas ausentes ou inválidas`);
      }
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw new Error(`Coordenadas fora do intervalo válido: (${latitude}, ${longitude})`);
      }

      // Buscar bairro
      let bairroId = null;
      if (row.Bairro) {
        const bairro = await prisma.pROD_Bairro.findFirst({
          where: {
            nome: row.Bairro
          }
        });
        bairroId = bairro?.id;

        if (!bairroId) {
          console.log(`  ⚠ Bairro "${row.Bairro}" não encontrado para ${row.Nome}`);
        }
      }

      // Converter datas Excel para DateTime (Excel conta dias desde 1900-01-01)
      const dataInicio = row['INICIO VIG.']
        ? new Date((row['INICIO VIG.'] - 25569) * 86400 * 1000)
        : null;
      const dataVencimento = row['VENCIMENTO']
        ? new Date((row['VENCIMENTO'] - 25569) * 86400 * 1000)
        : null;

      // Criar unidade
      const unidade = await prisma.pROD_UnidadeTuristica.create({
        data: {
          nome: row.Nome || 'Sem nome',
          nome_fantasia: row['NOME FANTASIA'],
          razao_social: row['RAZÃO SOCIAL'],
          cnpj: row['Nº DO CADASTRO'],
          setor: row.SETOR,
          endereco: row.Endereço,
          bairro: bairroId ? { connect: { id: bairroId } } : undefined,
          latitude: latitude,
          longitude: longitude,
          telefone: row.Contato ? String(row.Contato) : null,
          whatsapp: row.Contato ? String(row.Contato) : null,
          horario_funcionamento: row['HORÁRIO DE FUNCIONAMENT0'],
          descricao_servicos: row.Serviço,
          data_cadastro: dataInicio,
          data_vencimento: dataVencimento,
          ativo: true
        }
      });

      // Associar categoria (agora inclui subcategoria no mesmo registro)
      if (row.Categoria) {
        const nomeSubcategoria = (row.Subcategoria && row.Subcategoria !== '--------------------------')
          ? row.Subcategoria
          : null;
        const key = `${row.Categoria}::${nomeSubcategoria || 'NULL'}`;
        const categoria = categoriasMap.get(key);

        if (categoria) {
          await prisma.junction_UnidadeTuristica_Categoria.create({
            data: {
              id_unidade: unidade.id,
              id_categoria: categoria.id
            }
          });
        }
      }

      // Criar redes sociais
      const redesSociais = [];
      if (row.Instagram) redesSociais.push({ nome_rede: 'Instagram', url_perfil: row.Instagram });
      if (row.Facebook) redesSociais.push({ nome_rede: 'Facebook', url_perfil: row.Facebook });
      if (row.Website) redesSociais.push({ nome_rede: 'Website', url_perfil: row.Website });

      for (const rede of redesSociais) {
        await prisma.pROD_UnidadeTuristica_RedeSocial.create({
          data: {
            id_unidade: unidade.id,
            ...rede
          }
        });
      }

      importadas++;
      console.log(`  ✓ [${importadas}/${data.length}] ${row.Nome}`);

    } catch (error) {
      erros++;
      const mensagemErro = `${row.Nome || 'Sem nome'}: ${error.message}`;
      errosDetalhados.push(mensagemErro);
      console.error(`  ✗ [${importadas + erros}/${data.length}] ${mensagemErro}`);
    }
  }

  console.log('\n======================================');
  console.log('RESUMO DA IMPORTAÇÃO');
  console.log('======================================');
  console.log(`Total de registros na planilha: ${data.length}`);
  console.log(`✓ Importadas com sucesso: ${importadas} (${((importadas/data.length)*100).toFixed(1)}%)`);
  console.log(`✗ Erros: ${erros} (${((erros/data.length)*100).toFixed(1)}%)`);

  if (errosDetalhados.length > 0) {
    console.log('\n--- Detalhes dos erros ---');
    errosDetalhados.forEach((erro, index) => {
      console.log(`${index + 1}. ${erro}`);
    });
  }

  console.log('\n✅ Importação concluída!\n');
}

main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error('\n❌ ERRO FATAL:', error);
    prisma.$disconnect();
    process.exit(1);
  });
