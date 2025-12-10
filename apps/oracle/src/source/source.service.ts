import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@lib/database';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CreateSourceDto } from './dto';

@Injectable()
export class SourceService {
  private readonly logger = new Logger(SourceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchainService: BlockchainService,
  ) {}

  async create(dto: CreateSourceDto) {
    const { riverBasin, source, title, sourceSubType, value } = dto;
    this.logger.log(
      `Creating new source with riverBasin: ${riverBasin} and sources: ${source.join(', ')}`,
    );

    try {
      const createdSource = await this.prisma.source.create({
        data: {
          riverBasin,
          source,
        },
      });

      this.logger.log(
        `Source created in database with id: ${createdSource.id} and uuid: ${createdSource.uuid}`,
      );

      const { transactionHash, sourceId } =
        await this.blockchainService.createSource({
          title,
          sourceSubType,
          value,
        });

      this.logger.log(
        `Source created on blockchain with transaction hash: ${transactionHash} and source ID: ${sourceId}`,
      );

      await this.prisma.sourceBlockchain.create({
        data: {
          sourceId: createdSource.id,
          transactionHash,
          blockchainId: sourceId,
          chain: 'evm',
        },
      });

      this.logger.log(
        `Source blockchain record created for source ID: ${createdSource.id}`,
      );

      return {
        ...createdSource,
        transactionHash,
        blockchainId: sourceId,
      };
    } catch (error: any) {
      this.logger.error('Error while creating new source', error);
      throw error;
    }
  }
}
