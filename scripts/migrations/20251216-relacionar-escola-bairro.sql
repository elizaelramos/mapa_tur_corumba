-- Migration: Relacionar escola com bairro
-- Data: 2025-12-16
-- 
-- Esta migração:
-- 1. Adiciona a coluna id_bairro na tabela prod_escola
-- 2. Cria uma chave estrangeira para prod_bairro
-- 3. Remove o índice antigo do campo bairro (string)
-- 4. Adiciona novo índice para id_bairro
--
-- IMPORTANTE: Execute o script migrar-bairros-escolas.js ANTES de remover a coluna bairro

-- Adicionar coluna id_bairro na tabela prod_escola
ALTER TABLE `prod_escola` ADD COLUMN `id_bairro` INT NULL AFTER `endereco`;

-- Criar índice na coluna id_bairro
ALTER TABLE `prod_escola` ADD INDEX `prod_escola_id_bairro_idx` (`id_bairro`);

-- Adicionar chave estrangeira para prod_bairro
ALTER TABLE `prod_escola` ADD CONSTRAINT `prod_escola_id_bairro_fkey` FOREIGN KEY (`id_bairro`) REFERENCES `prod_bairro`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Nota: A coluna 'bairro' (VARCHAR) será mantida temporariamente
-- para permitir a migração de dados. Após executar o script 
-- migrar-bairros-escolas.js e verificar que tudo está correto,
-- execute a segunda parte da migração para remover essa coluna.
