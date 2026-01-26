require('dotenv').config();

const XLSX = require('xlsx');
const path = require('path');
const { PrismaClient } = require('@mapatur/database');

const prisma = new PrismaClient();

// Limpar texto (remover "----------------", null, etc)
function cleanText(value) {
  if (!value || value === null) return null;
  const str = value.toString().trim();
  if (str === '----------------' || str === 'null' || str === '' || str === '--------------------------') return null;
  return str;
}

// Tratar coordenadas
function parseCoordinate(value) {
  if (!value || value === null) return null;

  let coord = parseFloat(value);

  // Verificar se é um número válido
  if (isNaN(coord)) return null;

  return coord;
}

async function importPontosEmergencia() {
  try {
    const excelPath = path.join(__dirname, '..', 'Mapas_Tur_2026_01_26_PontosdeEmergencia_Preenchido.xlsx');

    console.log('📁 Lendo planilha:', excelPath);

    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: null });

    console.log(`📊 Total de registros brutos: ${rawData.length}\n`);

    // A primeira linha é o cabeçalho, vamos pular ela
    const data = rawData.slice(1);

    console.log(`📊 Total de pontos de emergência para importar: ${data.length}\n`);

    // Buscar ou criar a categoria principal
    console.log('🏷️  Verificando categoria...');
    let categoria = await prisma.pROD_Categoria.findFirst({
      where: {
        nome: 'Serviços de Apoio e Emergência',
        subcategoria: null
      }
    });

    if (!categoria) {
      console.log('   Criando categoria "Serviços de Apoio e Emergência"...');
      categoria = await prisma.pROD_Categoria.create({
        data: {
          nome: 'Serviços de Apoio e Emergência',
          subcategoria: null,
          ativo: true,
          ordem: 0
        }
      });
      console.log(`   ✅ Categoria criada com ID: ${categoria.id}`);
    } else {
      console.log(`   ✅ Categoria encontrada com ID: ${categoria.id}`);
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      try {
        // Mapear os campos do Excel
        const item = row['__EMPTY'];
        const setor = cleanText(row['__EMPTY_1']);
        const nomeFantasia = cleanText(row['__EMPTY_2']);
        const razaoSocial = cleanText(row['__EMPTY_3']);
        const cadastro = cleanText(row['__EMPTY_4']);
        const nome = cleanText(row['__EMPTY_5']);
        const categoriaExcel = cleanText(row['__EMPTY_6']);
        const endereco = cleanText(row['__EMPTY_9']);
        const nomeBairro = cleanText(row['__EMPTY_10']);
        const cep = cleanText(row['__EMPTY_11']);
        const latitude = parseCoordinate(row['__EMPTY_12']);
        const longitude = parseCoordinate(row['__EMPTY_13']);
        const instagram = cleanText(row['__EMPTY_14']);
        const facebook = cleanText(row['__EMPTY_15']);
        const website = cleanText(row['__EMPTY_16']);
        const servico = cleanText(row['__EMPTY_17']);
        const contato = cleanText(row['__EMPTY_18']);
        const horario = cleanText(row['__EMPTY_19']);

        // Validar campos obrigatórios
        if (!nome) {
          throw new Error('Nome é obrigatório');
        }

        if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
          throw new Error('Coordenadas inválidas ou ausentes');
        }

        // Buscar bairro
        let idBairro = null;
        if (nomeBairro) {
          const bairro = await prisma.pROD_Bairro.findFirst({
            where: { nome: nomeBairro }
          });
          if (bairro) {
            idBairro = bairro.id;
          } else {
            // Criar o bairro se não existir
            const novoBairro = await prisma.pROD_Bairro.create({
              data: {
                nome: nomeBairro,
                ativo: true
              }
            });
            idBairro = novoBairro.id;
            console.log(`   🏘️  Novo bairro criado: ${nomeBairro} (ID: ${idBairro})`);
          }
        }

        // Criar unidade turística
        const unidadeData = {
          nome: nome,
          nome_fantasia: nomeFantasia,
          razao_social: razaoSocial,
          cnpj: cadastro,
          setor: 'APOIO E EMERGÊNCIA',
          endereco: endereco,
          id_bairro: idBairro,
          latitude: latitude,
          longitude: longitude,
          telefone: contato,
          whatsapp: contato, // Usando o mesmo contato
          horario_funcionamento: horario,
          descricao_servicos: servico,
          ativo: true,
        };

        console.log(`\n🚨 [${i + 1}/${data.length}] Importando: ${unidadeData.nome}`);

        const unidade = await prisma.pROD_UnidadeTuristica.create({
          data: unidadeData,
        });

        console.log(`   ✅ Unidade criada com ID: ${unidade.id}`);

        // Associar à categoria
        await prisma.junction_UnidadeTuristica_Categoria.create({
          data: {
            id_unidade: unidade.id,
            id_categoria: categoria.id
          }
        });

        console.log(`   🏷️  Categoria associada: ${categoria.nome}`);

        // Criar redes sociais
        const redesSociais = [];

        if (instagram) {
          redesSociais.push({ nome_rede: 'Instagram', url_perfil: instagram });
        }

        if (facebook) {
          redesSociais.push({ nome_rede: 'Facebook', url_perfil: facebook });
        }

        if (website) {
          redesSociais.push({ nome_rede: 'Website', url_perfil: website });
        }

        // Criar redes sociais
        for (const rede of redesSociais) {
          await prisma.pROD_UnidadeTuristica_RedeSocial.create({
            data: {
              id_unidade: unidade.id,
              nome_rede: rede.nome_rede,
              url_perfil: rede.url_perfil,
            },
          });
          console.log(`   🔗 Rede social adicionada: ${rede.nome_rede}`);
        }

        successCount++;

      } catch (error) {
        errorCount++;
        const errorMsg = `Linha ${i + 2} (${row['__EMPTY_5'] || 'sem nome'}): ${error.message}`;
        errors.push(errorMsg);
        console.error(`   ❌ ERRO: ${errorMsg}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA IMPORTAÇÃO');
    console.log('='.repeat(60));
    console.log(`✅ Sucesso: ${successCount} pontos de emergência`);
    console.log(`❌ Erros: ${errorCount} pontos de emergência`);

    if (errors.length > 0) {
      console.log('\n⚠️  ERROS ENCONTRADOS:');
      errors.forEach(err => console.log(`   - ${err}`));
    }

    console.log('\n✨ Importação concluída!');

  } catch (error) {
    console.error('❌ Erro fatal:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar importação
importPontosEmergencia();
