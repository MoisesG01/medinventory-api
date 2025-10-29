import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
  IsPositive,
  IsInt,
  MinLength,
  MaxLength,
} from 'class-validator';
import { StatusOperacional } from '../../common/enums/status-operacional.enum';

export class CreateEquipamentoDto {
  @ApiProperty({
    description: 'Nome do equipamento',
    example: 'Monitor Multiparamétrico',
    minLength: 2,
    maxLength: 200,
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  @MaxLength(200, { message: 'Nome deve ter no máximo 200 caracteres' })
  public nome: string;

  @ApiProperty({
    description: 'Tipo do equipamento',
    example: 'Monitor de Sinais Vitais',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'Tipo deve ser uma string' })
  @IsNotEmpty({ message: 'Tipo é obrigatório' })
  @MinLength(2, { message: 'Tipo deve ter pelo menos 2 caracteres' })
  @MaxLength(100, { message: 'Tipo deve ter no máximo 100 caracteres' })
  public tipo: string;

  @ApiProperty({
    description: 'Fabricante do equipamento',
    example: 'Philips',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'Fabricante deve ser uma string' })
  @IsNotEmpty({ message: 'Fabricante é obrigatório' })
  @MinLength(2, { message: 'Fabricante deve ter pelo menos 2 caracteres' })
  @MaxLength(100, { message: 'Fabricante deve ter no máximo 100 caracteres' })
  public fabricante: string;

  @ApiProperty({
    description: 'Modelo do equipamento',
    example: 'MX450',
    minLength: 1,
    maxLength: 100,
  })
  @IsString({ message: 'Modelo deve ser uma string' })
  @IsNotEmpty({ message: 'Modelo é obrigatório' })
  @MinLength(1, { message: 'Modelo deve ter pelo menos 1 caractere' })
  @MaxLength(100, { message: 'Modelo deve ter no máximo 100 caracteres' })
  public modelo: string;

  @ApiPropertyOptional({
    description: 'Número de série do equipamento',
    example: 'SN1234567890',
    maxLength: 100,
  })
  @IsString({ message: 'Número de série deve ser uma string' })
  @IsOptional()
  @MaxLength(100, {
    message: 'Número de série deve ter no máximo 100 caracteres',
  })
  public numeroSerie?: string;

  @ApiPropertyOptional({
    description: 'Código patrimonial do equipamento',
    example: 'PAT-2024-001',
    maxLength: 50,
  })
  @IsString({ message: 'Código patrimonial deve ser uma string' })
  @IsOptional()
  @MaxLength(50, {
    message: 'Código patrimonial deve ter no máximo 50 caracteres',
  })
  public codigoPatrimonial?: string;

  @ApiPropertyOptional({
    description: 'Setor atual onde o equipamento está localizado',
    example: 'UTI',
    maxLength: 100,
  })
  @IsString({ message: 'Setor atual deve ser uma string' })
  @IsOptional()
  @MaxLength(100, { message: 'Setor atual deve ter no máximo 100 caracteres' })
  public setorAtual?: string;

  @ApiProperty({
    description: 'Status operacional do equipamento',
    enum: StatusOperacional,
    example: StatusOperacional.EM_USO,
  })
  @IsEnum(StatusOperacional, { message: 'Status operacional inválido' })
  @IsNotEmpty({ message: 'Status operacional é obrigatório' })
  public statusOperacional: StatusOperacional;

  @ApiPropertyOptional({
    description: 'Data de aquisição do equipamento',
    example: '2024-01-15',
    format: 'date',
  })
  @IsDateString({}, { message: 'Data de aquisição deve ser uma data válida' })
  @IsOptional()
  public dataAquisicao?: string;

  @ApiPropertyOptional({
    description: 'Valor de aquisição do equipamento (em reais)',
    example: 15000.0,
    minimum: 0,
  })
  @IsPositive({ message: 'Valor de aquisição deve ser um número positivo' })
  @IsOptional()
  public valorAquisicao?: number;

  @ApiPropertyOptional({
    description: 'Data de fim da garantia',
    example: '2026-01-15',
    format: 'date',
  })
  @IsDateString(
    {},
    { message: 'Data de fim da garantia deve ser uma data válida' },
  )
  @IsOptional()
  public dataFimGarantia?: string;

  @ApiPropertyOptional({
    description: 'Vida útil estimada do equipamento (em anos)',
    example: 10,
    minimum: 1,
  })
  @IsInt({ message: 'Vida útil estimada deve ser um número inteiro' })
  @IsPositive({ message: 'Vida útil estimada deve ser um número positivo' })
  @IsOptional()
  public vidaUtilEstimativa?: number;

  @ApiPropertyOptional({
    description: 'Registro ANVISA do equipamento',
    example: '80100470106',
    maxLength: 50,
  })
  @IsString({ message: 'Registro ANVISA deve ser uma string' })
  @IsOptional()
  @MaxLength(50, {
    message: 'Registro ANVISA deve ter no máximo 50 caracteres',
  })
  public registroAnvisa?: string;

  @ApiPropertyOptional({
    description: 'Classe de risco do equipamento',
    example: 'Classe II',
    maxLength: 50,
  })
  @IsString({ message: 'Classe de risco deve ser uma string' })
  @IsOptional()
  @MaxLength(50, {
    message: 'Classe de risco deve ter no máximo 50 caracteres',
  })
  public classeRisco?: string;

  @ApiPropertyOptional({
    description: 'Data da última manutenção realizada',
    example: '2024-06-01',
    format: 'date',
  })
  @IsDateString(
    {},
    {
      message: 'Data da última manutenção deve ser uma data válida',
    },
  )
  @IsOptional()
  public dataUltimaManutencao?: string;

  @ApiPropertyOptional({
    description: 'Data da próxima manutenção prevista',
    example: '2024-12-01',
    format: 'date',
  })
  @IsDateString(
    {},
    {
      message: 'Data da próxima manutenção deve ser uma data válida',
    },
  )
  @IsOptional()
  public dataProximaManutencao?: string;

  @ApiPropertyOptional({
    description: 'Nome do responsável técnico pelo equipamento',
    example: 'Dr. João Silva',
    maxLength: 200,
  })
  @IsString({ message: 'Responsável técnico deve ser uma string' })
  @IsOptional()
  @MaxLength(200, {
    message: 'Responsável técnico deve ter no máximo 200 caracteres',
  })
  public responsavelTecnico?: string;

  @ApiPropertyOptional({
    description: 'Criticidade do equipamento',
    example: 'Alta',
    maxLength: 50,
  })
  @IsString({ message: 'Criticidade deve ser uma string' })
  @IsOptional()
  @MaxLength(50, { message: 'Criticidade deve ter no máximo 50 caracteres' })
  public criticidade?: string;

  @ApiPropertyOptional({
    description: 'Observações adicionais sobre o equipamento',
    example: 'Equipamento em bom estado, calibrado em junho/2024',
    maxLength: 1000,
  })
  @IsString({ message: 'Observações deve ser uma string' })
  @IsOptional()
  @MaxLength(1000, {
    message: 'Observações deve ter no máximo 1000 caracteres',
  })
  public observacoes?: string;

  @ApiPropertyOptional({
    description: 'ID do usuário responsável pelo equipamento (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'ID do usuário deve ser um UUID válido' })
  @IsOptional()
  public userId?: string;
}
