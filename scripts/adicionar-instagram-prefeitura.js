/**
 * Script para adicionar Instagram oficial da Prefeitura em todas as unidades
 */

import { PrismaClient } from '@mapatur/database';

const prisma = new PrismaClient();

const INSTAGRAM_URL = 'https://www.instagram.com/semedcorumba/';
const NOME_REDE = 'Instagram';

async function main() {
  console.log('🔄 Adicionando Instagram oficial da Prefeitura às unidades...\n');
  
  try {
    // Buscar todas as unidades ativas
    const unidades = await prisma.pROD_Escola.findMany({
      where: { ativo: true },
      select: {
        id: true,
        nome: true,
        redes_sociais: {
          where: {
            nome_rede: NOME_REDE
          }
        }
      },
      orderBy: {
        nome: 'asc'
      }
    });
    
    console.log(`📊 Total de unidades ativas: ${unidades.length}\n`);
    
    let adicionadas = 0;
    let jaExistentes = 0;
    let erros = 0;
    
    for (const unidade of unidades) {
      try {
        // Verificar se já existe Instagram
        if (unidade.redes_sociais.length > 0) {
          console.log(`⏭️  ID ${unidade.id}: ${unidade.nome}`);
          console.log(`   Já possui Instagram cadastrado`);
          console.log('');
          jaExistentes++;
          continue;
        }
        
        // Adicionar Instagram
        await prisma.pROD_Escola_RedeSocial.create({
          data: {
            id_escola: unidade.id,
            nome_rede: NOME_REDE,
            url_perfil: INSTAGRAM_URL
          }
        });
        
        console.log(`✅ ID ${unidade.id}: ${unidade.nome}`);
        console.log(`   Instagram adicionado: ${INSTAGRAM_URL}`);
        console.log('');
        adicionadas++;
        
      } catch (erro) {
        console.error(`❌ Erro ao processar unidade ID ${unidade.id}:`, erro.message);
        erros++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`✅ Operação concluída!`);
    console.log(`   Total de unidades: ${unidades.length}`);
    console.log(`   Instagram adicionado: ${adicionadas}`);
    console.log(`   Já existentes: ${jaExistentes}`);
    console.log(`   Erros: ${erros}`);
    console.log('='.repeat(60));
    
  } catch (erro) {
    console.error('❌ Erro ao executar script:', erro);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
