import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { StatusOperacional } from '../../common/enums/status-operacional.enum';

/** Query params para exportação CSV (mesmos filtros da listagem, sem paginação). */
export class ExportEquipamentoCsvQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar por nome do equipamento',
    example: 'Monitor',
  })
  @IsString()
  @IsOptional()
  public nome?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo do equipamento',
    example: 'Monitor de Sinais Vitais',
  })
  @IsString()
  @IsOptional()
  public tipo?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por setor atual',
    example: 'UTI',
  })
  @IsString()
  @IsOptional()
  public setorAtual?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por status operacional',
    enum: StatusOperacional,
    example: StatusOperacional.EM_USO,
  })
  @IsEnum(StatusOperacional)
  @IsOptional()
  public statusOperacional?: StatusOperacional;
}
