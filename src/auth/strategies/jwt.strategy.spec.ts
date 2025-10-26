import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UserService } from '../../user/user.service'; // Caminho corrigido

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userService: jest.Mocked<UserService>;

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  const mockPayload = {
    username: 'testuser',
    sub: 1,
  };

  beforeEach(async () => {
    const mockUserService = {
      findByUsername: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userService = module.get<UserService>(
      UserService,
    ) as jest.Mocked<UserService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user data without password when user exists', async () => {
      userService.findByUsername.mockResolvedValue(mockUser);

      const result = await strategy.validate(mockPayload);

      expect(userService.findByUsername).toHaveBeenCalledWith(
        mockPayload.username,
      );
      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should return null when user does not exist', async () => {
      userService.findByUsername.mockResolvedValue(null);

      const result = await strategy.validate(mockPayload);

      expect(userService.findByUsername).toHaveBeenCalledWith(
        mockPayload.username,
      );
      expect(result).toBeNull();
    });

    it('should handle errors from userService', async () => {
      userService.findByUsername.mockRejectedValue(new Error('Database error'));

      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        'Database error',
      );

      expect(userService.findByUsername).toHaveBeenCalledWith(
        mockPayload.username,
      );
    });
  });
});
