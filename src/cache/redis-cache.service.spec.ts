import { Test, TestingModule } from '@nestjs/testing';
import { RedisCacheService } from './redis-cache.service';
import { ConfigService } from '@nestjs/config';

const mockRedisInstance = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  on: jest.fn(),
  disconnect: jest.fn(),
};

// Import default → o factory deve retornar a função diretamente (sem __esModule)
// pois o TypeScript/ts-jest compila `import Redis from 'ioredis'`
// como `const ioredis_1 = require('ioredis'); new ioredis_1.default()`
jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockRedisInstance),
}));

describe('RedisCacheService', () => {
  let service: RedisCacheService;

  const mockConfigGet = jest.fn((key: string) => {
    // isEnabled() precisa de REDIS_HOST ou REDIS_URL para retornar true
    if (key === 'REDIS_HOST') return 'localhost';
    return undefined;
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    // Restaura o comportamento após clearAllMocks
    mockConfigGet.mockImplementation((key: string) => {
      if (key === 'REDIS_HOST') return 'localhost';
      return undefined;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisCacheService,
        {
          provide: ConfigService,
          useValue: { get: mockConfigGet },
        },
      ],
    }).compile();

    service = module.get<RedisCacheService>(RedisCacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return null from getJson when key does not exist', async () => {
    mockRedisInstance.get.mockResolvedValue(null);
    const result = await service.getJson('missing_key');
    expect(result).toBeNull();
  });

  it('should return parsed value from getJson', async () => {
    mockRedisInstance.get.mockResolvedValue(JSON.stringify({ foo: 'bar' }));
    const result = await service.getJson<{ foo: string }>('my_key');
    expect(result).toEqual({ foo: 'bar' });
  });

  it('should call set when setJson is called', async () => {
    await service.setJson('my_key', { foo: 'bar' });
    expect(mockRedisInstance.set).toHaveBeenCalledWith(
      'my_key',
      JSON.stringify({ foo: 'bar' }),
      'EX',
      expect.any(Number),
    );
  });

  it('should call del when del is called', async () => {
    await service.del('my_key');
    expect(mockRedisInstance.del).toHaveBeenCalledWith('my_key');
  });

  it('should disconnect on destroy', async () => {
    await service.getJson('test_key'); // força criação do client
    await service.onModuleDestroy();
    expect(mockRedisInstance.disconnect).toHaveBeenCalled();
  });

  it('should not disconnect if client was never created', async () => {
    // isEnabled() retorna false → client nunca criado
    mockConfigGet.mockReturnValue(undefined);
    const freshModule = await Test.createTestingModule({
      providers: [
        RedisCacheService,
        { provide: ConfigService, useValue: { get: mockConfigGet } },
      ],
    }).compile();
    const freshService = freshModule.get<RedisCacheService>(RedisCacheService);

    await expect(freshService.onModuleDestroy()).resolves.not.toThrow();
    expect(mockRedisInstance.disconnect).not.toHaveBeenCalled();
  });
});
