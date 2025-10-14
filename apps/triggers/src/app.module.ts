import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SourceDataModule } from './source-data/source-data.module';

@Module({
  imports: [SourceDataModule, SourceDataModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
