import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class FindUserDto {
  @ApiProperty({
    description: 'Nome de usuário para busca',
    example: 'usuario123',
    minLength: 3,
    maxLength: 50,
  })
  @IsString({ message: 'Username deve ser uma string' })
  @IsNotEmpty({ message: 'Username é obrigatório' })
  @MinLength(3, { message: 'Username deve ter pelo menos 3 caracteres' })
  @MaxLength(50, { message: 'Username deve ter no máximo 50 caracteres' })
  public username: string;
}
