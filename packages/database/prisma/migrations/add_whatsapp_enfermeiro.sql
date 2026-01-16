-- AddWhatsappAndEnfermeiroToUnidade
ALTER TABLE `PROD_Unidade_Saude`
ADD COLUMN `whatsapp` VARCHAR(100) NULL AFTER `telefone`,
ADD COLUMN `enfermeiro_responsavel` VARCHAR(255) NULL AFTER `whatsapp`;
