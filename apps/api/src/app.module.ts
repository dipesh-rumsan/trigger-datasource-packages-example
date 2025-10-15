import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SourceDataModule } from './source-data/source-data.module';
import { PrismaModule } from '@lib/database';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule.forRootWithConfig({
      isGlobal: true,
    }),
    SourceDataModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
