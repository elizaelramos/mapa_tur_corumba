require('dotenv').config();

const XLSX = require('xlsx');
const path = require('path');
const { PrismaClient } = require('@mapatur/database');

const prisma = new PrismaClient();

// Limpar texto
function cleanText(value) {
  if (!value || value === null) return null;
  const str = value.toString().trim();
  if (str === '----------------' || str === 'null' || str === '' || str === '-----------' || str === 'Não localizei') {
    return null;
  }
  return str;
}

async function associarCategorias() {
  try {
    const excelPath = path.join(__dirname, '..', 'Mapas_Tur_2026_01_20.xlsx');

    console.log('📁 Lendo planilha:', excelPath);

    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });

    console.log(`📊 Total de registros na planilha: ${data.length}\n`);

    // 1. Coletar todas as combinações categoria + subcategoria da planilha
    const categoriasMap = new Map();

    data.forEach(row => {
      const categoria = cleanText(row['Categoria']);
      const subcategoria = cleanText(row['Subcategoria']);

      if (categoria) {
        const key = `${categoria}|${subcategoria || ''}`;
        if (!categoriasMap.has(key)) {
          categoriasMap.set(key, { nome: categoria, subcategoria });
        }
      }
    });

    console.log(`📋 Encontradas ${categoriasMap.size} combinações únicas de categoria/subcategoria\n`);

    // 2. Criar categorias que não existem
    console.log('🔨 Criando categorias no banco de dados...\n');

    const categoriaIds = new Map();
    let criadas = 0;
    let existentes = 0;

    for (const [key, { nome, subcategoria }] of categoriasMap.entries()) {
      // Verificar se já existe
      const categoriaExistente = await prisma.pROD_Categoria.findFirst({
        where: {
          nome: nome,
          subcategoria: subcategoria
        }
      });

      if (categoriaExistente) {
        categoriaIds.set(key, categoriaExistente.id);
        existentes++;
        console.log(`   ✓ Já existe: ${nome}${subcategoria ? ` → ${subcategoria}` : ''} (ID ${categoriaExistente.id})`);
      } else {
        const novaCategoria = await prisma.pROD_Categoria.create({
          data: {
            nome: nome,
            subcategoria: subcategoria,
            ativo: true,
            ordem: 0
          }
        });
        categoriaIds.set(key, novaCategoria.id);
        criadas++;
        console.log(`   ✅ Criada: ${nome}${subcategoria ? ` → ${subcategoria}` : ''} (ID ${novaCategoria.id})`);
      }
    }

    console.log(`\n📊 Categorias: ${criadas} criadas, ${existentes} já existiam\n`);

    // 3. Buscar todas as unidades importadas
    const unidades = await prisma.pROD_UnidadeTuristica.findMany({
      where: {
        id: {
          gte: 63 // IDs das unidades importadas começam em 63
        }
      },
      select: {
        id: true,
        nome: true
      }
    });

    console.log(`📍 Total de unidades importadas: ${unidades.length}\n`);

    // 4. Associar categorias às unidades
    console.log('🔗 Associando categorias às unidades...\n');

    let associadas = 0;
    let semCategoria = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const nomeUnidade = cleanText(row['Nome']) || cleanText(row['NOME FANTASIA']);

      // Encontrar a unidade correspondente
      const unidade = unidades.find(u => u.nome === nomeUnidade);

      if (!unidade) {
        console.log(`   ⚠️  Unidade não encontrada: ${nomeUnidade}`);
        continue;
      }

      const categoria = cleanText(row['Categoria']);
      const subcategoria = cleanText(row['Subcategoria']);

      if (!categoria) {
        semCategoria++;
        continue;
      }

      const key = `${categoria}|${subcategoria || ''}`;
      const categoriaId = categoriaIds.get(key);

      if (!categoriaId) {
        console.log(`   ⚠️  Categoria não encontrada: ${key}`);
        continue;
      }

      // Verificar se já existe a associação
      const associacaoExistente = await prisma.junction_UnidadeTuristica_Categoria.findFirst({
        where: {
          id_unidade: unidade.id,
          id_categoria: categoriaId
        }
      });

      if (associacaoExistente) {
        continue;
      }

      // Criar associação
      await prisma.junction_UnidadeTuristica_Categoria.create({
        data: {
          id_unidade: unidade.id,
          id_categoria: categoriaId
        }
      });

      associadas++;
      console.log(`   ✅ [${i + 1}/${data.length}] ${nomeUnidade} → ${categoria}${subcategoria ? ` → ${subcategoria}` : ''}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO');
    console.log('='.repeat(60));
    console.log(`✅ Unidades com categoria associada: ${associadas}`);
    console.log(`⚠️  Unidades sem categoria na planilha: ${semCategoria}`);
    console.log(`📋 Categorias criadas: ${criadas}`);
    console.log(`📋 Categorias já existentes: ${existentes}`);
    console.log('\n✨ Processo concluído!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

associarCategorias();
