import { Test, TestingModule } from '@nestjs/testing';
import { EquipamentosController } from './equipamentos.controller';
import { EquipamentosService } from './equipamentos.service';
import { CreateEquipamentoDto } from './dto/create-equipamento.dto';
import { UpdateEquipamentoDto } from './dto/update-equipamento.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { FilterEquipamentoDto } from './dto/filter-equipamento.dto';
import { ExportEquipamentoCsvQueryDto } from './dto/export-equipamento-csv-query.dto';
import { StatusOperacional } from '../common/enums/status-operacional.enum';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Response } from 'express';

describe('EquipamentosController', () => {
  let controller: EquipamentosController;
  let service: EquipamentosService;

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  } as unknown as Response;

  const mockEquipamentosService = {
    create: jest.fn(),
    findAll: jest.fn(),
    exportCsvFileAndUpload: jest.fn(), // Nome atualizado conforme o Service
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
    statusOperacional: StatusOperacional.EM_USO,
    userId: '987e6543-e21b-43d2-b456-426614174111',
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

  describe('exportCsv', () => {
    it('should call service and send buffer via response', async () => {
      const mockExportResult = {
        fileName: 'equipamentos.csv',
        buffer: Buffer.from('id,nome\n1,teste'),
      };
      mockEquipamentosService.exportCsvFileAndUpload.mockResolvedValue(
        mockExportResult,
      );

      const query: ExportEquipamentoCsvQueryDto = { nome: 'Monitor' };

      await controller.exportCsv(query, mockResponse);

      expect(service.exportCsvFileAndUpload).toHaveBeenCalledWith(query);
      expect(mockResponse.send).toHaveBeenCalledWith(mockExportResult.buffer);
    });

    it('should call service with undefined when no query is provided', async () => {
      const mockExportResult = {
        fileName: 'equipamentos.csv',
        buffer: Buffer.from('data'),
      };
      mockEquipamentosService.exportCsvFileAndUpload.mockResolvedValue(
        mockExportResult,
      );

      await controller.exportCsv(undefined, mockResponse);

      expect(service.exportCsvFileAndUpload).toHaveBeenCalledWith(undefined);
      expect(mockResponse.send).toHaveBeenCalledWith(mockExportResult.buffer);
    });
  });

  // Mantendo os outros testes de CRUD que já estavam passando...
  describe('create', () => {
    it('should create an equipamento', async () => {
      mockEquipamentosService.create.mockResolvedValue(mockEquipamento);
      const result = await controller.create(mockEquipamento as any);
      expect(result).toEqual(mockEquipamento);
    });
  });

  describe('findAll', () => {
    it('should return equipamentos', async () => {
      mockEquipamentosService.findAll.mockResolvedValue({
        data: [mockEquipamento],
      });
      const result = await controller.findAll({});
      expect(result).toEqual({ data: [mockEquipamento] });
    });
  });

  describe('findOne', () => {
    it('should return one equipamento', async () => {
      mockEquipamentosService.findOne.mockResolvedValue(mockEquipamento);
      const result = await controller.findOne('123');
      expect(result).toEqual(mockEquipamento);
    });
  });
});
