require('dotenv').config();

const XLSX = require('xlsx');
const path = require('path');
const { PrismaClient } = require('@mapatur/database');

const prisma = new PrismaClient();

// Coordenadas padrão - Centro de Corumbá
const DEFAULT_LAT = -19.0078;
const DEFAULT_LNG = -57.6547;

// Converter data do Excel para Date
function excelDateToJSDate(excelDate) {
  if (!excelDate || typeof excelDate !== 'number') return null;
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  return date;
}

// Tratar coordenadas
function parseCoordinate(value) {
  if (!value || value === null) return null;

  // Se for número muito grande, dividir para obter o valor correto
  let coord = parseFloat(value);

  // Se o valor absoluto for maior que 1000, está sem separador decimal
  if (Math.abs(coord) > 1000) {
    // Contar quantos dígitos tem
    const str = Math.abs(coord).toString();
    // Dividir por 10^(dígitos - 2) para deixar 2 dígitos antes da vírgula
    const divisor = Math.pow(10, str.length - 2);
    coord = coord / divisor;
  }

  return coord;
}

// Limpar texto (remover "----------------", null, etc)
function cleanText(value) {
  if (!value || value === null) return null;
  const str = value.toString().trim();
  if (str === '----------------' || str === 'null' || str === '') return null;
  return str;
}

// Mapear setor da planilha para o sistema
function mapSetor(setor) {
  if (!setor) return null;

  const mapa = {
    'AGÊNCIA VIAGENS': 'AGÊNCIA DE VIAGENS',
    'HOTEL': 'HOTEL',
    'POUSADA': 'POUSADA',
    'RESTAURANTE': 'RESTAURANTE',
    'LANCHONETE': 'LANCHONETE',
    'BAR': 'BAR',
    'PONTO TURÍSTICO': 'PONTO TURÍSTICO',
    'MUSEU': 'MUSEU',
    'GALERIA': 'GALERIA',
    'COMÉRCIO': 'COMÉRCIO',
    'ARTESANATO': 'ARTESANATO',
    'TRANSPORTE TURÍSTICO': 'TRANSPORTE TURÍSTICO',
    'GUIA DE TURISMO': 'GUIA DE TURISMO',
  };

  return mapa[setor.toUpperCase()] || 'OUTRO';
}

async function importUnidades() {
  try {
    const excelPath = path.join(__dirname, '..', 'Mapas_Tur_2026_01_20.xlsx');

    console.log('📁 Lendo planilha:', excelPath);

    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });

    console.log(`📊 Total de registros na planilha: ${data.length}\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      try {
        // Processar coordenadas
        let latitude = parseCoordinate(row['LATITUDE']);
        let longitude = parseCoordinate(row['LONGITUDE']);

        // Se coordenadas inválidas, usar padrão
        if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
          console.log(`⚠️  Linha ${i + 1}: Coordenadas inválidas, usando padrão do centro de Corumbá`);
          latitude = DEFAULT_LAT;
          longitude = DEFAULT_LNG;
        }

        // Processar datas
        const dataCadastro = excelDateToJSDate(row['INICIO VIG.']);
        const dataVencimento = excelDateToJSDate(row['VENCIMENTO']);

        // Buscar bairro
        let idBairro = null;
        const nomeBairro = cleanText(row['Bairro']);
        if (nomeBairro) {
          const bairro = await prisma.pROD_Bairro.findFirst({
            where: { nome: nomeBairro }
          });
          if (bairro) {
            idBairro = bairro.id;
          }
        }

        // Criar unidade
        const unidadeData = {
          nome: cleanText(row['Nome']) || cleanText(row['NOME FANTASIA']) || `Unidade ${i + 1}`,
          nome_fantasia: cleanText(row['NOME FANTASIA']),
          razao_social: cleanText(row['RAZÃO SOCIAL']),
          cnpj: cleanText(row['Nº DO CADASTRO']),
          setor: mapSetor(row['SETOR']),
          endereco: cleanText(row['Endereço']),
          id_bairro: idBairro,
          latitude: latitude,
          longitude: longitude,
          telefone: cleanText(row['Contato']),
          whatsapp: cleanText(row['Contato']), // Usando o mesmo contato
          horario_funcionamento: cleanText(row['HORÁRIO DE FUNCIONAMENT0']),
          descricao_servicos: cleanText(row['Serviço']),
          data_cadastro: dataCadastro,
          data_vencimento: dataVencimento,
          ativo: true,
        };

        console.log(`\n📍 [${i + 1}/${data.length}] Importando: ${unidadeData.nome}`);

        const unidade = await prisma.pROD_UnidadeTuristica.create({
          data: unidadeData,
        });

        console.log(`   ✅ Unidade criada com ID: ${unidade.id}`);

        // Criar redes sociais
        const redesSociais = [];

        const instagram = cleanText(row['Instagram']);
        if (instagram) {
          redesSociais.push({ nome_rede: 'Instagram', url_perfil: instagram });
        }

        const facebook = cleanText(row['Facebook']);
        if (facebook) {
          redesSociais.push({ nome_rede: 'Facebook', url_perfil: facebook });
        }

        const website = cleanText(row['Website']);
        if (website) {
          redesSociais.push({ nome_rede: 'Website', url_perfil: website });
        }

        // Criar redes sociais (máximo 3)
        for (const rede of redesSociais.slice(0, 3)) {
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
        const errorMsg = `Linha ${i + 1} (${row['Nome'] || row['NOME FANTASIA']}): ${error.message}`;
        errors.push(errorMsg);
        console.error(`   ❌ ERRO: ${errorMsg}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA IMPORTAÇÃO');
    console.log('='.repeat(60));
    console.log(`✅ Sucesso: ${successCount} unidades`);
    console.log(`❌ Erros: ${errorCount} unidades`);

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
importUnidades();
