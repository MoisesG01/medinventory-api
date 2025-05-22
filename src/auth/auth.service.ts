import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { UserLoginDto } from './dto/user-login.dto';
import { UserRegisterDto } from './dto/user-register.dto';

@Injectable()
export class AuthService {
    constructor(private readonly userService: UserService) { }

    async login(userLoginDto: UserLoginDto): Promise<string> {
        return 'token'; // TODO implementar token 
    }

    async register(userRegisterDto: UserRegisterDto): Promise<string> {
        return 'token';
    }
}