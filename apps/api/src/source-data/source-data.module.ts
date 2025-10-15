import { Module } from '@nestjs/common';
import { SourceDataService } from './source-data.service';
import { SourceDataController } from './source-data.controller';

@Module({
  controllers: [SourceDataController],
  providers: [SourceDataService],
})
export class SourceDataModule {}
