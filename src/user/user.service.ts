import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/user.dto';
import { UpdateUserDto } from './dto/user.dto';
import * as bcrypt from 'bcryptjs';
import { RedisCacheService } from '../cache/redis-cache.service';

const USER_CACHE_TTL_SECONDS = 60 * 60 * 12; // 12 horas

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {}

  private cacheKeyForUser(id: string) {
    return `users:${id}`;
  }

  async create(createUserDto: CreateUserDto) {
    // Verificar se username já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { username: createUserDto.username },
    });
    if (existingUser) {
      throw new ConflictException('Nome de usuário já está em uso');
    }

    // Verificar se email já existe
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Email já está em uso');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const newUser = await this.prisma.user.create({
      data: {
        nome: createUserDto.nome,
        username: createUserDto.username,
        email: createUserDto.email,
        password: hashedPassword,
        tipo: createUserDto.tipo || 'UsuarioComum',
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = newUser;
    return result;
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        nome: true,
        username: true,
        email: true,
        tipo: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return users;
  }

  async findOne(id: string) {
    const cacheKey = this.cacheKeyForUser(id);
    const cached = await this.cache.getJson<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        username: true,
        email: true,
        tipo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    await this.cache.setJson(cacheKey, user, USER_CACHE_TTL_SECONDS);
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // Verificar se usuário existe
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!existingUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se username já existe (se estiver sendo alterado)
    if (
      updateUserDto.username &&
      updateUserDto.username !== existingUser.username
    ) {
      const usernameExists = await this.prisma.user.findUnique({
        where: { username: updateUserDto.username },
      });
      if (usernameExists) {
        throw new ConflictException('Nome de usuário já está em uso');
      }
    }

    // Verificar se email já existe (se estiver sendo alterado)
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });
      if (emailExists) {
        throw new ConflictException('Email já está em uso');
      }
    }

    const updateData: any = {
      ...updateUserDto,
    };

    // Se senha estiver sendo alterada, hash ela
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nome: true,
        username: true,
        email: true,
        tipo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await this.cache.del(this.cacheKeyForUser(id));
    return updatedUser;
  }

  async remove(id: string) {
    // Verificar se usuário existe
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!existingUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    await this.cache.del(this.cacheKeyForUser(id));
    return { message: 'Usuário removido com sucesso' };
  }

  // Métodos existentes mantidos para compatibilidade
  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    return user;
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return user;
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    return user;
  }
}
