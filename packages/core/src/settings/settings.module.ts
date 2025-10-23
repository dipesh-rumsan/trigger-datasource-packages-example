import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Module({
  controllers: [],
  providers: [SettingsService],
})
export class SettingsModule {}
