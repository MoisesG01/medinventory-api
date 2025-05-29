import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  private users: User[] = [
    {
      userId: 1,
      username: 'john',
      password: '$2a$10$wQwQwQwQwQwQwQwQwQwQwOeQwQwQwQwQwQwQwQwQwQwQwQwQwQwQ', // senha já criptografada
      email: 'john@user.com',
    },
    {
      userId: 2,
      username: 'maria',
      password: '$2a$10$wQwQwQwQwQwQwQwQwQwQwOeQwQwQwQwQwQwQwQwQwQwQwQwQwQwQ', // senha já criptografada
      email: 'maria@user.com',
    },
  ];

  async findByUsername(username: string): Promise<User | undefined> {
    return this.users.find((user) => user.username === username);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.users.find((user) => user.email === email);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const userId = this.users.length + 1;
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const newUser: User = {
      userId,
      username: createUserDto.username,
      password: hashedPassword,
      email: createUserDto.email,
    };

    this.users.push(newUser);
    return newUser;
  }
}
