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
import type { BlockchainJobPayload } from '../trigger/types';
import { TriggerService } from '../trigger/trigger.service';

@Processor(BQUEUE.BLOCKCHAIN_TRANSFER)
export class BlockchainProcessor {
  private readonly logger = new Logger(BlockchainProcessor.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly triggerService: TriggerService,
  ) {}

  @Process(JOBS.BLOCKCHAIN.ADD_TRIGGER)
  async handleAddTrigger(job: Job<BlockchainJobPayload>): Promise<void> {
    const { triggerUuid, condition } = job.data;
    const contractAddress = deployments?.triggerContract;

    if (!contractAddress) {
      this.logger.error('Trigger contract address is not configured.');
      throw new Error('Trigger contract address missing.');
    }

    try {
      const contract = getContractWithSigner(
        CONTRACT_NAMES.trigger,
        contractAddress,
        this.configService,
      ) as any;

      const parsedCondition = {
        ...condition,
        value: BigInt(condition.value),
      };

      const transaction = await contract.addTrigger(parsedCondition);
      await transaction.wait();
      this.logger.log(
        `Trigger ${triggerUuid} stored on-chain. Tx hash: ${transaction.hash}`,
      );
      await this.triggerService.updateTransaction(
        triggerUuid,
        transaction.hash,
      );
    } catch (error) {
      this.logger.error(
        `Failed to add trigger ${triggerUuid} on-chain`,
        error as Error,
      );
      throw error;
    }
  }
}
