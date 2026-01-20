const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runMigration() {
  console.log('===============================================');
  console.log('APLICANDO MIGRAÇÃO: Escolas → Unidades Turísticas');
  console.log('===============================================\n');

  console.log('⚠️  ATENÇÃO: Esta operação é DESTRUTIVA!');
  console.log('    - Criará backups das tabelas antigas');
  console.log('    - Deletará todos os dados de escolas');
  console.log('    - Criará nova estrutura para turismo\n');

  try {
    // Desabilitar foreign key checks
    console.log('🔧 Desabilitando verificações de foreign key...');
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');

    // 1. Criar backups
    console.log('\n📦 Criando backups das tabelas antigas...');
    try {
      await prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS backup_prod_escola AS SELECT * FROM prod_escola');
      console.log('  ✓ Backup: prod_escola');
    } catch (e) { console.log('  ⚠ backup_prod_escola já existe ou erro:', e.message); }

    try {
      await prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS backup_prod_professor AS SELECT * FROM prod_professor');
      console.log('  ✓ Backup: prod_professor');
    } catch (e) { console.log('  ⚠ backup_prod_professor já existe ou erro:', e.message); }

    try {
      await prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS backup_junction_escola_professor AS SELECT * FROM junction_escola_professor');
      console.log('  ✓ Backup: junction_escola_professor');
    } catch (e) { console.log('  ⚠ backup_junction_escola_professor já existe ou erro:', e.message); }

    try {
      await prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS backup_prod_oferta_ensino AS SELECT * FROM prod_oferta_ensino');
      console.log('  ✓ Backup: prod_oferta_ensino');
    } catch (e) { console.log('  ⚠ backup_prod_oferta_ensino já existe ou erro:', e.message); }

    try {
      await prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS backup_junction_escola_oferta_ensino AS SELECT * FROM junction_escola_oferta_ensino');
      console.log('  ✓ Backup: junction_escola_oferta_ensino');
    } catch (e) { console.log('  ⚠ backup_junction_escola_oferta_ensino já existe ou erro:', e.message); }

    try {
      await prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS backup_prod_escola_redesocial AS SELECT * FROM prod_escola_redesocial');
      console.log('  ✓ Backup: prod_escola_redesocial');
    } catch (e) { console.log('  ⚠ backup_prod_escola_redesocial já existe ou erro:', e.message); }

    // 2. Deletar tabelas antigas
    console.log('\n🗑️  Deletando tabelas antigas...');
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS junction_escola_professor');
    console.log('  ✓ Deletada: junction_escola_professor');

    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS junction_escola_oferta_ensino');
    console.log('  ✓ Deletada: junction_escola_oferta_ensino');

    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS prod_escola_redesocial');
    console.log('  ✓ Deletada: prod_escola_redesocial');

    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS prod_escola');
    console.log('  ✓ Deletada: prod_escola');

    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS prod_professor');
    console.log('  ✓ Deletada: prod_professor');

    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS prod_oferta_ensino');
    console.log('  ✓ Deletada: prod_oferta_ensino');

    // 3. Criar tabela de unidades turísticas
    console.log('\n🏢 Criando tabela prod_unidade_turistica...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE prod_unidade_turistica (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        nome_fantasia VARCHAR(255),
        razao_social VARCHAR(255),
        cnpj VARCHAR(20),
        setor VARCHAR(100),
        endereco VARCHAR(500),
        id_bairro INT,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        telefone VARCHAR(100),
        whatsapp VARCHAR(100),
        email VARCHAR(255),
        horario_funcionamento TEXT,
        descricao_servicos TEXT,
        imagem_url VARCHAR(500),
        icone_url VARCHAR(500),
        data_cadastro DATETIME,
        data_vencimento DATETIME,
        ativo BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        INDEX idx_ativo (ativo),
        INDEX idx_latitude_longitude (latitude, longitude),
        INDEX idx_bairro (id_bairro),
        INDEX idx_setor (setor),
        FOREIGN KEY (id_bairro) REFERENCES prod_bairro(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✓ Criada: prod_unidade_turistica');

    // 4. Criar tabela de categorias
    console.log('\n📂 Criando tabela prod_categoria...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE prod_categoria (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        subcategoria VARCHAR(100),
        ativo BOOLEAN DEFAULT TRUE,
        ordem INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        UNIQUE KEY unique_nome_subcategoria (nome, subcategoria),
        INDEX idx_nome (nome),
        INDEX idx_ativo (ativo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✓ Criada: prod_categoria');

    // 5. Criar tabela junction
    console.log('\n🔗 Criando tabela junction_unidade_categoria...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE junction_unidade_categoria (
        id_unidade INT NOT NULL,
        id_categoria INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        PRIMARY KEY (id_unidade, id_categoria),
        INDEX idx_unidade (id_unidade),
        INDEX idx_categoria (id_categoria),
        FOREIGN KEY (id_unidade) REFERENCES prod_unidade_turistica(id) ON DELETE CASCADE,
        FOREIGN KEY (id_categoria) REFERENCES prod_categoria(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✓ Criada: junction_unidade_categoria');

    // 6. Criar tabela de redes sociais
    console.log('\n📱 Criando tabela prod_unidade_turistica_redesocial...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE prod_unidade_turistica_redesocial (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_unidade INT NOT NULL,
        nome_rede VARCHAR(50) NOT NULL,
        url_perfil VARCHAR(500) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        INDEX idx_unidade (id_unidade),
        FOREIGN KEY (id_unidade) REFERENCES prod_unidade_turistica(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✓ Criada: prod_unidade_turistica_redesocial');

    // Reabilitar foreign key checks
    console.log('\n🔧 Reabilitando verificações de foreign key...');
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n===============================================');
    console.log('✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('===============================================');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Executar: node scripts/import-unidades-turisticas.js');
    console.log('   2. Adaptar o backend (rotas e APIs)');
    console.log('   3. Atualizar o frontend\n');

  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
}

runMigration()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error('\n❌ Migração falhou:', error.message);
    prisma.$disconnect();
    process.exit(1);
  });
