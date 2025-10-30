import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SourceDataModule } from './source-data/source-data.module';
import { PrismaModule } from '@lib/database';
import { DhmModule } from '@lib/dhm-adapter';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { SettingsModule } from '@lib/core';
import { GlofasModule } from '@lib/glofas-adapter';
import { TriggersModule } from './triggers/trigger.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule.forRootWithConfig({
      isGlobal: true,
    }),
    HttpModule.register({
      global: true,
    }),
    DhmModule.forRoot(),
    GlofasModule.forRoot(),
    SourceDataModule,
    TriggersModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
