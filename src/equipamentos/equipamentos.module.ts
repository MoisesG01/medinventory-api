import { Module } from '@nestjs/common';
import { EquipamentosController } from './equipamentos.controller';
import { EquipamentosService } from './equipamentos.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UserTypesGuard } from '../auth/guards/user-types.guard';

@Module({
  imports: [PrismaModule],
  controllers: [EquipamentosController],
  providers: [EquipamentosService, UserTypesGuard],
  exports: [EquipamentosService],
})
export class EquipamentosModule {}
