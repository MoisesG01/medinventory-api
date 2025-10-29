-- AlterTable
ALTER TABLE `equipamento` MODIFY `statusOperacional` ENUM('DISPONIVEL', 'EM_USO', 'EM_MANUTENCAO', 'INATIVO', 'SUCATEADO') NOT NULL;
