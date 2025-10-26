import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserService } from './user.service';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obter perfil do usuário autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil do usuário retornado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        username: { type: 'string', example: 'usuario123' },
        email: { type: 'string', example: 'usuario@exemplo.com' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT inválido ou expirado',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User not found' },
      },
    },
  })
  async getMyProfile(@Request() req) {
    const user = await this.userService.findById(req.user.id);
    if (!user) {
      return { message: 'User not found' };
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('protected')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Rota protegida de exemplo' })
  @ApiResponse({
    status: 200,
    description: 'Dados protegidos retornados com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Esta é uma rota protegida!' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            username: { type: 'string', example: 'usuario123' },
          },
        },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT inválido ou expirado',
  })
  getProtectedData(@Request() req) {
    return {
      message: 'Esta é uma rota protegida!',
      user: req.user,
      timestamp: new Date().toISOString(),
    };
  }
}
