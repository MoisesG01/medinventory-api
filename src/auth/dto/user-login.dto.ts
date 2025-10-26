import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class UserLoginDto {
  @ApiProperty({
    description: 'Nome de usuário para login',
    example: 'usuario123',
    minLength: 3,
    maxLength: 50,
  })
  @IsString({ message: 'Username deve ser uma string' })
  @IsNotEmpty({ message: 'Username é obrigatório' })
  @MinLength(3, { message: 'Username deve ter pelo menos 3 caracteres' })
  @MaxLength(50, { message: 'Username deve ter no máximo 50 caracteres' })
  public username: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'senha123',
    minLength: 6,
    maxLength: 100,
  })
  @IsString({ message: 'Password deve ser uma string' })
  @IsNotEmpty({ message: 'Password é obrigatório' })
  @MinLength(6, { message: 'Password deve ter pelo menos 6 caracteres' })
  @MaxLength(100, { message: 'Password deve ter no máximo 100 caracteres' })
  public password: string;
}
