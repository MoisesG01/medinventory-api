import { Test, TestingModule } from '@nestjs/testing';
import { EquipamentosController } from './equipamentos.controller';
import { EquipamentosService } from './equipamentos.service';
import { CreateEquipamentoDto } from './dto/create-equipamento.dto';
import { UpdateEquipamentoDto } from './dto/update-equipamento.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { FilterEquipamentoDto } from './dto/filter-equipamento.dto';
import { StatusOperacional } from '../common/enums/status-operacional.enum';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('EquipamentosController', () => {
  let controller: EquipamentosController;
  let service: EquipamentosService;

  const mockEquipamentosService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    remove: jest.fn(),
  };

  const mockEquipamento = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    nome: 'Monitor Multiparamétrico',
    tipo: 'Monitor de Sinais Vitais',
    fabricante: 'Philips',
    modelo: 'MX450',
    numeroSerie: 'SN1234567890',
    codigoPatrimonial: 'PAT-2024-001',
    setorAtual: 'UTI',
    statusOperacional: StatusOperacional.EM_USO,
    dataAquisicao: new Date('2024-01-15'),
    valorAquisicao: 15000.0,
    dataFimGarantia: new Date('2026-01-15'),
    vidaUtilEstimativa: 10,
    registroAnvisa: '80100470106',
    classeRisco: 'Classe II',
    dataUltimaManutencao: new Date('2024-06-01'),
    dataProximaManutencao: new Date('2024-12-01'),
    responsavelTecnico: 'Dr. João Silva',
    criticidade: 'Alta',
    observacoes: 'Equipamento em bom estado',
    userId: '987e6543-e21b-43d2-b456-426614174111',
    createdAt: new Date('2024-01-15T10:30:00.000Z'),
    updatedAt: new Date('2024-01-15T10:30:00.000Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquipamentosController],
      providers: [
        {
          provide: EquipamentosService,
          useValue: mockEquipamentosService,
        },
      ],
    }).compile();

    controller = module.get<EquipamentosController>(EquipamentosController);
    service = module.get<EquipamentosService>(EquipamentosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createEquipamentoDto: CreateEquipamentoDto = {
      nome: 'Monitor Multiparamétrico',
      tipo: 'Monitor de Sinais Vitais',
      fabricante: 'Philips',
      modelo: 'MX450',
      statusOperacional: StatusOperacional.EM_USO,
    };

    it('should create an equipamento', async () => {
      mockEquipamentosService.create.mockResolvedValue(mockEquipamento);

      const result = await controller.create(createEquipamentoDto);

      expect(service.create).toHaveBeenCalledWith(createEquipamentoDto);
      expect(result).toEqual(mockEquipamento);
    });

    it('should throw BadRequestException when user not found', async () => {
      const createDtoWithUserId = {
        ...createEquipamentoDto,
        userId: 'invalid-user-id',
      };

      mockEquipamentosService.create.mockRejectedValue(
        new BadRequestException('Usuário responsável não encontrado'),
      );

      await expect(controller.create(createDtoWithUserId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.create(createDtoWithUserId)).rejects.toThrow(
        'Usuário responsável não encontrado',
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated equipamentos', async () => {
      const filters: FilterEquipamentoDto = {
        page: 1,
        limit: 10,
        nome: 'Monitor',
      };

      const mockResponse = {
        data: [mockEquipamento],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      mockEquipamentosService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(filters);

      expect(service.findAll).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockResponse);
    });

    it('should return equipamentos without filters', async () => {
      const mockResponse = {
        data: [mockEquipamento],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      mockEquipamentosService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findOne', () => {
    it('should return equipamento by id', async () => {
      mockEquipamentosService.findOne.mockResolvedValue(mockEquipamento);

      const result = await controller.findOne(mockEquipamento.id);

      expect(service.findOne).toHaveBeenCalledWith(mockEquipamento.id);
      expect(result).toEqual(mockEquipamento);
    });

    it('should throw NotFoundException when equipamento not found', async () => {
      mockEquipamentosService.findOne.mockRejectedValue(
        new NotFoundException('Equipamento não encontrado'),
      );

      await expect(controller.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.findOne('invalid-id')).rejects.toThrow(
        'Equipamento não encontrado',
      );
    });
  });

  describe('update', () => {
    const updateEquipamentoDto: UpdateEquipamentoDto = {
      nome: 'Monitor Atualizado',
      statusOperacional: StatusOperacional.EM_MANUTENCAO,
    };

    it('should update equipamento', async () => {
      const updatedEquipamento = {
        ...mockEquipamento,
        nome: 'Monitor Atualizado',
        statusOperacional: StatusOperacional.EM_MANUTENCAO,
      };

      mockEquipamentosService.update.mockResolvedValue(updatedEquipamento);

      const result = await controller.update(
        mockEquipamento.id,
        updateEquipamentoDto,
      );

      expect(service.update).toHaveBeenCalledWith(
        mockEquipamento.id,
        updateEquipamentoDto,
      );
      expect(result).toEqual(updatedEquipamento);
    });

    it('should throw NotFoundException when equipamento not found', async () => {
      mockEquipamentosService.update.mockRejectedValue(
        new NotFoundException('Equipamento não encontrado'),
      );

      await expect(
        controller.update('invalid-id', updateEquipamentoDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.update('invalid-id', updateEquipamentoDto),
      ).rejects.toThrow('Equipamento não encontrado');
    });
  });

  describe('updateStatus', () => {
    const updateStatusDto: UpdateStatusDto = {
      statusOperacional: StatusOperacional.EM_MANUTENCAO,
    };

    it('should update equipamento status', async () => {
      const updatedEquipamento = {
        ...mockEquipamento,
        statusOperacional: StatusOperacional.EM_MANUTENCAO,
      };

      mockEquipamentosService.updateStatus.mockResolvedValue(
        updatedEquipamento,
      );

      const result = await controller.updateStatus(
        mockEquipamento.id,
        updateStatusDto,
      );

      expect(service.updateStatus).toHaveBeenCalledWith(
        mockEquipamento.id,
        StatusOperacional.EM_MANUTENCAO,
      );
      expect(result).toEqual(updatedEquipamento);
    });

    it('should throw NotFoundException when equipamento not found', async () => {
      mockEquipamentosService.updateStatus.mockRejectedValue(
        new NotFoundException('Equipamento não encontrado'),
      );

      await expect(
        controller.updateStatus('invalid-id', updateStatusDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.updateStatus('invalid-id', updateStatusDto),
      ).rejects.toThrow('Equipamento não encontrado');
    });
  });

  describe('remove', () => {
    it('should remove equipamento', async () => {
      const mockResponse = { message: 'Equipamento removido com sucesso' };

      mockEquipamentosService.remove.mockResolvedValue(mockResponse);

      const result = await controller.remove(mockEquipamento.id);

      expect(service.remove).toHaveBeenCalledWith(mockEquipamento.id);
      expect(result).toEqual(mockResponse);
    });

    it('should throw NotFoundException when equipamento not found', async () => {
      mockEquipamentosService.remove.mockRejectedValue(
        new NotFoundException('Equipamento não encontrado'),
      );

      await expect(controller.remove('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.remove('invalid-id')).rejects.toThrow(
        'Equipamento não encontrado',
      );
    });
  });
});
