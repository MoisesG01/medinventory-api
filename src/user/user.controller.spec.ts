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
});
