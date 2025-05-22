import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { FindUserDto } from './dto/find-user.dto';

@Injectable()
export class UserService {
  private users = [
    {
      userId: 1,
      username: 'john',
      password: 'changeme',
      email: 'john@user.com',
    },
    {
      userId: 2,
      username: 'maria',
      password: 'guess',
      email: 'maria@user.com',
    },
  ];

  async findOne(findUserDto: FindUserDto): Promise<User | undefined> {
    return this.users.find((user) => user.username === findUserDto.username);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const userId = this.users.length + 1;

    const newUser = {
      userId,
      ...createUserDto,
    };

    this.users.push(newUser);
    return newUser;
  }
}
