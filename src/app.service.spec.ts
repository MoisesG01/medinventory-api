import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return health status with correct properties', () => {
    const health = service.getHealth();

    // Verifica se a mensagem de status está correta
    expect(health.status).toBe('medinventory-api is running');

    // Verifica se as propriedades essenciais existem
    expect(health).toHaveProperty('timestamp');
    expect(health).toHaveProperty('uptime');
    expect(health).toHaveProperty('environment');

    // Verifica se o uptime é um número (segundos)
    expect(typeof health.uptime).toBe('number');
  });
});
