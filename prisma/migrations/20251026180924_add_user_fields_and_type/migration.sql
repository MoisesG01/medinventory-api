/*
  Warnings:

  - Added the required column `nome` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `User` ADD COLUMN `nome` VARCHAR(191) NOT NULL DEFAULT 'Usuário',
    ADD COLUMN `tipo` ENUM('Administrador', 'Gestor', 'Tecnico', 'UsuarioComum') NOT NULL DEFAULT 'UsuarioComum';

-- Update existing records to have nome = username
UPDATE `User` SET `nome` = `username` WHERE `nome` = 'Usuário';
