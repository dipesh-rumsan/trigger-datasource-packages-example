import { Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { BQUEUE, JOBS } from '../constant';
import {
  CONTRACT_NAMES,
  deployments,
  getContractWithSigner,
} from '@lib/contracts';
import { ConfigService } from '@nestjs/config';
import type { SourceOracleContractWriter } from '../blockchain/types';

type BlockchainUpdateSourceValuePayload = {
  sourceId: number | string;
  value: number | string;
};

const convertToBigInt = (value: number | string): bigint => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const multiplied = numValue * 100000;
  const integerValue = Math.floor(multiplied);
  return BigInt(integerValue);
};

@Processor(BQUEUE.BLOCKCHAIN_TRANSFER)
export class BlockchainProcessor {
  private readonly logger = new Logger(BlockchainProcessor.name);

  constructor(private readonly configService: ConfigService) {}

  @Process(JOBS.BLOCKCHAIN.UPDATE_SOURCE_VALUE)
  async handleUpdateSourceValue(
    job: Job<BlockchainUpdateSourceValuePayload>,
  ): Promise<void> {
    const { sourceId, value } = job.data;
    const contractAddress = (deployments as Record<string, string>)
      ?.oracleContract;

    if (!contractAddress) {
      this.logger.error('Oracle contract address is not configured.');
      throw new Error('Oracle contract address missing.');
    }

    try {
      const contract = getContractWithSigner(
        (CONTRACT_NAMES as Record<string, string>).oracle,
        contractAddress,
        this.configService,
      ) as unknown as SourceOracleContractWriter;

      const transaction = await contract.updateSourceValue(
        BigInt(sourceId),
        convertToBigInt(value),
      );

      await transaction.wait();
      this.logger.log(
        `Source ${sourceId} value updated on-chain. Tx hash: ${transaction.hash}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update source ${sourceId} value on-chain`,
        error as Error,
      );
      throw error;
    }
  }
}
