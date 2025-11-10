import { Module } from '@nestjs/common';
import { SourceDataService } from './source-data.service';
import { SourceDataController } from './source-data.controller';
import { ScheduleSourcesDataService } from './schedule-sources-data.service';
import { DhmService } from '@lib/dhm-adapter';
import { GlofasServices } from '@lib/glofas-adapter';

@Module({
  imports: [],
  controllers: [SourceDataController],
  providers: [
    SourceDataService,
    ScheduleSourcesDataService,
    DhmService,
    GlofasServices,
  ],
})
export class SourceDataModule {}
