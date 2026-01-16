-- AddSalaVacinaToUnidade
ALTER TABLE `prod_unidade_saude`
ADD COLUMN `sala_vacina` BOOLEAN NOT NULL DEFAULT FALSE AFTER `icone_url`,
ADD INDEX `prod_unidade_saude_sala_vacina_idx` (`sala_vacina`);
