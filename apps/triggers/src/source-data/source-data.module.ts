import { Module } from '@nestjs/common';
import { SourceDataService } from './source-data.service';
import { SourceDataController } from './source-data.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [SourceDataController],
  providers: [SourceDataService, PrismaService],
})
export class SourceDataModule {}
