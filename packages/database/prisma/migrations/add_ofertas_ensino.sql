-- Migration: Add ofertas_ensino tables
-- Created: 2026-01-12
-- Description: Cria tabelas para gerenciar ofertas de ensino das escolas

-- Criar tabela de ofertas de ensino
CREATE TABLE IF NOT EXISTS `prod_oferta_ensino` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(100) NOT NULL UNIQUE,
  `ativo` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `prod_oferta_ensino_nome_idx` (`nome`),
  INDEX `prod_oferta_ensino_ativo_idx` (`ativo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar tabela junction escola-oferta_ensino
CREATE TABLE IF NOT EXISTS `junction_escola_oferta_ensino` (
  `id_escola` INT NOT NULL,
  `id_oferta_ensino` INT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id_escola`, `id_oferta_ensino`),
  INDEX `junction_escola_oferta_ensino_id_escola_idx` (`id_escola`),
  INDEX `junction_escola_oferta_ensino_id_oferta_ensino_idx` (`id_oferta_ensino`),
  CONSTRAINT `junction_escola_oferta_ensino_id_escola_fkey`
    FOREIGN KEY (`id_escola`) REFERENCES `prod_escola`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `junction_escola_oferta_ensino_id_oferta_ensino_fkey`
    FOREIGN KEY (`id_oferta_ensino`) REFERENCES `prod_oferta_ensino`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir ofertas de ensino padrão
INSERT INTO `prod_oferta_ensino` (`nome`, `ativo`) VALUES
  ('Educação Infantil', TRUE),
  ('Ensino Fundamental I (1º ao 5º ano)', TRUE),
  ('Ensino Fundamental II (6º ao 9º ano)', TRUE),
  ('Ensino Médio', TRUE),
  ('EJA - Educação de Jovens e Adultos', TRUE),
  ('Educação Especial', TRUE),
  ('Ensino Profissionalizante', TRUE)
ON DUPLICATE KEY UPDATE nome = VALUES(nome);
