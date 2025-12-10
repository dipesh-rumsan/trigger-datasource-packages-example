import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import {
  CONTRACT_NAMES,
  deployments,
  getContractWithSigner,
} from '@lib/contracts';
import { BQUEUE, JOBS } from '../constant';
import { SourceInput, SourceOracleContractWriter } from './types';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectQueue(BQUEUE.BLOCKCHAIN_TRANSFER)
    private readonly blockchainQueue: Queue,
  ) {}

  async createSource(input: {
    title: string;
    sourceSubType: string;
    value: number | string;
  }): Promise<{ transactionHash: string; sourceId: string }> {
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

      const parsedInput: SourceInput = {
        ...input,
        value: BigInt(input.value),
      };

      const transaction = await contract.createSource(parsedInput);
      const receipt = await transaction.wait();
      this.logger.log(`Source created on-chain. Tx hash: ${transaction.hash}`);

      let sourceId: string | undefined;

      if (receipt && typeof receipt === 'object' && 'logs' in receipt) {
        const contractInterface = (contract as any).interface;
        if (contractInterface) {
          for (const log of receipt.logs as any[]) {
            try {
              const parsedLog = contractInterface.parseLog(log);
              if (parsedLog && parsedLog.name === 'SourceCreated') {
                sourceId = parsedLog.args.id.toString();
                this.logger.log(`Source ID extracted from event: ${sourceId}`);
                break;
              }
            } catch {
              continue;
            }
          }
        }
      }

      if (!sourceId) {
        this.logger.error(
          'Could not extract source ID from transaction receipt. This should not happen.',
        );
        throw new Error(
          'Failed to extract source ID from blockchain transaction',
        );
      }

      return {
        transactionHash: transaction.hash,
        sourceId,
      };
    } catch (error) {
      this.logger.error(`Failed to create source on-chain`, error as Error);
      throw error;
    }
  }

  async updateSourceValue(
    sourceId: number | string,
    value: number | string,
  ): Promise<void> {
    await this.blockchainQueue.add(JOBS.BLOCKCHAIN.UPDATE_SOURCE_VALUE, {
      sourceId,
      value,
    });
    this.logger.log(
      `Queued update source value job for source ${sourceId} with value ${value}`,
    );
  }
}
