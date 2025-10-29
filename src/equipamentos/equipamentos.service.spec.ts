import { Test, TestingModule } from '@nestjs/testing';
import { EquipamentosService } from './equipamentos.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipamentoDto } from './dto/create-equipamento.dto';
import { UpdateEquipamentoDto } from './dto/update-equipamento.dto';
import { FilterEquipamentoDto } from './dto/filter-equipamento.dto';
import { StatusOperacional } from '../common/enums/status-operacional.enum';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('EquipamentosService', () => {
  let service: EquipamentosService;

  const mockPrismaService = {
    equipamento: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
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
    user: {
      id: '987e6543-e21b-43d2-b456-426614174111',
      nome: 'João Silva',
      username: 'joao.silva',
      email: 'joao@exemplo.com',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipamentosService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<EquipamentosService>(EquipamentosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createEquipamentoDto: CreateEquipamentoDto = {
      nome: 'Monitor Multiparamétrico',
      tipo: 'Monitor de Sinais Vitais',
      fabricante: 'Philips',
      modelo: 'MX450',
      statusOperacional: StatusOperacional.EM_USO,
    };

    it('should create an equipamento successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '987e6543-e21b-43d2-b456-426614174111',
        nome: 'João Silva',
      });
      mockPrismaService.equipamento.create.mockResolvedValue(mockEquipamento);

      const result = await service.create(createEquipamentoDto);

      expect(mockPrismaService.equipamento.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          nome: createEquipamentoDto.nome,
          tipo: createEquipamentoDto.tipo,
          fabricante: createEquipamentoDto.fabricante,
          modelo: createEquipamentoDto.modelo,
          statusOperacional: createEquipamentoDto.statusOperacional,
        }),
        include: {
          user: {
            select: {
              id: true,
              nome: true,
              username: true,
              email: true,
            },
          },
        },
      });

      expect(result).toEqual({
        id: mockEquipamento.id,
        nome: mockEquipamento.nome,
        tipo: mockEquipamento.tipo,
        fabricante: mockEquipamento.fabricante,
        modelo: mockEquipamento.modelo,
        numeroSerie: mockEquipamento.numeroSerie,
        codigoPatrimonial: mockEquipamento.codigoPatrimonial,
        setorAtual: mockEquipamento.setorAtual,
        statusOperacional: mockEquipamento.statusOperacional,
        dataAquisicao: mockEquipamento.dataAquisicao,
        valorAquisicao: mockEquipamento.valorAquisicao,
        dataFimGarantia: mockEquipamento.dataFimGarantia,
        vidaUtilEstimativa: mockEquipamento.vidaUtilEstimativa,
        registroAnvisa: mockEquipamento.registroAnvisa,
        classeRisco: mockEquipamento.classeRisco,
        dataUltimaManutencao: mockEquipamento.dataUltimaManutencao,
        dataProximaManutencao: mockEquipamento.dataProximaManutencao,
        responsavelTecnico: mockEquipamento.responsavelTecnico,
        criticidade: mockEquipamento.criticidade,
        observacoes: mockEquipamento.observacoes,
        userId: mockEquipamento.userId,
        createdAt: mockEquipamento.createdAt,
        updatedAt: mockEquipamento.updatedAt,
      });
    });

    it('should throw BadRequestException when user not found', async () => {
      const createDtoWithUserId = {
        ...createEquipamentoDto,
        userId: 'invalid-user-id',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.create(createDtoWithUserId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDtoWithUserId)).rejects.toThrow(
        'Usuário responsável não encontrado',
      );
    });

    it('should create equipamento without userId', async () => {
      mockPrismaService.equipamento.create.mockResolvedValue(mockEquipamento);

      const result = await service.create(createEquipamentoDto);

      expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return paginated equipamentos', async () => {
      const filters: FilterEquipamentoDto = {
        page: 1,
        limit: 10,
        nome: 'Monitor',
      };

      mockPrismaService.equipamento.findMany.mockResolvedValue([
        mockEquipamento,
      ]);
      mockPrismaService.equipamento.count.mockResolvedValue(1);

      const result = await service.findAll(filters);

      expect(mockPrismaService.equipamento.findMany).toHaveBeenCalledWith({
        where: {
          nome: {
            contains: 'Monitor',
          },
        },
        skip: 0,
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              nome: true,
              username: true,
              email: true,
            },
          },
        },
      });

      expect(result).toEqual({
        data: [
          {
            id: mockEquipamento.id,
            nome: mockEquipamento.nome,
            tipo: mockEquipamento.tipo,
            fabricante: mockEquipamento.fabricante,
            modelo: mockEquipamento.modelo,
            numeroSerie: mockEquipamento.numeroSerie,
            codigoPatrimonial: mockEquipamento.codigoPatrimonial,
            setorAtual: mockEquipamento.setorAtual,
            statusOperacional: mockEquipamento.statusOperacional,
            dataAquisicao: mockEquipamento.dataAquisicao,
            valorAquisicao: mockEquipamento.valorAquisicao,
            dataFimGarantia: mockEquipamento.dataFimGarantia,
            vidaUtilEstimativa: mockEquipamento.vidaUtilEstimativa,
            registroAnvisa: mockEquipamento.registroAnvisa,
            classeRisco: mockEquipamento.classeRisco,
            dataUltimaManutencao: mockEquipamento.dataUltimaManutencao,
            dataProximaManutencao: mockEquipamento.dataProximaManutencao,
            responsavelTecnico: mockEquipamento.responsavelTecnico,
            criticidade: mockEquipamento.criticidade,
            observacoes: mockEquipamento.observacoes,
            userId: mockEquipamento.userId,
            createdAt: mockEquipamento.createdAt,
            updatedAt: mockEquipamento.updatedAt,
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    it('should return equipamentos without filters', async () => {
      mockPrismaService.equipamento.findMany.mockResolvedValue([
        mockEquipamento,
      ]);
      mockPrismaService.equipamento.count.mockResolvedValue(1);

      const result = await service.findAll();

      expect(mockPrismaService.equipamento.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              nome: true,
              username: true,
              email: true,
            },
          },
        },
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return equipamento by id', async () => {
      mockPrismaService.equipamento.findUnique.mockResolvedValue(
        mockEquipamento,
      );

      const result = await service.findOne(mockEquipamento.id);

      expect(mockPrismaService.equipamento.findUnique).toHaveBeenCalledWith({
        where: { id: mockEquipamento.id },
        include: {
          user: {
            select: {
              id: true,
              nome: true,
              username: true,
              email: true,
            },
          },
        },
      });

      expect(result).toEqual({
        id: mockEquipamento.id,
        nome: mockEquipamento.nome,
        tipo: mockEquipamento.tipo,
        fabricante: mockEquipamento.fabricante,
        modelo: mockEquipamento.modelo,
        numeroSerie: mockEquipamento.numeroSerie,
        codigoPatrimonial: mockEquipamento.codigoPatrimonial,
        setorAtual: mockEquipamento.setorAtual,
        statusOperacional: mockEquipamento.statusOperacional,
        dataAquisicao: mockEquipamento.dataAquisicao,
        valorAquisicao: mockEquipamento.valorAquisicao,
        dataFimGarantia: mockEquipamento.dataFimGarantia,
        vidaUtilEstimativa: mockEquipamento.vidaUtilEstimativa,
        registroAnvisa: mockEquipamento.registroAnvisa,
        classeRisco: mockEquipamento.classeRisco,
        dataUltimaManutencao: mockEquipamento.dataUltimaManutencao,
        dataProximaManutencao: mockEquipamento.dataProximaManutencao,
        responsavelTecnico: mockEquipamento.responsavelTecnico,
        criticidade: mockEquipamento.criticidade,
        observacoes: mockEquipamento.observacoes,
        userId: mockEquipamento.userId,
        createdAt: mockEquipamento.createdAt,
        updatedAt: mockEquipamento.updatedAt,
      });
    });

    it('should throw NotFoundException when equipamento not found', async () => {
      mockPrismaService.equipamento.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        'Equipamento não encontrado',
      );
    });
  });

  describe('update', () => {
    const updateEquipamentoDto: UpdateEquipamentoDto = {
      nome: 'Monitor Atualizado',
      statusOperacional: StatusOperacional.EM_MANUTENCAO,
    };

    it('should update equipamento successfully', async () => {
      const updatedEquipamento = {
        ...mockEquipamento,
        nome: 'Monitor Atualizado',
        statusOperacional: StatusOperacional.EM_MANUTENCAO,
      };

      mockPrismaService.equipamento.findUnique.mockResolvedValue(
        mockEquipamento,
      );
      mockPrismaService.equipamento.update.mockResolvedValue(
        updatedEquipamento,
      );

      const result = await service.update(
        mockEquipamento.id,
        updateEquipamentoDto,
      );

      expect(mockPrismaService.equipamento.update).toHaveBeenCalledWith({
        where: { id: mockEquipamento.id },
        data: {
          nome: 'Monitor Atualizado',
          statusOperacional: StatusOperacional.EM_MANUTENCAO,
        },
        include: {
          user: {
            select: {
              id: true,
              nome: true,
              username: true,
              email: true,
            },
          },
        },
      });

      expect(result.nome).toBe('Monitor Atualizado');
      expect(result.statusOperacional).toBe(StatusOperacional.EM_MANUTENCAO);
    });

    it('should throw NotFoundException when equipamento not found', async () => {
      mockPrismaService.equipamento.findUnique.mockResolvedValue(null);

      await expect(
        service.update('invalid-id', updateEquipamentoDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update('invalid-id', updateEquipamentoDto),
      ).rejects.toThrow('Equipamento não encontrado');
    });

    it('should throw BadRequestException when user not found', async () => {
      const updateDtoWithUserId = {
        ...updateEquipamentoDto,
        userId: 'invalid-user-id',
      };

      mockPrismaService.equipamento.findUnique.mockResolvedValue(
        mockEquipamento,
      );
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.update(mockEquipamento.id, updateDtoWithUserId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update(mockEquipamento.id, updateDtoWithUserId),
      ).rejects.toThrow('Usuário responsável não encontrado');
    });
  });

  describe('updateStatus', () => {
    it('should update status successfully', async () => {
      const updatedEquipamento = {
        ...mockEquipamento,
        statusOperacional: StatusOperacional.EM_MANUTENCAO,
      };

      mockPrismaService.equipamento.findUnique.mockResolvedValue(
        mockEquipamento,
      );
      mockPrismaService.equipamento.update.mockResolvedValue(
        updatedEquipamento,
      );

      const result = await service.updateStatus(
        mockEquipamento.id,
        StatusOperacional.EM_MANUTENCAO,
      );

      expect(mockPrismaService.equipamento.update).toHaveBeenCalledWith({
        where: { id: mockEquipamento.id },
        data: { statusOperacional: StatusOperacional.EM_MANUTENCAO },
        include: {
          user: {
            select: {
              id: true,
              nome: true,
              username: true,
              email: true,
            },
          },
        },
      });

      expect(result.statusOperacional).toBe(StatusOperacional.EM_MANUTENCAO);
    });

    it('should throw NotFoundException when equipamento not found', async () => {
      mockPrismaService.equipamento.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('invalid-id', StatusOperacional.EM_MANUTENCAO),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateStatus('invalid-id', StatusOperacional.EM_MANUTENCAO),
      ).rejects.toThrow('Equipamento não encontrado');
    });
  });

  describe('remove', () => {
    it('should remove equipamento successfully', async () => {
      mockPrismaService.equipamento.findUnique.mockResolvedValue(
        mockEquipamento,
      );
      mockPrismaService.equipamento.delete.mockResolvedValue(mockEquipamento);

      const result = await service.remove(mockEquipamento.id);

      expect(mockPrismaService.equipamento.delete).toHaveBeenCalledWith({
        where: { id: mockEquipamento.id },
      });

      expect(result).toEqual({ message: 'Equipamento removido com sucesso' });
    });

    it('should throw NotFoundException when equipamento not found', async () => {
      mockPrismaService.equipamento.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove('invalid-id')).rejects.toThrow(
        'Equipamento não encontrado',
      );
    });
  });
});
