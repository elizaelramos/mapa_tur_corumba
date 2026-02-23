-- ============================================================================
-- MIGRAÇÃO: Adicionar relacionamento FK icone_id em prod_unidade_turistica
-- Data: 2026-02-10
-- Descrição: Migra de icone_url (String) para icone_id (Foreign Key)
-- ============================================================================

-- Passo 1: Adicionar coluna icone_id (nullable para permitir migração gradual)
ALTER TABLE `prod_unidade_turistica`
ADD COLUMN `icone_id` INT NULL AFTER `imagem_url`;

-- Passo 2: Adicionar índice para performance
CREATE INDEX `prod_unidade_turistica_icone_id_idx` ON `prod_unidade_turistica`(`icone_id`);

-- Passo 3: Adicionar Foreign Key constraint (ON DELETE SET NULL para segurança)
ALTER TABLE `prod_unidade_turistica`
ADD CONSTRAINT `prod_unidade_turistica_icone_id_fkey`
  FOREIGN KEY (`icone_id`)
  REFERENCES `prod_icone` (`id`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- Passo 4: Migrar dados existentes (icone_url → icone_id)
-- Estratégia: Match por nome do arquivo (última parte da URL)
UPDATE `prod_unidade_turistica` ut
INNER JOIN `prod_icone` ic
  ON SUBSTRING_INDEX(ut.icone_url, '/', -1) = SUBSTRING_INDEX(ic.url, '/', -1)
SET ut.icone_id = ic.id
WHERE ut.icone_url IS NOT NULL
  AND ut.icone_url != ''
  AND ut.icone_id IS NULL;
