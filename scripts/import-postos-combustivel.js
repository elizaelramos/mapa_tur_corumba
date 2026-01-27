require('dotenv').config();
const { prisma } = require('@mapatur/database');
const fs = require('fs');
const path = require('path');

// Função para ler e parsear o arquivo markdown
function parsePostosFromMarkdown(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim() !== '');

  const postos = [];

  // Pula a primeira linha (cabeçalho)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Buscar coordenadas usando regex para latitude e longitude
    // Formato esperado: -19.123456 e -57.123456
    const coordRegex = /-\d+\.\d+/g;
    const coords = line.match(coordRegex);

    if (!coords || coords.length < 2) {
      console.log(`  ⚠️  Linha sem coordenadas válidas: ${line.substring(0, 50)}...`);
      continue;
    }

    const latitude = parseFloat(coords[0]);
    const longitude = parseFloat(coords[1]);

    // Extrair a parte antes das coordenadas
    const parteAntesCoordenadas = line.split(coords[0])[0];
    const parts = parteAntesCoordenadas.split(' - ').map(p => p.trim()).filter(p => p);

    if (parts.length >= 3) {
      // Formato: Nome - Endereço - Bairro
      const nome = parts[0];
      const rua = parts[parts.length - 2]; // Penúltima parte
      const bairro = parts[parts.length - 1]; // Última parte

      // Se houver partes extras entre nome e endereço, juntar ao nome
      let nomeCompleto = nome;
      if (parts.length > 3) {
        // Juntar as partes do meio ao nome
        const partesExtras = parts.slice(1, parts.length - 2);
        nomeCompleto = [nome, ...partesExtras].join(' - ');
      }

      const endereco = `${rua} - ${bairro}`;

      postos.push({
        nome: nomeCompleto,
        endereco,
        bairro,
        latitude,
        longitude
      });
    } else if (parts.length === 2) {
      // Formato: Nome - Bairro (sem rua específica)
      const nome = parts[0];
      const bairro = parts[1];
      const endereco = bairro;

      postos.push({
        nome,
        endereco,
        bairro,
        latitude,
        longitude
      });
    }
  }

  return postos;
}

async function importarPostosCombustivel() {
  console.log('🚀 Iniciando importação de Postos de Combustível...\n');

  try {
    // 1. Ler dados do arquivo markdown
    const filePath = path.join(__dirname, '..', 'uploads', 'Postos_combustivel.md');
    console.log(`📄 Lendo arquivo: ${filePath}`);

    const postos = parsePostosFromMarkdown(filePath);
    console.log(`✅ Encontrados ${postos.length} postos no arquivo\n`);

    // 2. Criar ou buscar categoria "Postos de Combustível"
    console.log('🏷️  Verificando categoria...');
    const categoria = await prisma.pROD_Categoria.upsert({
      where: {
        nome_subcategoria: {
          nome: 'Serviços de Apoio',
          subcategoria: 'Postos de Combustível'
        }
      },
      update: {},
      create: {
        nome: 'Serviços de Apoio',
        subcategoria: 'Postos de Combustível',
        ativo: true,
        ordem: 100
      }
    });
    console.log(`✅ Categoria: ${categoria.nome} - ${categoria.subcategoria} (ID: ${categoria.id})\n`);

    // 3. Buscar bairro "Centro" como padrão (pode ser ajustado)
    const bairroDefault = await prisma.pROD_Bairro.findFirst({
      where: { nome: 'Centro' }
    });

    // 4. Importar cada posto
    console.log('📍 Importando postos...\n');
    let sucessos = 0;
    let erros = 0;

    for (const posto of postos) {
      try {
        console.log(`  → ${posto.nome}`);

        // Verificar se já existe
        const existente = await prisma.pROD_UnidadeTuristica.findFirst({
          where: {
            nome: posto.nome,
            setor: 'POSTO DE COMBUSTÍVEL'
          }
        });

        if (existente) {
          console.log(`    ⚠️  Já existe (ID: ${existente.id})`);
          sucessos++;
          continue;
        }

        // Validar coordenadas
        if (!posto.latitude || !posto.longitude ||
            posto.latitude < -90 || posto.latitude > 90 ||
            posto.longitude < -180 || posto.longitude > 180) {
          console.log(`    ⚠️  ERRO: Coordenadas inválidas`);
          erros++;
          continue;
        }

        // Usar o bairro do arquivo
        const bairroNome = posto.bairro || 'Centro';

        // Buscar bairro
        let bairro = await prisma.pROD_Bairro.findFirst({
          where: { nome: { contains: bairroNome } }
        });

        // Se não encontrar, criar o bairro
        if (!bairro) {
          console.log(`    📍 Criando bairro: ${bairroNome}`);
          bairro = await prisma.pROD_Bairro.create({
            data: {
              nome: bairroNome,
              ativo: true
            }
          });
        }

        // Criar unidade turística
        const unidade = await prisma.pROD_UnidadeTuristica.create({
          data: {
            nome: posto.nome,
            nome_fantasia: posto.nome,
            setor: 'POSTO DE COMBUSTÍVEL',
            endereco: posto.endereco,
            latitude: posto.latitude,
            longitude: posto.longitude,
            id_bairro: bairro?.id || bairroDefault?.id,
            ativo: true,
            data_cadastro: new Date()
          }
        });

        // Associar à categoria
        await prisma.junction_UnidadeTuristica_Categoria.create({
          data: {
            id_unidade: unidade.id,
            id_categoria: categoria.id
          }
        });

        console.log(`    ✅ Importado com sucesso (ID: ${unidade.id}) - Bairro: ${bairro?.nome || 'N/A'}`);
        sucessos++;

      } catch (error) {
        console.log(`    ❌ ERRO: ${error.message}`);
        erros++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 Resumo da Importação:`);
    console.log(`   ✅ Sucessos: ${sucessos}`);
    console.log(`   ❌ Erros: ${erros}`);
    console.log(`   📍 Total: ${postos.length}`);
    console.log('\n🎉 Importação concluída!\n');

  } catch (error) {
    console.error('\n❌ Erro durante a importação:', error);
    throw error;
  }
}

// Executar importação
importarPostosCombustivel()
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
