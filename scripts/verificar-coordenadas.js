/**
 * Script para verificar coordenadas de unidades
 * Identifica coordenadas inválidas ou suspeitas
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verificarCoordenadas(iconeNome = null) {
  console.log('🔍 VERIFICAÇÃO DE COORDENADAS\n');
  console.log('='.repeat(70) + '\n');

  try {
    let unidades;

    if (iconeNome) {
      // Buscar ícone específico
      const icone = await prisma.pROD_Icone.findFirst({
        where: { nome: { contains: iconeNome } }
      });

      if (!icone) {
        console.log(`❌ Ícone "${iconeNome}" não encontrado\n`);
        return;
      }

      console.log(`🎨 Analisando unidades com ícone: "${icone.nome}"\n`);

      unidades = await prisma.pROD_UnidadeTuristica.findMany({
        where: { icone_url: icone.url },
        select: {
          id: true,
          nome: true,
          latitude: true,
          longitude: true,
          ativo: true,
          endereco: true
        },
        orderBy: { nome: 'asc' }
      });
    } else {
      console.log('📍 Analisando TODAS as unidades\n');

      unidades = await prisma.pROD_UnidadeTuristica.findMany({
        select: {
          id: true,
          nome: true,
          latitude: true,
          longitude: true,
          ativo: true,
          endereco: true,
          icone_url: true
        },
        orderBy: { nome: 'asc' }
      });
    }

    console.log(`Total de unidades: ${unidades.length}\n`);
    console.log('='.repeat(70) + '\n');

    // Verificar coordenadas suspeitas
    const problemas = [];

    unidades.forEach(u => {
      const lat = parseFloat(u.latitude);
      const lon = parseFloat(u.longitude);

      let problema = null;

      // Coordenadas nulas ou zero
      if (!lat || !lon || lat === 0 || lon === 0) {
        problema = '❌ Coordenadas nulas ou zero';
      }
      // Muito longe de Corumbá (lat: -19, lon: -57)
      // Tolerância de 10 graus
      else if (Math.abs(lat + 19) > 10 || Math.abs(lon + 57) > 10) {
        problema = '⚠️  Muito distante de Corumbá (mais de 1000km)';
      }
      // Coordenadas positivas (suspeito - Brasil é negativo)
      else if (lat > 0 || lon > 0) {
        problema = '⚠️  Coordenadas positivas (Brasil deveria ter coords negativas)';
      }

      if (problema) {
        problemas.push({ ...u, problema, lat, lon });
      }
    });

    if (problemas.length > 0) {
      console.log('🚨 PROBLEMAS ENCONTRADOS:\n');
      problemas.forEach(u => {
        console.log(`📍 ${u.nome} (ID: ${u.id})`);
        console.log(`   ${u.problema}`);
        console.log(`   Coordenadas: Lat ${u.lat}, Lon ${u.lon}`);
        console.log(`   Endereço: ${u.endereco || 'N/A'}`);
        console.log(`   Ativo: ${u.ativo ? 'Sim' : 'Não'}`);
        console.log('');
      });

      console.log(`📊 Total de problemas: ${problemas.length} de ${unidades.length} unidades\n`);
    } else {
      console.log('✅ Todas as coordenadas parecem válidas!\n');
    }

    console.log('='.repeat(70) + '\n');

    // Mostrar estatísticas
    const unidadesValidas = unidades.filter(u => {
      const lat = parseFloat(u.latitude);
      const lon = parseFloat(u.longitude);
      return lat && lon && lat !== 0 && lon !== 0;
    });

    if (unidadesValidas.length > 0) {
      console.log('📊 ESTATÍSTICAS (unidades válidas):\n');

      const lats = unidadesValidas.map(u => parseFloat(u.latitude));
      const lons = unidadesValidas.map(u => parseFloat(u.longitude));

      console.log(`   Latitude mínima: ${Math.min(...lats).toFixed(6)}`);
      console.log(`   Latitude máxima: ${Math.max(...lats).toFixed(6)}`);
      console.log(`   Longitude mínima: ${Math.min(...lons).toFixed(6)}`);
      console.log(`   Longitude máxima: ${Math.max(...lons).toFixed(6)}`);
      console.log('');
      console.log(`   Centro aproximado: ${(Math.max(...lats) + Math.min(...lats)) / 2}, ${(Math.max(...lons) + Math.min(...lons)) / 2}`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
const iconeNome = process.argv[2]; // Pode passar nome do ícone como argumento (null = todas)

verificarCoordenadas(iconeNome)
  .then(() => {
    console.log('✅ Verificação concluída\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
