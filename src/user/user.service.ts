import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    console.log('📥 Criando usuário com dados:', createUserDto);

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    console.log('🔐 Senha hasheada:', hashedPassword);

    const newUser = await this.prisma.user.create({
      data: {
        username: createUserDto.username,
        email: createUserDto.email,
        password: hashedPassword,
      },
    });

    console.log('✅ Usuário criado:', {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
    });

    return newUser;
  }

  async findByUsername(username: string) {
    console.log(`🔍 Buscando usuário com username: ${username}`);
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (user) {
      console.log('✅ Usuário encontrado:', user.username);
    } else {
      console.log('❌ Usuário não encontrado');
    }

    return user;
  }
}
