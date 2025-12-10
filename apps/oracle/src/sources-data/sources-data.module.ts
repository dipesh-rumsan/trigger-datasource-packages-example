import { Module } from '@nestjs/common';
import { ScheduleSourcesDataService } from './schedule-sources-data.service';
import { HttpModule } from '@nestjs/axios';
import { DhmModule, DhmService as DhmServiceLib } from '@lib/dhm-adapter';
import { ConfigService } from '@nestjs/config';
import { HealthMonitoringService, HealthCacheService } from '@lib/core';
import { GlofasModule, GlofasServices } from '@lib/glofas-adapter';
import { GfhModule, GfhService } from '@lib/gfh-adapter';
import { BullModule } from '@nestjs/bull';
import { BQUEUE } from '../constant';
import Redis from 'ioredis';

@Module({
  imports: [
    HttpModule,
    DhmModule.forRoot(),
    GlofasModule.forRoot(),
    GfhModule.forRoot(),
    BullModule.registerQueue({
      name: BQUEUE.BLOCKCHAIN_TRANSFER,
    }),
  ],
  controllers: [],
  providers: [
    ScheduleSourcesDataService,
    GfhService,
    ConfigService,
    HealthCacheService,
    HealthMonitoringService,
    DhmServiceLib,
    GlofasServices,
    GfhService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new Redis({
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          password: configService.get('REDIS_PASSWORD'),
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [ScheduleSourcesDataService, GfhService],
})
export class SourcesDataModule {}
