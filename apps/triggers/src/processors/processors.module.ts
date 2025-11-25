import { Module } from '@nestjs/common';
import { SourcesDataModule } from 'src/sources-data/sources-data.module';
import { PhasesModule } from '../phases/phases.module';
import { ScheduleProcessor } from './schedule.processor';
import { TriggerProcessor } from './trigger.processor';
import { StatsProcessor } from './stats.processor';
import { CommunicationProcessor } from './communication.processor';
import { ActivityModule } from 'src/activity/activity.module';
import { StatsModule } from 'src/stats/stat.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CORE_MODULE } from 'src/constant';
import { NotificationProcessor } from './notification.processor';
import { BlockchainProcessor } from './blockchain.processor';
import { TriggerModule } from '../trigger/trigger.module';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: CORE_MODULE,
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST,
          port: +process.env.REDIS_PORT,
          password: process.env.REDIS_PASSWORD,
        },
      },
    ]),
    PhasesModule,
    SourcesDataModule,
    ActivityModule,
    StatsModule,
    TriggerModule,
  ],
  providers: [
    ScheduleProcessor,
    TriggerProcessor,
    // ContractProcessor,
    CommunicationProcessor,
    BlockchainProcessor,
    StatsProcessor,
    NotificationProcessor,
  ],
})
export class ProcessorsModule {}
