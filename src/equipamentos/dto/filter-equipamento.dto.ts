import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { StatusOperacional } from '../../common/enums/status-operacional.enum';

export class FilterEquipamentoDto {
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

  @ApiPropertyOptional({
    description: 'Número da página (padrão: 1)',
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  public page?: number = 1;

  @ApiPropertyOptional({
    description: 'Quantidade de itens por página (padrão: 10)',
    example: 10,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  public limit?: number = 10;
}
