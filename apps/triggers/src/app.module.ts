import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SourceDataModule } from './source-data/source-data.module';
import { PrismaModule } from '@lib/database';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule.forRootAsync({
      isGlobal: true,
      useFactory: (configService: ConfigService) => {
        // Construct DATABASE_URL dynamically from environment variables
        const dbHost = configService.get('DB_HOST', 'localhost');
        const dbPort = configService.get('DB_PORT', '5432');
        const dbUser = configService.get('DB_USERNAME', 'postgres');
        const dbPassword = configService.get('DB_PASSWORD', 'postgres');
        const dbName = configService.get('DB_NAME', 'rahat_triggers');
        const dbUrl = configService.get('DATABASE_URL', 'rahat_triggers');

        const DATABASE_URL = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?schema=public`;
        
        return {
          explicitConnect: true,
          prismaOptions: {
            datasources: {
              db: {
                url: DATABASE_URL,
              },
            },
          },
        };
      },
      inject: [ConfigService],
    }),
    SourceDataModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
