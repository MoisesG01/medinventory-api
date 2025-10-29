import { Test, TestingModule } from '@nestjs/testing';
import { EquipamentosController } from './equipamentos.controller';
import { EquipamentosService } from './equipamentos.service';

describe('EquipamentosModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [EquipamentosController],
      providers: [
        {
          provide: EquipamentosService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            updateStatus: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide EquipamentosController', () => {
    const controller = module.get<EquipamentosController>(
      EquipamentosController,
    );
    expect(controller).toBeDefined();
  });

  it('should provide EquipamentosService', () => {
    const service = module.get<EquipamentosService>(EquipamentosService);
    expect(service).toBeDefined();
  });
});
