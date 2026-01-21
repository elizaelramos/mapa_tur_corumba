-- Adicionar coluna 'segmento' à tabela prod_categoria
-- Migration: Adicionar 3º nível de hierarquia (Segmento) às categorias turísticas

-- 1. Adicionar coluna segmento
ALTER TABLE `prod_categoria`
ADD COLUMN `segmento` VARCHAR(100) NULL AFTER `subcategoria`;

-- 2. Remover constraint unique antiga
ALTER TABLE `prod_categoria`
DROP INDEX IF EXISTS `prod_categoria_nome_subcategoria_key`;

-- 3. Adicionar novo constraint unique para categoria+subcategoria+segmento
ALTER TABLE `prod_categoria`
ADD UNIQUE INDEX `prod_categoria_nome_subcategoria_segmento_key` (`nome`, `subcategoria`, `segmento`);

-- 4. Adicionar índice para melhor performance de busca por subcategoria
ALTER TABLE `prod_categoria`
ADD INDEX `prod_categoria_subcategoria_idx` (`subcategoria`);

-- Commit
COMMIT;
