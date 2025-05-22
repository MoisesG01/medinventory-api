import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserLoginDto } from './dto/user-login.dto';
import { UserRegisterDto } from './dto/user-register.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() body: UserLoginDto): Promise<string> {
        return this.authService.login(body);
    }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() body: UserRegisterDto): Promise<string> {
        return this.authService.register(body);
    }
}
