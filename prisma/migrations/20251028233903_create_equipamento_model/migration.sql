-- CreateTable
CREATE TABLE `Equipamento` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `fabricante` VARCHAR(191) NOT NULL,
    `modelo` VARCHAR(191) NOT NULL,
    `numeroSerie` VARCHAR(191) NULL,
    `codigoPatrimonial` VARCHAR(191) NULL,
    `setorAtual` VARCHAR(191) NULL,
    `statusOperacional` ENUM('EM_USO', 'EM_MANUTENCAO', 'INATIVO', 'SUCATEADO') NOT NULL,
    `dataAquisicao` DATETIME(3) NULL,
    `valorAquisicao` DOUBLE NULL,
    `dataFimGarantia` DATETIME(3) NULL,
    `vidaUtilEstimativa` INTEGER NULL,
    `registroAnvisa` VARCHAR(191) NULL,
    `classeRisco` VARCHAR(191) NULL,
    `dataUltimaManutencao` DATETIME(3) NULL,
    `dataProximaManutencao` DATETIME(3) NULL,
    `responsavelTecnico` VARCHAR(191) NULL,
    `criticidade` VARCHAR(191) NULL,
    `observacoes` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Equipamento` ADD CONSTRAINT `Equipamento_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
