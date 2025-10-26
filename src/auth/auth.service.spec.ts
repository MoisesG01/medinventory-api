import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { UserType } from '../common/enums/user-type.enum';
import * as bcrypt from 'bcryptjs';

// Mock do bcrypt
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    nome: 'Test User',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword',
    tipo: UserType.UsuarioComum,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  const mockUserWithoutPassword = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    nome: 'Test User',
    username: 'testuser',
    email: 'test@example.com',
    tipo: UserType.UsuarioComum,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  const mockCreateUserDto: CreateUserDto = {
    nome: 'Test User',
    username: 'testuser',
    email: 'test@example.com',
    password: 'plainPassword',
    tipo: UserType.UsuarioComum,
  };

  const mockLoginDto: UserLoginDto = {
    username: 'testuser',
    password: 'plainPassword',
  };

  const mockAccessToken = 'mock-jwt-token';

  beforeEach(async () => {
    const mockUserService = {
      findByUsername: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(
      UserService,
    ) as jest.Mocked<UserService>;
    jwtService = module.get<JwtService>(JwtService) as jest.Mocked<JwtService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      userService.findByUsername.mockResolvedValue(null);
      userService.findByEmail.mockResolvedValue(null);
      userService.create.mockResolvedValue(mockUserWithoutPassword);
      jwtService.sign.mockReturnValue(mockAccessToken);

      const result = await authService.register(mockCreateUserDto);

      expect(userService.findByUsername).toHaveBeenCalledWith(
        mockCreateUserDto.username,
      );
      expect(userService.findByEmail).toHaveBeenCalledWith(
        mockCreateUserDto.email,
      );
      expect(userService.create).toHaveBeenCalledWith(mockCreateUserDto);
      expect(jwtService.sign).toHaveBeenCalledWith({
        username: mockUser.username,
        sub: mockUser.id,
      });
      expect(result).toEqual({
        user: mockUserWithoutPassword,
        access_token: mockAccessToken,
      });
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw ConflictException when username already exists', async () => {
      userService.findByUsername.mockResolvedValue(mockUser);

      await expect(authService.register(mockCreateUserDto)).rejects.toThrow(
        new ConflictException('Nome de usuário já está em uso'),
      );

      expect(userService.findByUsername).toHaveBeenCalledWith(
        mockCreateUserDto.username,
      );
      expect(userService.findByEmail).not.toHaveBeenCalled();
      expect(userService.create).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when email already exists', async () => {
      userService.findByUsername.mockResolvedValue(null);
      userService.findByEmail.mockResolvedValue(mockUser);

      await expect(authService.register(mockCreateUserDto)).rejects.toThrow(
        new ConflictException('Email já está em uso'),
      );

      expect(userService.findByUsername).toHaveBeenCalledWith(
        mockCreateUserDto.username,
      );
      expect(userService.findByEmail).toHaveBeenCalledWith(
        mockCreateUserDto.email,
      );
      expect(userService.create).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should handle errors during user creation', async () => {
      userService.findByUsername.mockResolvedValue(null);
      userService.findByEmail.mockResolvedValue(null);
      userService.create.mockRejectedValue(new Error('Database error'));

      await expect(authService.register(mockCreateUserDto)).rejects.toThrow(
        'Database error',
      );

      expect(userService.findByUsername).toHaveBeenCalledWith(
        mockCreateUserDto.username,
      );
      expect(userService.findByEmail).toHaveBeenCalledWith(
        mockCreateUserDto.email,
      );
      expect(userService.create).toHaveBeenCalledWith(mockCreateUserDto);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should handle errors during JWT signing', async () => {
      userService.findByUsername.mockResolvedValue(null);
      userService.findByEmail.mockResolvedValue(null);
      userService.create.mockResolvedValue(mockUser);
      jwtService.sign.mockImplementation(() => {
        throw new Error('JWT signing error');
      });

      await expect(authService.register(mockCreateUserDto)).rejects.toThrow(
        'JWT signing error',
      );

      expect(userService.create).toHaveBeenCalledWith(mockCreateUserDto);
      expect(jwtService.sign).toHaveBeenCalledWith({
        username: mockUser.username,
        sub: mockUser.id,
      });
    });

    it('should handle errors during username check', async () => {
      userService.findByUsername.mockRejectedValue(
        new Error('Database connection error'),
      );

      await expect(authService.register(mockCreateUserDto)).rejects.toThrow(
        'Database connection error',
      );

      expect(userService.findByUsername).toHaveBeenCalledWith(
        mockCreateUserDto.username,
      );
      expect(userService.findByEmail).not.toHaveBeenCalled();
    });

    it('should handle errors during email check', async () => {
      userService.findByUsername.mockResolvedValue(null);
      userService.findByEmail.mockRejectedValue(
        new Error('Database connection error'),
      );

      await expect(authService.register(mockCreateUserDto)).rejects.toThrow(
        'Database connection error',
      );

      expect(userService.findByUsername).toHaveBeenCalledWith(
        mockCreateUserDto.username,
      );
      expect(userService.findByEmail).toHaveBeenCalledWith(
        mockCreateUserDto.email,
      );
    });
  });

  describe('validateUser', () => {
    it('should successfully validate user with correct credentials', async () => {
      userService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.validateUser(mockLoginDto);

      expect(userService.findByUsername).toHaveBeenCalledWith(
        mockLoginDto.username,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        mockLoginDto.password,
        mockUser.password,
      );
      expect(result).toEqual(mockUserWithoutPassword);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      userService.findByUsername.mockResolvedValue(null);

      await expect(authService.validateUser(mockLoginDto)).rejects.toThrow(
        new UnauthorizedException('Usuário não encontrado'),
      );

      expect(userService.findByUsername).toHaveBeenCalledWith(
        mockLoginDto.username,
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      userService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.validateUser(mockLoginDto)).rejects.toThrow(
        new UnauthorizedException('Senha incorreta'),
      );

      expect(userService.findByUsername).toHaveBeenCalledWith(
        mockLoginDto.username,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        mockLoginDto.password,
        mockUser.password,
      );
    });

    it('should handle errors during user lookup', async () => {
      userService.findByUsername.mockRejectedValue(new Error('Database error'));

      await expect(authService.validateUser(mockLoginDto)).rejects.toThrow(
        'Database error',
      );

      expect(userService.findByUsername).toHaveBeenCalledWith(
        mockLoginDto.username,
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should handle errors during password comparison', async () => {
      userService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockRejectedValue(
        new Error('bcrypt error'),
      );

      await expect(authService.validateUser(mockLoginDto)).rejects.toThrow(
        'bcrypt error',
      );

      expect(userService.findByUsername).toHaveBeenCalledWith(
        mockLoginDto.username,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        mockLoginDto.password,
        mockUser.password,
      );
    });

    it('should validate user with empty password field', async () => {
      const userWithEmptyPassword = { ...mockUser, password: '' };
      userService.findByUsername.mockResolvedValue(userWithEmptyPassword);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.validateUser(mockLoginDto)).rejects.toThrow(
        new UnauthorizedException('Senha incorreta'),
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(mockLoginDto.password, '');
    });
  });

  describe('login', () => {
    it('should successfully generate login response', async () => {
      jwtService.sign.mockReturnValue(mockAccessToken);

      const result = await authService.login(mockUserWithoutPassword);

      expect(jwtService.sign).toHaveBeenCalledWith({
        username: mockUserWithoutPassword.username,
        sub: mockUserWithoutPassword.id,
      });
      expect(result).toEqual({
        user: mockUserWithoutPassword,
        access_token: mockAccessToken,
      });
    });

    it('should handle errors during JWT signing in login', async () => {
      jwtService.sign.mockImplementation(() => {
        throw new Error('JWT signing error');
      });

      await expect(authService.login(mockUserWithoutPassword)).rejects.toThrow(
        'JWT signing error',
      );

      expect(jwtService.sign).toHaveBeenCalledWith({
        username: mockUserWithoutPassword.username,
        sub: mockUserWithoutPassword.id,
      });
    });

    it('should work with user object containing extra properties', async () => {
      const userWithExtraProps = {
        ...mockUserWithoutPassword,
        role: 'admin',
        lastLogin: new Date(),
      };
      jwtService.sign.mockReturnValue(mockAccessToken);

      const result = await authService.login(userWithExtraProps);

      expect(jwtService.sign).toHaveBeenCalledWith({
        username: userWithExtraProps.username,
        sub: userWithExtraProps.id,
      });
      expect(result).toEqual({
        user: userWithExtraProps,
        access_token: mockAccessToken,
      });
    });

    it('should handle user with null or undefined properties', async () => {
      const userWithNullProps = {
        id: 1,
        username: 'testuser',
        email: null,
        createdAt: undefined,
        updatedAt: new Date(),
      };
      jwtService.sign.mockReturnValue(mockAccessToken);

      const result = await authService.login(userWithNullProps);

      expect(jwtService.sign).toHaveBeenCalledWith({
        username: userWithNullProps.username,
        sub: userWithNullProps.id,
      });
      expect(result.user).toBe(userWithNullProps);
    });

    it('should handle minimal user object', async () => {
      const minimalUser = {
        id: 999,
        username: 'minimal',
      };
      jwtService.sign.mockReturnValue(mockAccessToken);

      const result = await authService.login(minimalUser);

      expect(jwtService.sign).toHaveBeenCalledWith({
        username: minimalUser.username,
        sub: minimalUser.id,
      });
      expect(result).toEqual({
        user: minimalUser,
        access_token: mockAccessToken,
      });
    });
  });

  describe('service initialization', () => {
    it('should be defined', () => {
      expect(authService).toBeDefined();
    });

    it('should have userService dependency', () => {
      expect(userService).toBeDefined();
    });

    it('should have jwtService dependency', () => {
      expect(jwtService).toBeDefined();
    });
  });
});
