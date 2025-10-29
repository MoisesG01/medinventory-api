import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword',
  };

  const mockUserService = {
    findById: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMyProfile', () => {
    it('should return user profile without password if user exists', async () => {
      mockUserService.findById.mockResolvedValue(mockUser);
      const req = { user: { id: 1 } };
      const result = await controller.getMyProfile(req);
      expect(result).toEqual({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
      });
      expect(mockUserService.findById).toHaveBeenCalledWith(1);
    });

    it('should return message if user not found', async () => {
      mockUserService.findById.mockResolvedValue(null);
      const req = { user: { id: 2 } };
      const result = await controller.getMyProfile(req);
      expect(result).toEqual({
        message: 'Usuário não encontrado',
        error: 'Not Found',
        statusCode: 404,
      });
      expect(mockUserService.findById).toHaveBeenCalledWith(2);
    });
  });

  describe('getProtectedData', () => {
    it('should return protected data with user and timestamp', () => {
      const req = { user: { id: 1, username: 'testuser' } };
      const result = controller.getProtectedData(req);
      expect(result).toHaveProperty('message', 'Esta é uma rota protegida!');
      expect(result).toHaveProperty('user', req.user);
      expect(result).toHaveProperty('timestamp');
      // Verifica se o timestamp é uma string ISO válida
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });
  });

  describe('create', () => {
    it('should create a user', async () => {
      const createUserDto = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        nome: 'New User',
      };

      const createdUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...createUserDto,
        password: 'hashedpassword',
        tipo: 'UsuarioComum',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserService.create.mockResolvedValue(createdUser);

      const result = await controller.create(createUserDto);

      expect(mockUserService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(createdUser);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          username: 'user1',
          email: 'user1@example.com',
          nome: 'User 1',
          tipo: 'UsuarioComum',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          username: 'user2',
          email: 'user2@example.com',
          nome: 'User 2',
          tipo: 'Administrador',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockUserService.findAll.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(mockUserService.findAll).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('findOne', () => {
    it('should return user by id', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const user = {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        nome: 'Test User',
        tipo: 'UsuarioComum',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserService.findOne.mockResolvedValue(user);

      const result = await controller.findOne(userId);

      expect(mockUserService.findOne).toHaveBeenCalledWith(userId);
      expect(result).toEqual(user);
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const updateUserDto = {
        nome: 'Updated User',
        email: 'updated@example.com',
      };

      const updatedUser = {
        id: userId,
        username: 'testuser',
        ...updateUserDto,
        password: 'hashedpassword',
        tipo: 'UsuarioComum',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(userId, updateUserDto);

      expect(mockUserService.update).toHaveBeenCalledWith(
        userId,
        updateUserDto,
      );
      expect(result).toEqual(updatedUser);
    });
  });

  describe('remove', () => {
    it('should remove user', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockResponse = { message: 'Usuário removido com sucesso' };

      mockUserService.remove.mockResolvedValue(mockResponse);

      const result = await controller.remove(userId);

      expect(mockUserService.remove).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getMyProfile - error handling', () => {
    it('should handle service errors', async () => {
      mockUserService.findById.mockRejectedValue(new Error('Database error'));
      const req = { user: { id: 1 } };

      const result = await controller.getMyProfile(req);

      expect(result).toEqual({
        message: 'Erro ao buscar usuário',
        error: 'Database error',
        statusCode: 500,
      });
    });
  });
});
