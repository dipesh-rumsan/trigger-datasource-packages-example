import { Global, Module } from '@nestjs/common';
import { PrismaService } from '@lib/database';
import { SettingsService } from './settings.service';

@Global()
@Module({
  controllers: [],
  providers: [PrismaService, SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
