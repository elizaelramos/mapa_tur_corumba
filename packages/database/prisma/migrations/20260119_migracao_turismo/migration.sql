-- ============================================================================
-- MIGRAÇÃO: Sistema de Escolas → Unidades Turísticas
-- Data: 2026-01-19
-- Descrição: Reestrutura o banco para gestão de turismo
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- BACKUP: Criar tabelas temporárias antes de deletar
CREATE TABLE IF NOT EXISTS backup_prod_escola AS SELECT * FROM prod_escola;
CREATE TABLE IF NOT EXISTS backup_prod_professor AS SELECT * FROM prod_professor;
CREATE TABLE IF NOT EXISTS backup_junction_escola_professor AS SELECT * FROM junction_escola_professor;
CREATE TABLE IF NOT EXISTS backup_prod_oferta_ensino AS SELECT * FROM prod_oferta_ensino;
CREATE TABLE IF NOT EXISTS backup_junction_escola_oferta_ensino AS SELECT * FROM junction_escola_oferta_ensino;
CREATE TABLE IF NOT EXISTS backup_prod_escola_redesocial AS SELECT * FROM prod_escola_redesocial;

-- 1. DELETAR DADOS DE ESCOLAS (mantém estrutura para backup)
TRUNCATE TABLE junction_escola_professor;
TRUNCATE TABLE junction_escola_oferta_ensino;
TRUNCATE TABLE prod_escola_redesocial;
TRUNCATE TABLE prod_escola;
TRUNCATE TABLE prod_professor;
TRUNCATE TABLE prod_oferta_ensino;

-- 2. DELETAR TABELAS ANTIGAS
DROP TABLE IF EXISTS junction_escola_professor;
DROP TABLE IF EXISTS junction_escola_oferta_ensino;
DROP TABLE IF EXISTS prod_escola_redesocial;
DROP TABLE IF EXISTS prod_escola;
DROP TABLE IF EXISTS prod_professor;
DROP TABLE IF EXISTS prod_oferta_ensino;

-- 3. CRIAR NOVA ESTRUTURA - Unidades Turísticas
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. CRIAR SISTEMA DE CATEGORIAS (Simplificado)
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. CRIAR TABELA JUNCTION (Única)
CREATE TABLE junction_unidade_categoria (
  id_unidade INT NOT NULL,
  id_categoria INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id_unidade, id_categoria),
  INDEX idx_unidade (id_unidade),
  INDEX idx_categoria (id_categoria),
  FOREIGN KEY (id_unidade) REFERENCES prod_unidade_turistica(id) ON DELETE CASCADE,
  FOREIGN KEY (id_categoria) REFERENCES prod_categoria(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. CRIAR REDES SOCIAIS
CREATE TABLE prod_unidade_turistica_redesocial (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_unidade INT NOT NULL,
  nome_rede VARCHAR(50) NOT NULL,
  url_perfil VARCHAR(500) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_unidade (id_unidade),
  FOREIGN KEY (id_unidade) REFERENCES prod_unidade_turistica(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- Migração concluída com sucesso
-- Próximo passo: Executar script de importação das unidades turísticas
