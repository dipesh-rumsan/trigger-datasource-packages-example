import { Controller, Post, Body } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { CreateSourceDto } from './dto';

@Controller('blockchain')
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Post('create-source')
  async createSource(
    @Body() payload: CreateSourceDto,
  ): Promise<{ transactionHash: string; sourceId: string }> {
    const result = await this.blockchainService.createSource(payload);
    return result;
  }
}
