import { Global, Module } from '@nestjs/common';
import { BlobCsvService } from './blob-csv.service';

@Global()
@Module({
  providers: [BlobCsvService],
  exports: [BlobCsvService],
})
export class StorageModule {}
