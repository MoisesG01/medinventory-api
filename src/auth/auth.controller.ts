import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Post('register')
  async register(@Body() createUserDto) {
    const user = await this.userService.create(createUserDto);
    return this.authService.login(user);
  }

  @Post('login')
  async login(@Body() loginDto) {
    const user = await this.authService.validateUser(
      loginDto.username,
      loginDto.password,
    );
    if (!user) {
      return { message: 'Usuário ou senha inválidos' };
    }
    return this.authService.login(user);
  }
}
