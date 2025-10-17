import { Module } from '@nestjs/common';
import { SourceDataService } from './source-data.service';
import { SourceDataController } from './source-data.controller';
import { DhmService } from './dhm.service';
import { GlofasService } from './glofas.service';
import { ScheduleSourcesDataService } from './schedule-sources-data.service';
import { GfhService } from './gfh.service';

@Module({
  imports: [],
  controllers: [SourceDataController],
  providers: [
    SourceDataService,
    GlofasService,
    DhmService,
    ScheduleSourcesDataService,
    GfhService,
  ],
})
export class SourceDataModule {}
