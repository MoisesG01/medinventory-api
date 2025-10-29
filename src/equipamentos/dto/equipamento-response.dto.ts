import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatusOperacional } from '../../common/enums/status-operacional.enum';

export class EquipamentoResponseDto {
  @ApiProperty({
    description: 'ID único do equipamento (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  public id: string;

  @ApiProperty({
    description: 'Nome do equipamento',
    example: 'Monitor Multiparamétrico',
  })
  public nome: string;

  @ApiProperty({
    description: 'Tipo do equipamento',
    example: 'Monitor de Sinais Vitais',
  })
  public tipo: string;

  @ApiProperty({
    description: 'Fabricante do equipamento',
    example: 'Philips',
  })
  public fabricante: string;

  @ApiProperty({
    description: 'Modelo do equipamento',
    example: 'MX450',
  })
  public modelo: string;

  @ApiPropertyOptional({
    description: 'Número de série do equipamento',
    example: 'SN1234567890',
  })
  public numeroSerie?: string;

  @ApiPropertyOptional({
    description: 'Código patrimonial do equipamento',
    example: 'PAT-2024-001',
  })
  public codigoPatrimonial?: string;

  @ApiPropertyOptional({
    description: 'Setor atual onde o equipamento está localizado',
    example: 'UTI',
  })
  public setorAtual?: string;

  @ApiProperty({
    description: 'Status operacional do equipamento',
    enum: StatusOperacional,
    example: StatusOperacional.EM_USO,
  })
  public statusOperacional: StatusOperacional;

  @ApiPropertyOptional({
    description: 'Data de aquisição do equipamento',
    example: '2024-01-15T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  public dataAquisicao?: Date;

  @ApiPropertyOptional({
    description: 'Valor de aquisição do equipamento (em reais)',
    example: 15000.0,
  })
  public valorAquisicao?: number;

  @ApiPropertyOptional({
    description: 'Data de fim da garantia',
    example: '2026-01-15T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  public dataFimGarantia?: Date;

  @ApiPropertyOptional({
    description: 'Vida útil estimada do equipamento (em anos)',
    example: 10,
  })
  public vidaUtilEstimativa?: number;

  @ApiPropertyOptional({
    description: 'Registro ANVISA do equipamento',
    example: '80100470106',
  })
  public registroAnvisa?: string;

  @ApiPropertyOptional({
    description: 'Classe de risco do equipamento',
    example: 'Classe II',
  })
  public classeRisco?: string;

  @ApiPropertyOptional({
    description: 'Data da última manutenção realizada',
    example: '2024-06-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  public dataUltimaManutencao?: Date;

  @ApiPropertyOptional({
    description: 'Data da próxima manutenção prevista',
    example: '2024-12-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  public dataProximaManutencao?: Date;

  @ApiPropertyOptional({
    description: 'Nome do responsável técnico pelo equipamento',
    example: 'Dr. João Silva',
  })
  public responsavelTecnico?: string;

  @ApiPropertyOptional({
    description: 'Criticidade do equipamento',
    example: 'Alta',
  })
  public criticidade?: string;

  @ApiPropertyOptional({
    description: 'Observações adicionais sobre o equipamento',
    example: 'Equipamento em bom estado, calibrado em junho/2024',
  })
  public observacoes?: string;

  @ApiPropertyOptional({
    description: 'ID do usuário responsável pelo equipamento (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  public userId?: string;

  @ApiProperty({
    description: 'Data de criação do equipamento',
    example: '2024-01-15T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  public createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização do equipamento',
    example: '2024-01-15T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  public updatedAt: Date;
}
