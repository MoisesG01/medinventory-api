import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { UserLoginDto } from './dto/user-login.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private userService: UserService) {}

  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.userService.findByUsername(
      createUserDto.username,
    );
    if (existingUser) {
      throw new ConflictException('Nome de usuário já está em uso');
    }

    // Removido o hash aqui, pois já está sendo feito no UserService
    return this.userService.create(createUserDto);
  }

  async validateUser(loginDto: UserLoginDto) {
    const user = await this.userService.findByUsername(loginDto.username);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    console.log('🔐 Senha fornecida:', loginDto.password);
    console.log('🔐 Senha armazenada:', user.password);

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Senha incorreta');
    }
    console.log('🔐 Senha válida?', isPasswordValid);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }
}
