import { ApiProperty } from '@nestjs/swagger';

export class ExportCsvResponseDto {
  @ApiProperty({
    description:
      'URL HTTPS do blob com SAS de leitura (temporário). O download deve usar esta URL.',
    example:
      'https://medinventorycsvdev.blob.core.windows.net/equipamentos-csv/equipamentos/abc.csv?sv=...',
  })
  downloadUrl: string;

  @ApiProperty({
    description: 'Instante em que o SAS de leitura expira (ISO 8601)',
    example: '2026-04-20T12:00:00.000Z',
  })
  expiresOn: string;

  @ApiProperty({
    description: 'Caminho do blob dentro do container',
    example: 'equipamentos/550e8400-e29b-41d4-a716-446655440000.csv',
  })
  blobName: string;

  @ApiProperty({
    description: 'Nome sugerido para salvar o arquivo localmente',
    example: 'equipamentos-2026-04-20.csv',
  })
  fileName: string;
}
