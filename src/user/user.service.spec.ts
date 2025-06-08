import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

// Mock do bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

// Tipo para o mock do PrismaService
type MockPrismaService = {
  user: {
    create: jest.MockedFunction<any>;
    findUnique: jest.MockedFunction<any>;
  };
};

describe('UserService', () => {
  let service: UserService;
  let prismaService: MockPrismaService;

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCreateUserDto: CreateUserDto = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'plainPassword',
  };

  beforeEach(async () => {
    const mockPrismaService: MockPrismaService = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(
      PrismaService,
    ) as MockPrismaService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const hashedPassword = 'hashedPassword123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      prismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.create(mockCreateUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(mockCreateUserDto.password, 10);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          username: mockCreateUserDto.username,
          email: mockCreateUserDto.email,
          password: hashedPassword,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw an error if user creation fails', async () => {
      const hashedPassword = 'hashedPassword123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      prismaService.user.create.mockRejectedValue(new Error('Database error'));

      await expect(service.create(mockCreateUserDto)).rejects.toThrow(
        'Database error',
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(mockCreateUserDto.password, 10);
    });

    it('should throw an error if password hashing fails', async () => {
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hashing error'));

      await expect(service.create(mockCreateUserDto)).rejects.toThrow(
        'Hashing error',
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(mockCreateUserDto.password, 10);
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('findByUsername', () => {
    it('should return user when found by username', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByUsername('testuser');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found by username', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findByUsername('nonexistent');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'nonexistent' },
      });
      expect(result).toBeNull();
    });

    it('should throw an error if database query fails', async () => {
      prismaService.user.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.findByUsername('testuser')).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found by email', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
      expect(result).toBeNull();
    });

    it('should throw an error if database query fails', async () => {
      prismaService.user.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.findByEmail('test@example.com')).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findById', () => {
    it('should return user when found by id', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById(1);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found by id', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findById(999);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
      expect(result).toBeNull();
    });

    it('should throw an error if database query fails', async () => {
      prismaService.user.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.findById(1)).rejects.toThrow('Database error');
    });
  });
});
