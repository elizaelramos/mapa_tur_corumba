-- Migration: Add email field to prod_escola table
-- Created: 2026-01-12
-- Description: Adiciona campo email para armazenar o endereço de email das escolas

ALTER TABLE `prod_escola`
ADD COLUMN `email` VARCHAR(255) NULL AFTER `whatsapp`;
