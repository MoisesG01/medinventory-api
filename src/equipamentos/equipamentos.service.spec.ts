import { Test, TestingModule } from '@nestjs/testing';
import { EquipamentosService } from './equipamentos.service';
import { PrismaService } from '../prisma/prisma.service';
import { BlobCsvService } from '../storage/blob-csv.service';
import { RedisCacheService } from '../cache/redis-cache.service';
import { CreateEquipamentoDto } from './dto/create-equipamento.dto';
import { UpdateEquipamentoDto } from './dto/update-equipamento.dto';
import { FilterEquipamentoDto } from './dto/filter-equipamento.dto';
import { ExportEquipamentoCsvQueryDto } from './dto/export-equipamento-csv-query.dto';
import { StatusOperacional } from '../common/enums/status-operacional.enum';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('EquipamentosService', () => {
  let service: EquipamentosService;

  const mockBlobCsvService = {
    uploadCsvAndGetReadSas: jest.fn(),
  };

  const mockCache = {
    getJson: jest.fn(),
    setJson: jest.fn(),
    del: jest.fn(),
  };

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
        {
          provide: BlobCsvService,
          useValue: mockBlobCsvService,
        },
        {
          provide: RedisCacheService,
          useValue: mockCache,
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

  describe('exportCsvToBlob', () => {
    beforeEach(() => {
      mockBlobCsvService.uploadCsvAndGetReadSas.mockResolvedValue({
        downloadUrl: 'https://example.blob.core.windows.net/c/e.csv?sas=1',
        expiresOn: new Date('2030-01-01T00:00:00.000Z'),
        blobName: 'equipamentos/test-uuid.csv',
      });
    });

    it('should correctly escape CSV fields and format dates', async () => {
      const equipamentoComEspeciais = {
        ...mockEquipamento,
        nome: 'Nome com "aspas" e , vírgula',
        dataAquisicao: null, // Testa o formatDateOnlyUtc com null
        valorAquisicao: null, // Testa o escapeCsvField com null
      };

      mockPrismaService.equipamento.findMany.mockResolvedValue([
        equipamentoComEspeciais,
      ]);

      await service.exportCsvToBlob();

      const uploadBuffer = mockBlobCsvService.uploadCsvAndGetReadSas.mock
        .calls[0][0] as Buffer;
      const text = uploadBuffer.toString('utf-8');

      // Verifica se as aspas foram duplicadas e o campo envolto em aspas
      expect(text).toContain('"Nome com ""aspas"" e , vírgula"');
      // Verifica se o valor nulo virou campo vazio no CSV
      expect(text).toContain(',,');
    });

    it('should upload CSV with BOM and header when there are no equipamentos', async () => {
      mockPrismaService.equipamento.findMany.mockResolvedValue([]);

      const result = await service.exportCsvToBlob();

      expect(mockPrismaService.equipamento.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
      });

      expect(mockBlobCsvService.uploadCsvAndGetReadSas).toHaveBeenCalled();
      const uploadBuffer = mockBlobCsvService.uploadCsvAndGetReadSas.mock
        .calls[0][0] as Buffer;
      const text = uploadBuffer.toString('utf-8');
      expect(text.charCodeAt(0)).toBe(0xfeff);
      expect(text).toContain('ID');
      expect(text).toContain('Nome');
      expect(text).toContain('Status operacional');
      expect(result.downloadUrl).toContain('example.blob');
      expect(result.blobName).toBe('equipamentos/test-uuid.csv');
      expect(result.fileName).toMatch(/^equipamentos-\d{4}-\d{2}-\d{2}\.csv$/);
    });

    it('should include data rows with filters and no pagination in uploaded buffer', async () => {
      const filters: ExportEquipamentoCsvQueryDto = {
        nome: 'Monitor',
        statusOperacional: StatusOperacional.EM_USO,
      };

      mockPrismaService.equipamento.findMany.mockResolvedValue([
        mockEquipamento,
      ]);

      await service.exportCsvToBlob(filters);

      expect(mockPrismaService.equipamento.findMany).toHaveBeenCalledWith({
        where: {
          nome: { contains: 'Monitor' },
          statusOperacional: StatusOperacional.EM_USO,
        },
        orderBy: { createdAt: 'desc' },
      });

      const uploadBuffer = mockBlobCsvService.uploadCsvAndGetReadSas.mock
        .calls[0][0] as Buffer;
      const text = uploadBuffer.toString('utf-8');
      expect(text).toContain(mockEquipamento.id);
      expect(text).toContain(mockEquipamento.nome);
      expect(text).toContain(StatusOperacional.EM_USO);
    });

    it('should escape fields containing commas in uploaded buffer', async () => {
      const withComma = {
        ...mockEquipamento,
        observacoes: 'Obs com, vírgula',
      };
      mockPrismaService.equipamento.findMany.mockResolvedValue([withComma]);

      await service.exportCsvToBlob();
      const uploadBuffer = mockBlobCsvService.uploadCsvAndGetReadSas.mock
        .calls[0][0] as Buffer;
      const text = uploadBuffer.toString('utf-8');
      expect(text).toContain('"Obs com, vírgula"');
    });
  });

  describe('findOne', () => {
    it('should return cached equipamento on cache hit', async () => {
      const cached = { id: mockEquipamento.id, nome: mockEquipamento.nome };
      mockCache.getJson.mockResolvedValue(cached);

      const result = await service.findOne(mockEquipamento.id);

      expect(mockPrismaService.equipamento.findUnique).not.toHaveBeenCalled();
      expect(result).toEqual(cached);
    });

    it('should return equipamento by id', async () => {
      mockCache.getJson.mockResolvedValue(null);
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
      expect(mockCache.setJson).toHaveBeenCalled();
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

    it('should set dates and userId to null when provided as null in updateDto', async () => {
      const updateDto: any = {
        // Usamos any aqui para o TS não reclamar do null
        dataAquisicao: null,
        userId: null,
      };

      mockPrismaService.equipamento.findUnique.mockResolvedValue(
        mockEquipamento,
      );

      // Simulamos o retorno do Prisma com os campos nulos
      const updatedWithNull = {
        ...mockEquipamento,
        dataAquisicao: null,
        userId: null,
      };
      mockPrismaService.equipamento.update.mockResolvedValue(updatedWithNull);

      const result = await service.update(mockEquipamento.id, updateDto);

      expect(mockPrismaService.equipamento.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            dataAquisicao: null,
            userId: null,
          }),
        }),
      );
      expect(result.userId).toBeNull();
    });

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
      expect(mockCache.del).toHaveBeenCalledWith(
        `equipamentos:${mockEquipamento.id}`,
      );
    });

    it('should update equipamento with optional fields', async () => {
      const updateDto: UpdateEquipamentoDto = {
        nome: 'Monitor Atualizado',
        responsavelTecnico: 'Dr. Maria Silva',
        criticidade: 'Média',
        observacoes: 'Equipamento atualizado',
      };

      const updatedEquipamento = {
        ...mockEquipamento,
        ...updateDto,
        user: {
          id: '987e6543-e21b-43d2-b456-426614174111',
          username: 'joao.silva',
          email: 'joao@exemplo.com',
          nome: 'João Silva',
        },
      };

      mockPrismaService.equipamento.findUnique.mockResolvedValue(
        mockEquipamento,
      );
      mockPrismaService.equipamento.update.mockResolvedValue(
        updatedEquipamento,
      );

      const result = await service.update(mockEquipamento.id, updateDto);

      expect(mockPrismaService.equipamento.findUnique).toHaveBeenCalledWith({
        where: { id: mockEquipamento.id },
      });
      expect(mockPrismaService.equipamento.update).toHaveBeenCalledWith({
        where: { id: mockEquipamento.id },
        data: updateDto,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              nome: true,
            },
          },
        },
      });
      expect(result).toBeDefined();
      expect(result.nome).toBe('Monitor Atualizado');
      expect(result.responsavelTecnico).toBe('Dr. Maria Silva');
      expect(result.criticidade).toBe('Média');
      expect(result.observacoes).toBe('Equipamento atualizado');
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
      expect(mockCache.del).toHaveBeenCalledWith(
        `equipamentos:${mockEquipamento.id}`,
      );
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
      expect(mockCache.del).toHaveBeenCalledWith(
        `equipamentos:${mockEquipamento.id}`,
      );
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

  describe('findAll - additional filter tests', () => {
    it('should build where clause with all filters', async () => {
      const filters: FilterEquipamentoDto = {
        nome: 'Raio-X',
        tipo: 'Imagem',
        setorAtual: 'Radiologia',
        statusOperacional: StatusOperacional.EM_USO,
      };

      mockPrismaService.equipamento.findMany.mockResolvedValue([]);
      mockPrismaService.equipamento.count.mockResolvedValue(0);

      await service.findAll(filters);

      expect(mockPrismaService.equipamento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            nome: { contains: 'Raio-X' },
            tipo: { contains: 'Imagem' },
            setorAtual: { contains: 'Radiologia' },
            statusOperacional: StatusOperacional.EM_USO,
          },
        }),
      );
    });

    it('should filter equipamentos by tipo', async () => {
      const filters: FilterEquipamentoDto = {
        tipo: 'Monitor de Sinais Vitais',
        page: 1,
        limit: 10,
      };

      mockPrismaService.equipamento.findMany.mockResolvedValue([
        mockEquipamento,
      ]);
      mockPrismaService.equipamento.count.mockResolvedValue(1);

      const result = await service.findAll(filters);

      expect(mockPrismaService.equipamento.findMany).toHaveBeenCalledWith({
        where: {
          tipo: {
            contains: 'Monitor de Sinais Vitais',
          },
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
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
    });

    it('should filter equipamentos by setorAtual', async () => {
      const filters: FilterEquipamentoDto = {
        setorAtual: 'UTI',
        page: 1,
        limit: 10,
      };

      mockPrismaService.equipamento.findMany.mockResolvedValue([
        mockEquipamento,
      ]);
      mockPrismaService.equipamento.count.mockResolvedValue(1);

      const result = await service.findAll(filters);

      expect(mockPrismaService.equipamento.findMany).toHaveBeenCalledWith({
        where: {
          setorAtual: {
            contains: 'UTI',
          },
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
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
    });

    it('should filter equipamentos by statusOperacional', async () => {
      const filters: FilterEquipamentoDto = {
        statusOperacional: StatusOperacional.EM_USO,
        page: 1,
        limit: 10,
      };

      mockPrismaService.equipamento.findMany.mockResolvedValue([
        mockEquipamento,
      ]);
      mockPrismaService.equipamento.count.mockResolvedValue(1);

      const result = await service.findAll(filters);

      expect(mockPrismaService.equipamento.findMany).toHaveBeenCalledWith({
        where: {
          statusOperacional: StatusOperacional.EM_USO,
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
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
    });
  });

  describe('update - additional field tests', () => {
    it('should update equipamento with all fields', async () => {
      const updateDto: UpdateEquipamentoDto = {
        nome: 'Monitor Atualizado',
        tipo: 'Monitor Atualizado',
        fabricante: 'Fabricante Atualizado',
        modelo: 'Modelo Atualizado',
        numeroSerie: 'SN9876543210',
        codigoPatrimonial: 'PAT-2024-002',
        setorAtual: 'UTI Atualizada',
        dataAquisicao: '2024-02-01',
        valorAquisicao: 20000.0,
        dataFimGarantia: '2026-02-01',
        vidaUtilEstimativa: 15,
        registroAnvisa: '80100470107',
        classeRisco: 'Classe III',
        dataUltimaManutencao: '2024-07-01',
        dataProximaManutencao: '2025-01-01',
        responsavelTecnico: 'Dr. Maria Silva',
        criticidade: 'Média',
        observacoes: 'Equipamento atualizado',
      };

      const updatedEquipamento = {
        ...mockEquipamento,
        ...updateDto,
        dataAquisicao: new Date('2024-02-01'),
        dataFimGarantia: new Date('2026-02-01'),
        dataUltimaManutencao: new Date('2024-07-01'),
        dataProximaManutencao: new Date('2025-01-01'),
        user: {
          id: '987e6543-e21b-43d2-b456-426614174111',
          username: 'joao.silva',
          email: 'joao@exemplo.com',
          nome: 'João Silva',
        },
      };

      mockPrismaService.equipamento.findUnique.mockResolvedValue(
        mockEquipamento,
      );
      mockPrismaService.equipamento.update.mockResolvedValue(
        updatedEquipamento,
      );

      const result = await service.update(mockEquipamento.id, updateDto);

      expect(result).toBeDefined();
      expect(result.nome).toBe('Monitor Atualizado');
      expect(result.tipo).toBe('Monitor Atualizado');
      expect(result.fabricante).toBe('Fabricante Atualizado');
      expect(result.modelo).toBe('Modelo Atualizado');
      expect(result.numeroSerie).toBe('SN9876543210');
      expect(result.codigoPatrimonial).toBe('PAT-2024-002');
      expect(result.setorAtual).toBe('UTI Atualizada');
      expect(result.responsavelTecnico).toBe('Dr. Maria Silva');
      expect(result.criticidade).toBe('Média');
      expect(result.observacoes).toBe('Equipamento atualizado');
    });
  });
});
