-- CreateTable
CREATE TABLE `STAGING_Info_Origem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_medico_bruto` VARCHAR(255) NULL,
    `nome_unidade_bruto` VARCHAR(255) NULL,
    `nome_especialidade_bruto` VARCHAR(255) NULL,
    `id_origem` VARCHAR(100) NOT NULL,
    `status_processamento` ENUM('pendente', 'validado', 'erro', 'ignorado') NOT NULL DEFAULT 'pendente',
    `id_prod_link` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `nome_familiar` VARCHAR(255) NULL,
    `endereco_manual` VARCHAR(500) NULL,
    `latitude_manual` DECIMAL(10, 8) NULL,
    `longitude_manual` DECIMAL(11, 8) NULL,
    `observacoes` TEXT NULL,

    UNIQUE INDEX `STAGING_Info_Origem_id_origem_key`(`id_origem`),
    INDEX `STAGING_Info_Origem_status_processamento_idx`(`status_processamento`),
    INDEX `STAGING_Info_Origem_id_origem_idx`(`id_origem`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PROD_Unidade_Saude` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `endereco` VARCHAR(500) NULL,
    `latitude` DECIMAL(10, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `id_origem` VARCHAR(100) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PROD_Unidade_Saude_id_origem_key`(`id_origem`),
    INDEX `PROD_Unidade_Saude_ativo_idx`(`ativo`),
    INDEX `PROD_Unidade_Saude_latitude_longitude_idx`(`latitude`, `longitude`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PROD_Medico` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `id_origem` VARCHAR(100) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PROD_Medico_id_origem_key`(`id_origem`),
    INDEX `PROD_Medico_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PROD_Especialidade` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PROD_Especialidade_nome_key`(`nome`),
    INDEX `PROD_Especialidade_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Junction_Unidade_Especialidade` (
    `id_unidade` INTEGER NOT NULL,
    `id_especialidade` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_unidade`, `id_especialidade`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Junction_Medico_Especialidade` (
    `id_medico` INTEGER NOT NULL,
    `id_especialidade` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_medico`, `id_especialidade`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'superadmin') NOT NULL DEFAULT 'admin',
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `last_login` DATETIME(3) NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_username_idx`(`username`),
    INDEX `User_email_idx`(`email`),
    INDEX `User_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AUDIT_LOG` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tabela` VARCHAR(100) NOT NULL,
    `operacao` ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    `registro_id` INTEGER NOT NULL,
    `valor_antigo` TEXT NULL,
    `valor_novo` TEXT NULL,
    `user_id` INTEGER NULL,
    `correlation_id` VARCHAR(100) NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AUDIT_LOG_tabela_idx`(`tabela`),
    INDEX `AUDIT_LOG_operacao_idx`(`operacao`),
    INDEX `AUDIT_LOG_user_id_idx`(`user_id`),
    INDEX `AUDIT_LOG_timestamp_idx`(`timestamp`),
    INDEX `AUDIT_LOG_correlation_id_idx`(`correlation_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ETL_Execution` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `finished_at` DATETIME(3) NULL,
    `status` ENUM('running', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'running',
    `records_extracted` INTEGER NOT NULL DEFAULT 0,
    `records_loaded` INTEGER NOT NULL DEFAULT 0,
    `records_failed` INTEGER NOT NULL DEFAULT 0,
    `error_message` TEXT NULL,

    INDEX `ETL_Execution_status_idx`(`status`),
    INDEX `ETL_Execution_started_at_idx`(`started_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Junction_Unidade_Especialidade` ADD CONSTRAINT `Junction_Unidade_Especialidade_id_unidade_fkey` FOREIGN KEY (`id_unidade`) REFERENCES `PROD_Unidade_Saude`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Junction_Unidade_Especialidade` ADD CONSTRAINT `Junction_Unidade_Especialidade_id_especialidade_fkey` FOREIGN KEY (`id_especialidade`) REFERENCES `PROD_Especialidade`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Junction_Medico_Especialidade` ADD CONSTRAINT `Junction_Medico_Especialidade_id_medico_fkey` FOREIGN KEY (`id_medico`) REFERENCES `PROD_Medico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Junction_Medico_Especialidade` ADD CONSTRAINT `Junction_Medico_Especialidade_id_especialidade_fkey` FOREIGN KEY (`id_especialidade`) REFERENCES `PROD_Especialidade`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AUDIT_LOG` ADD CONSTRAINT `AUDIT_LOG_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
