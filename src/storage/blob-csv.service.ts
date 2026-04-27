import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DefaultAzureCredential } from '@azure/identity';
import {
  BlobSASPermissions,
  BlobServiceClient,
  SASProtocol,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from '@azure/storage-blob';

export type CsvBlobUploadResult = {
  downloadUrl: string;
  expiresOn: Date;
  blobName: string;
};

@Injectable()
export class BlobCsvService {
  private readonly logger = new Logger(BlobCsvService.name);

  constructor(private readonly config: ConfigService) {}

  private getContainerName(): string {
    return (
      this.config.get<string>('AZURE_STORAGE_CSV_CONTAINER') ??
      'equipamentos-csv'
    );
  }

  private getSasTtlMinutes(): number {
    const raw = this.config.get<string>('AZURE_STORAGE_SAS_TTL_MINUTES');
    const n = raw ? parseInt(raw, 10) : 60;
    return Number.isFinite(n) && n > 0 && n <= 7 * 24 * 60 ? n : 60;
  }

  private parseConnectionStringAccount(
    connectionString: string,
  ): { accountName: string; accountKey: string } {
    const nameMatch = /AccountName=([^;]+)/i.exec(connectionString);
    const keyMatch = /AccountKey=([^;]+)/i.exec(connectionString);
    const accountName = nameMatch?.[1]?.trim();
    const accountKey = keyMatch?.[1]?.trim();
    if (!accountName || !accountKey) {
      throw new Error('Connection string inválida: AccountName ou AccountKey ausente');
    }
    return { accountName, accountKey };
  }

  private isLocalInsecureBlobEndpoint(connectionString: string): boolean {
    // Heurística: Azurite/local costuma usar BlobEndpoint=http://...
    return /BlobEndpoint=http:\/\//i.test(connectionString);
  }

  /**
   * Envia o CSV ao blob e devolve URL com SAS de leitura (curta duração).
   * Produção (App Service): Managed Identity + user delegation SAS.
   * Local: use AZURE_STORAGE_CONNECTION_STRING (ou account name + key).
   */
  async uploadCsvAndGetReadSas(
    buffer: Buffer,
    blobName: string,
  ): Promise<CsvBlobUploadResult> {
    const containerName = this.getContainerName();
    const ttlMinutes = this.getSasTtlMinutes();
    const clockSkewMs = 5 * 60 * 1000;
    const startsOn = new Date(Date.now() - clockSkewMs);
    const expiresOn = new Date(Date.now() + ttlMinutes * 60 * 1000);
    const keyExpiresOn = new Date(expiresOn.getTime() + 60 * 60 * 1000);

    const connectionString = this.config.get<string>(
      'AZURE_STORAGE_CONNECTION_STRING',
    );

    if (connectionString) {
      const { accountName, accountKey } =
        this.parseConnectionStringAccount(connectionString);
      const blobServiceClient =
        BlobServiceClient.fromConnectionString(connectionString);
      const containerClient = blobServiceClient.getContainerClient(containerName);
      await containerClient.createIfNotExists();
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: {
          blobContentType: 'text/csv; charset=utf-8',
        },
      });

      const sharedKeyCredential = new StorageSharedKeyCredential(
        accountName,
        accountKey,
      );
      const protocol = this.isLocalInsecureBlobEndpoint(connectionString)
        ? SASProtocol.HttpsAndHttp
        : SASProtocol.Https;
      const sas = generateBlobSASQueryParameters(
        {
          containerName,
          blobName,
          permissions: BlobSASPermissions.parse('r'),
          startsOn,
          expiresOn,
          protocol,
        },
        sharedKeyCredential,
      ).toString();

      return {
        downloadUrl: `${blockBlobClient.url}?${sas}`,
        expiresOn,
        blobName,
      };
    }

    const accountName = this.config.get<string>('AZURE_STORAGE_ACCOUNT_NAME');
    if (!accountName?.trim()) {
      this.logger.warn(
        'CSV blob: defina AZURE_STORAGE_CONNECTION_STRING ou AZURE_STORAGE_ACCOUNT_NAME',
      );
      throw new ServiceUnavailableException(
        'Exportação CSV não está configurada (armazenamento Azure)',
      );
    }

    const endpoint =
      this.config.get<string>('AZURE_STORAGE_BLOB_ENDPOINT')?.trim() ||
      `https://${accountName}.blob.core.windows.net`;

    const blobServiceClient = new BlobServiceClient(
      endpoint,
      new DefaultAzureCredential(),
    );

    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists();
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: 'text/csv; charset=utf-8',
      },
    });

    const userDelegationKey = await blobServiceClient.getUserDelegationKey(
      startsOn,
      keyExpiresOn,
    );

    const protocol = endpoint.toLowerCase().startsWith('http://')
      ? SASProtocol.HttpsAndHttp
      : SASProtocol.Https;
    const sas = generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse('r'),
        startsOn,
        expiresOn,
        protocol,
      },
      userDelegationKey,
      accountName,
    ).toString();

    return {
      downloadUrl: `${blockBlobClient.url}?${sas}`,
      expiresOn,
      blobName,
    };
  }
}
