import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserLoginDto } from './dto/user-login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  const mockAuthResult = {
    user: mockUser,
    access_token: 'mock-jwt-token',
  };

  const mockCreateUserDto: CreateUserDto = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
  };

  const mockLoginDto: UserLoginDto = {
    username: 'testuser',
    password: 'password123',
  };

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
      validateUser: jest.fn(),
      login: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(
      AuthService,
    ) as jest.Mocked<AuthService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      authService.register.mockResolvedValue(mockAuthResult);

      const result = await controller.register(mockCreateUserDto);

      expect(authService.register).toHaveBeenCalledWith(mockCreateUserDto);
      expect(result).toEqual(mockAuthResult);
    });

    it('should throw error if registration fails', async () => {
      authService.register.mockRejectedValue(new Error('Registration failed'));

      await expect(controller.register(mockCreateUserDto)).rejects.toThrow(
        'Registration failed',
      );

      expect(authService.register).toHaveBeenCalledWith(mockCreateUserDto);
    });
  });

  describe('login', () => {
    it('should login user and return JWT token', async () => {
      authService.validateUser.mockResolvedValue(mockUser);
      authService.login.mockResolvedValue(mockAuthResult);

      const result = await controller.login(mockLoginDto);

      expect(authService.validateUser).toHaveBeenCalledWith(mockLoginDto);
      expect(authService.login).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockAuthResult);
    });

    it('should throw error if login fails', async () => {
      authService.validateUser.mockRejectedValue(
        new Error('Invalid credentials'),
      );

      await expect(controller.login(mockLoginDto)).rejects.toThrow(
        'Invalid credentials',
      );

      expect(authService.validateUser).toHaveBeenCalledWith(mockLoginDto);
      expect(authService.login).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockRequest = { user: mockUser };

      const result = controller.getProfile(mockRequest);

      expect(result).toEqual(mockUser);
    });
  });

  describe('verifyToken', () => {
    it('should verify token and return user data', async () => {
      const mockRequest = { user: mockUser };

      const result = controller.verifyToken(mockRequest);

      expect(result).toEqual({
        valid: true,
        user: mockUser,
      });
    });
  });
});
