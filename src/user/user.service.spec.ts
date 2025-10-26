import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserType } from '../common/enums/user-type.enum';
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
    findMany: jest.MockedFunction<any>;
    update: jest.MockedFunction<any>;
    delete: jest.MockedFunction<any>;
  };
};

describe('UserService', () => {
  let service: UserService;
  let prismaService: MockPrismaService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    nome: 'Test User',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword',
    tipo: UserType.UsuarioComum,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCreateUserDto: CreateUserDto = {
    nome: 'Test User',
    username: 'testuser',
    email: 'test@example.com',
    password: 'plainPassword',
    tipo: UserType.UsuarioComum,
  };

  beforeEach(async () => {
    const mockPrismaService: MockPrismaService = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
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
      prismaService.user.findUnique.mockResolvedValue(null); // Username e email não existem
      prismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.create(mockCreateUserDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledTimes(2); // Verifica username e email
      expect(bcrypt.hash).toHaveBeenCalledWith(mockCreateUserDto.password, 10);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          nome: mockCreateUserDto.nome,
          username: mockCreateUserDto.username,
          email: mockCreateUserDto.email,
          password: hashedPassword,
          tipo: mockCreateUserDto.tipo,
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...expectedResult } = mockUser;
      expect(result).toEqual(expectedResult);
    });

    it('should throw ConflictException if username already exists', async () => {
      prismaService.user.findUnique.mockResolvedValueOnce(mockUser); // Username já existe

      await expect(service.create(mockCreateUserDto)).rejects.toThrow(
        'Nome de usuário já está em uso',
      );
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: mockCreateUserDto.username },
      });
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      prismaService.user.findUnique
        .mockResolvedValueOnce(null) // Username não existe
        .mockResolvedValueOnce(mockUser); // Email já existe

      await expect(service.create(mockCreateUserDto)).rejects.toThrow(
        'Email já está em uso',
      );
      expect(prismaService.user.findUnique).toHaveBeenCalledTimes(2);
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should use default tipo if not provided', async () => {
      const createDtoWithoutTipo = { ...mockCreateUserDto };
      delete createDtoWithoutTipo.tipo;
      
      const hashedPassword = 'hashedPassword123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue(mockUser);

      await service.create(createDtoWithoutTipo);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          nome: createDtoWithoutTipo.nome,
          username: createDtoWithoutTipo.username,
          email: createDtoWithoutTipo.email,
          password: hashedPassword,
          tipo: 'UsuarioComum',
        },
      });
    });

    it('should throw an error if user creation fails', async () => {
      const hashedPassword = 'hashedPassword123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockRejectedValue(new Error('Database error'));

      await expect(service.create(mockCreateUserDto)).rejects.toThrow(
        'Database error',
      );
    });

    it('should throw an error if password hashing fails', async () => {
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hashing error'));

      await expect(service.create(mockCreateUserDto)).rejects.toThrow(
        'Hashing error',
      );
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

      const result = await service.findById('123e4567-e89b-12d3-a456-426614174000');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found by id', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findById('999e4567-e89b-12d3-a456-426614174999');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '999e4567-e89b-12d3-a456-426614174999' },
      });
      expect(result).toBeNull();
    });

    it('should throw an error if database query fails', async () => {
      prismaService.user.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.findById('123e4567-e89b-12d3-a456-426614174000')).rejects.toThrow('Database error');
    });
  });

  describe('findAll', () => {
    it('should return all users without password', async () => {
      const users = [mockUser, { ...mockUser, id: '456e7890-e89b-12d3-a456-426614174001' }];
      prismaService.user.findMany.mockResolvedValue(users);

      const result = await service.findAll();

      expect(prismaService.user.findMany).toHaveBeenCalledWith({
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
      expect(result).toEqual(users);
    });

    it('should return empty array when no users exist', async () => {
      prismaService.user.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should throw an error if database query fails', async () => {
      prismaService.user.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findOne', () => {
    it('should return user when found by id', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('123e4567-e89b-12d3-a456-426614174000');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
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
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999e4567-e89b-12d3-a456-426614174999')).rejects.toThrow(
        'Usuário não encontrado',
      );
    });

    it('should throw an error if database query fails', async () => {
      prismaService.user.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(service.findOne('123e4567-e89b-12d3-a456-426614174000')).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('update', () => {
    const updateUserDto = {
      nome: 'Updated User',
      username: 'updateduser',
      email: 'updated@example.com',
      password: 'newPassword',
      tipo: UserType.Administrador,
    };

    it('should update user successfully', async () => {
      const hashedPassword = 'hashedNewPassword';
      const updatedUser = { ...mockUser, ...updateUserDto };
      
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      prismaService.user.findUnique
        .mockResolvedValueOnce(mockUser) // User exists
        .mockResolvedValueOnce(null) // Username not taken
        .mockResolvedValueOnce(null); // Email not taken
      prismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update('123e4567-e89b-12d3-a456-426614174000', updateUserDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledTimes(3);
      expect(bcrypt.hash).toHaveBeenCalledWith(updateUserDto.password, 10);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
        data: {
          ...updateUserDto,
          password: hashedPassword,
        },
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
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.update('999e4567-e89b-12d3-a456-426614174999', updateUserDto)).rejects.toThrow(
        'Usuário não encontrado',
      );
    });

    it('should throw ConflictException when username already exists', async () => {
      prismaService.user.findUnique
        .mockResolvedValueOnce(mockUser) // User exists
        .mockResolvedValueOnce(mockUser); // Username already taken

      await expect(service.update('123e4567-e89b-12d3-a456-426614174000', updateUserDto)).rejects.toThrow(
        'Nome de usuário já está em uso',
      );
    });

    it('should throw ConflictException when email already exists', async () => {
      prismaService.user.findUnique
        .mockResolvedValueOnce(mockUser) // User exists
        .mockResolvedValueOnce(null) // Username not taken
        .mockResolvedValueOnce(mockUser); // Email already taken

      await expect(service.update('123e4567-e89b-12d3-a456-426614174000', updateUserDto)).rejects.toThrow(
        'Email já está em uso',
      );
    });

    it('should not check username/email if they are not being changed', async () => {
      const updateDtoWithoutUsername = { nome: 'Updated User' };
      
      prismaService.user.findUnique.mockResolvedValueOnce(mockUser); // User exists
      prismaService.user.update.mockResolvedValue({ ...mockUser, ...updateDtoWithoutUsername });

      await service.update('123e4567-e89b-12d3-a456-426614174000', updateDtoWithoutUsername);

      expect(prismaService.user.findUnique).toHaveBeenCalledTimes(1); // Only check if user exists
    });

    it('should not hash password if not provided', async () => {
      const updateDtoWithoutPassword = { nome: 'Updated User' };
      
      prismaService.user.findUnique.mockResolvedValueOnce(mockUser);
      prismaService.user.update.mockResolvedValue({ ...mockUser, ...updateDtoWithoutPassword });

      await service.update('123e4567-e89b-12d3-a456-426614174000', updateDtoWithoutPassword);

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
        data: updateDtoWithoutPassword,
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
    });
  });

  describe('remove', () => {
    it('should remove user successfully', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.delete.mockResolvedValue(mockUser);

      const result = await service.remove('123e4567-e89b-12d3-a456-426614174000');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });
      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });
      expect(result).toEqual({ message: 'Usuário removido com sucesso' });
    });

    it('should throw NotFoundException when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.remove('999e4567-e89b-12d3-a456-426614174999')).rejects.toThrow(
        'Usuário não encontrado',
      );
      expect(prismaService.user.delete).not.toHaveBeenCalled();
    });

    it('should throw an error if database query fails', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.delete.mockRejectedValue(new Error('Database error'));

      await expect(service.remove('123e4567-e89b-12d3-a456-426614174000')).rejects.toThrow(
        'Database error',
      );
    });
  });
});
