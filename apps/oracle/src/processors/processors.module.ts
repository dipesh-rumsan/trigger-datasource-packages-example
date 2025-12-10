import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlockchainProcessor } from './blockchain.processor';

@Module({
  imports: [ConfigModule],
  providers: [BlockchainProcessor],
})
export class ProcessorsModule {}
