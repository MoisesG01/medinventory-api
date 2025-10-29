import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { StatusOperacional } from '../../common/enums/status-operacional.enum';

export class UpdateStatusDto {
  @ApiProperty({
    description: 'Novo status operacional do equipamento',
    enum: StatusOperacional,
    example: StatusOperacional.EM_MANUTENCAO,
  })
  @IsEnum(StatusOperacional, { message: 'Status operacional inválido' })
  @IsNotEmpty({ message: 'Status operacional é obrigatório' })
  public statusOperacional: StatusOperacional;
}
