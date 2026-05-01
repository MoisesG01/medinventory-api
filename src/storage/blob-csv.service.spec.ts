import { Test, TestingModule } from '@nestjs/testing';
import { BlobCsvService } from './blob-csv.service';
import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { BlobServiceClient } from '@azure/storage-blob';

// Mock das funções globais da Azure
jest.mock('@azure/storage-blob', () => {
  return {
    BlobServiceClient: {
      fromConnectionString: jest.fn(),
    },
    StorageSharedKeyCredential: jest.fn(),
    generateBlobSASQueryParameters: jest.fn().mockReturnValue({
      toString: () => 'mock-sas-token',
    }),
    BlobSASPermissions: {
      parse: jest.fn(),
    },
    SASProtocol: { Https: 'https' },
    DefaultAzureCredential: jest.fn(),
  };
});

describe('BlobCsvService', () => {
  let service: BlobCsvService;
  let configService: ConfigService;

  const mockBlockBlobClient = {
    uploadData: jest.fn().mockResolvedValue({}),
    url: 'https://medinventory.blob.core.windows.net/equipamentos-csv/test.csv',
  };

  const mockContainerClient = {
    getBlockBlobClient: jest.fn().mockReturnValue(mockBlockBlobClient),
    createIfNotExists: jest.fn().mockResolvedValue({}),
  };

  const mockBlobServiceClient = {
    getContainerClient: jest.fn().mockReturnValue(mockContainerClient),
    getUserDelegationKey: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlobCsvService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BlobCsvService>(BlobCsvService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should upload using Connection String (Local Flow)', async () => {
    // Configura os mocks para o fluxo de Connection String
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'AZURE_STORAGE_CONNECTION_STRING')
        return 'DefaultEndpointsProtocol=https;AccountName=medtest;AccountKey=abc;EndpointSuffix=core.windows.net';
      return null;
    });

    (BlobServiceClient.fromConnectionString as jest.Mock).mockReturnValue(
      mockBlobServiceClient,
    );

    const result = await service.uploadCsvAndGetReadSas(
      Buffer.from('test'),
      'test.csv',
    );

    expect(result.downloadUrl).toContain('mock-sas-token');
    expect(mockBlockBlobClient.uploadData).toHaveBeenCalled();
  });

  it('should throw ServiceUnavailableException if no config is found', async () => {
    jest.spyOn(configService, 'get').mockReturnValue(null);

    await expect(
      service.uploadCsvAndGetReadSas(Buffer.from('test'), 'test.csv'),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('should parse connection string correctly or throw error', () => {
    // Testa a função privada indiretamente através de uma string mal formatada
    jest.spyOn(configService, 'get').mockReturnValue('InvalidString');

    expect(
      service.uploadCsvAndGetReadSas(Buffer.from('test'), 'test.csv'),
    ).rejects.toThrow('Connection string inválida');
  });
});
