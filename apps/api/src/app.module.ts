import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SourceDataModule } from './source-data/source-data.module';
import { PrismaModule } from '@lib/database';
import { DhmModule } from '@lib/dhm-adapter';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { SettingsModule, SettingsService } from '@lib/core';

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
    DhmModule.forRoot(), // Register globally in AppModule
    SourceDataModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
