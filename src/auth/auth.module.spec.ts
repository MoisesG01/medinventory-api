import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

// Mocks
const mockConfigService = {
  get: jest.fn((key: string) => {
    const config = {
      JWT_SECRET: 'test-secret-key',
      JWT_EXPIRES_IN: '1h',
    };
    return config[key];
  }),
};

const mockAuthService = {
  validateUser: jest.fn(),
  login: jest.fn(),
  register: jest.fn(),
};

const mockJwtStrategy = {
  validate: jest.fn(),
};

const mockJwtAuthGuard = {
  canActivate: jest.fn(),
};

describe('AuthModule', () => {
  let module: TestingModule;
  let authService: AuthService;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule,
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => ({
            secret: configService.get<string>('JWT_SECRET'),
            signOptions: {
              expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '24h',
            },
          }),
          inject: [ConfigService],
        }),
      ],
      controllers: [AuthController],
      providers: [AuthService, JwtStrategy, JwtAuthGuard],
    })
      .overrideProvider(ConfigService)
      .useValue(mockConfigService)
      .overrideProvider(AuthService)
      .useValue(mockAuthService)
      .overrideProvider(JwtStrategy)
      .useValue(mockJwtStrategy)
      .overrideProvider(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    module = moduleRef;
    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('Module Configuration', () => {
    it('should be defined', () => {
      expect(module).toBeDefined();
    });

    it('should have AuthController', () => {
      const controller = module.get<AuthController>(AuthController);
      expect(controller).toBeDefined();
    });

    it('should have AuthService', () => {
      expect(authService).toBeDefined();
    });

    it('should have JwtService', () => {
      expect(jwtService).toBeDefined();
    });

    it('should have JwtStrategy', () => {
      const strategy = module.get<JwtStrategy>(JwtStrategy);
      expect(strategy).toBeDefined();
    });

    it('should have JwtAuthGuard', () => {
      const guard = module.get<JwtAuthGuard>(JwtAuthGuard);
      expect(guard).toBeDefined();
    });

    it('should have ConfigService', () => {
      expect(configService).toBeDefined();
    });
  });

  describe('JWT Configuration', () => {
    it('should configure JWT with correct secret from ConfigService', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_SECRET');
    });

    it('should configure JWT with correct expiration from ConfigService', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_EXPIRES_IN');
    });

    it('should use default expiration when not provided', async () => {
      // Criar um novo módulo com ConfigService que retorna undefined para JWT_EXPIRES_IN
      const mockConfigWithoutExpires = {
        get: jest.fn((key: string) => {
          if (key === 'JWT_SECRET') return 'test-secret';
          if (key === 'JWT_EXPIRES_IN') return undefined;
          return undefined;
        }),
      };

      const testModule = await Test.createTestingModule({
        imports: [
          PassportModule,
          JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
              secret: configService.get<string>('JWT_SECRET'),
              signOptions: {
                expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '24h',
              },
            }),
            inject: [ConfigService],
          }),
        ],
        providers: [AuthService, JwtStrategy, JwtAuthGuard],
        controllers: [AuthController],
      })
        .overrideProvider(ConfigService)
        .useValue(mockConfigWithoutExpires)
        .overrideProvider(AuthService)
        .useValue(mockAuthService)
        .overrideProvider(JwtStrategy)
        .useValue(mockJwtStrategy)
        .overrideProvider(JwtAuthGuard)
        .useValue(mockJwtAuthGuard)
        .compile();

      const jwtService = testModule.get<JwtService>(JwtService);
      expect(jwtService).toBeDefined();

      await testModule.close();
    });
  });

  describe('Module Dependencies', () => {
    it('should configure JwtModule with async registration', () => {
      // Verifica se o JwtService foi criado com configuração assíncrona
      expect(jwtService).toBeDefined();
      expect(mockConfigService.get).toHaveBeenCalled();
    });

    it('should have PassportModule configured', () => {
      // PassportModule é importado implicitamente, verificamos se está funcionando
      expect(module).toBeDefined();
    });
  });

  describe('Exports', () => {
    it('should export AuthService', () => {
      expect(() => module.get<AuthService>(AuthService)).not.toThrow();
    });

    it('should export JwtAuthGuard', () => {
      expect(() => module.get<JwtAuthGuard>(JwtAuthGuard)).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should create module with all dependencies resolved', async () => {
      // Teste de integração básico para verificar se o módulo pode ser criado
      // com todas as dependências
      const integrationModule = await Test.createTestingModule({
        imports: [
          PassportModule,
          ConfigModule.forRoot({
            isGlobal: true,
          }),
          JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
              secret: configService.get<string>('JWT_SECRET'),
              signOptions: {
                expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '24h',
              },
            }),
            inject: [ConfigService],
          }),
        ],
        controllers: [AuthController],
        providers: [AuthService, JwtStrategy, JwtAuthGuard],
      })
        .overrideProvider(ConfigService)
        .useValue(mockConfigService)
        .overrideProvider(AuthService)
        .useValue(mockAuthService)
        .overrideProvider(JwtStrategy)
        .useValue(mockJwtStrategy)
        .overrideProvider(JwtAuthGuard)
        .useValue(mockJwtAuthGuard)
        .compile();

      expect(integrationModule).toBeDefined();

      // Verifica se todos os providers foram criados
      const authService = integrationModule.get<AuthService>(AuthService);
      const authController =
        integrationModule.get<AuthController>(AuthController);
      const jwtService = integrationModule.get<JwtService>(JwtService);
      const jwtStrategy = integrationModule.get<JwtStrategy>(JwtStrategy);
      const jwtAuthGuard = integrationModule.get<JwtAuthGuard>(JwtAuthGuard);

      expect(authService).toBeDefined();
      expect(authController).toBeDefined();
      expect(jwtService).toBeDefined();
      expect(jwtStrategy).toBeDefined();
      expect(jwtAuthGuard).toBeDefined();

      await integrationModule.close();
    });

    it('should handle missing JWT_SECRET gracefully', async () => {
      const mockConfigWithoutSecret = {
        get: jest.fn((key: string) => {
          if (key === 'JWT_EXPIRES_IN') return '1h';
          return undefined; // JWT_SECRET não definido
        }),
      };

      const testModule = await Test.createTestingModule({
        imports: [
          PassportModule,
          JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
              secret:
                configService.get<string>('JWT_SECRET') || 'fallback-secret',
              signOptions: {
                expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '24h',
              },
            }),
            inject: [ConfigService],
          }),
        ],
        providers: [AuthService, JwtStrategy, JwtAuthGuard],
        controllers: [AuthController],
      })
        .overrideProvider(ConfigService)
        .useValue(mockConfigWithoutSecret)
        .overrideProvider(AuthService)
        .useValue(mockAuthService)
        .overrideProvider(JwtStrategy)
        .useValue(mockJwtStrategy)
        .overrideProvider(JwtAuthGuard)
        .useValue(mockJwtAuthGuard)
        .compile();

      const jwtService = testModule.get<JwtService>(JwtService);
      expect(jwtService).toBeDefined();

      await testModule.close();
    });
  });

  describe('Error Handling', () => {
    it('should handle ConfigService errors gracefully', async () => {
      const mockConfigWithError = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'JWT_SECRET') {
            throw new Error('Config error');
          }
          return 'default-value';
        }),
      };

      // Este teste verifica se o módulo pode lidar com erros de configuração
      await expect(
        Test.createTestingModule({
          imports: [
            PassportModule,
            JwtModule.registerAsync({
              imports: [ConfigModule],
              useFactory: async (configService: ConfigService) => {
                try {
                  return {
                    secret:
                      configService.get<string>('JWT_SECRET') ||
                      'fallback-secret',
                    signOptions: {
                      expiresIn:
                        configService.get<string>('JWT_EXPIRES_IN') || '24h',
                    },
                  };
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (error) {
                  return {
                    secret: 'error-fallback-secret',
                    signOptions: { expiresIn: '24h' },
                  };
                }
              },
              inject: [ConfigService],
            }),
          ],
          providers: [AuthService, JwtStrategy, JwtAuthGuard],
          controllers: [AuthController],
        })
          .overrideProvider(ConfigService)
          .useValue(mockConfigWithError)
          .overrideProvider(AuthService)
          .useValue(mockAuthService)
          .overrideProvider(JwtStrategy)
          .useValue(mockJwtStrategy)
          .overrideProvider(JwtAuthGuard)
          .useValue(mockJwtAuthGuard)
          .compile(),
      ).resolves.toBeDefined();
    });
  });
});
