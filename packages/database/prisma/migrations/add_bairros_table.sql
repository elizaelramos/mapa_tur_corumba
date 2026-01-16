-- CreateTable
CREATE TABLE `PROD_Bairro` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PROD_Bairro_nome_key`(`nome`),
    INDEX `PROD_Bairro_nome_idx`(`nome`),
    INDEX `PROD_Bairro_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- InsertData - Bairros de Corumbá
INSERT INTO `PROD_Bairro` (`nome`, `ativo`) VALUES
('Aeroporto', true),
('Boa Esperança', true),
('Bom Jesus', true),
('Centro', true),
('Cristo Redentor', true),
('Dom Bosco', true),
('Generoso', true),
('Guaicurus', true),
('Guató', true),
('Maria Leite', true),
('Nova Corumbá', true),
('Nova Lima', true),
('Novo Horizonte', true),
('Nopulândia', true),
('Padre Ernesto Sassida', true),
('Popular Nova', true),
('Popular Velha', true),
('Primavera', true),
('Progresso', true),
('Santa Terezinha', true),
('Universitário', true),
('Vila Mamona', true),
('Vila Real', true),
('Vila Guarani', true);
