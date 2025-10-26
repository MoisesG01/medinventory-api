import { ApiProperty } from '@nestjs/swagger';

export class User {
  @ApiProperty({
    description: 'ID único do usuário',
    example: 1,
    minimum: 1,
  })
  public id: number;

  @ApiProperty({
    description: 'Nome de usuário único',
    example: 'usuario123',
    minLength: 3,
    maxLength: 50,
  })
  public username: string;

  @ApiProperty({
    description: 'Email único do usuário',
    example: 'usuario@exemplo.com',
    format: 'email',
  })
  public email: string;

  @ApiProperty({
    description: 'Senha hasheada do usuário (não retornada nas respostas)',
    example: '$2a$10$hashedpassword...',
    writeOnly: true,
  })
  public password: string;

  @ApiProperty({
    description: 'Data de criação do usuário',
    example: '2024-01-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  public createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização do usuário',
    example: '2024-01-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  public updatedAt: Date;
}
