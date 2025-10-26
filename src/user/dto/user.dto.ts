import { ApiProperty, PartialType } from '@nestjs/swagger';
import { BaseUserDto } from '../../common/dto/base-user.dto';
import { IsOptional, IsString } from 'class-validator';

export class CreateUserDto extends BaseUserDto {}

export class UpdateUserDto extends PartialType(BaseUserDto) {
  @ApiProperty({
    description: 'ID do usuário (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString({ message: 'ID deve ser uma string UUID' })
  @IsOptional()
  public id?: string;
}

export class UserResponseDto {
  @ApiProperty({
    description: 'ID único do usuário (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  public id: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva',
  })
  public nome: string;

  @ApiProperty({
    description: 'Nome de usuário único',
    example: 'usuario123',
  })
  public username: string;

  @ApiProperty({
    description: 'Email único do usuário',
    example: 'usuario@exemplo.com',
  })
  public email: string;

  @ApiProperty({
    description: 'Tipo do usuário',
    example: 'UsuarioComum',
  })
  public tipo: string;

  @ApiProperty({
    description: 'Data de criação do usuário',
    example: '2024-01-01T00:00:00.000Z',
  })
  public createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização do usuário',
    example: '2024-01-01T00:00:00.000Z',
  })
  public updatedAt: Date;
}
