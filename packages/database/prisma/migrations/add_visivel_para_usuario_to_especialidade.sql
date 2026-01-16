-- Add visivel_para_usuario field to PROD_Especialidade table
ALTER TABLE `prod_especialidade`
ADD COLUMN `visivel_para_usuario` BOOLEAN NOT NULL DEFAULT TRUE
AFTER `ativo`;

-- Add index for visivel_para_usuario
CREATE INDEX `prod_especialidade_visivel_para_usuario_idx`
ON `prod_especialidade` (`visivel_para_usuario`);
