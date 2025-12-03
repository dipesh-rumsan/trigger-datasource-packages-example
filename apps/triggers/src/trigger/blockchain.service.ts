import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { BQUEUE, JOBS } from 'src/constant';
import type { Queue } from 'bull';
import { RpcException } from '@nestjs/microservices';
import { SerializedCondition } from './types';
import { BlockchainJobPayload, TriggerWithPhase } from './types';

type TriggerStatementValues = {
  value?: unknown;
  threshold?: unknown;
  dangerLevel?: unknown;
  warningLevel?: unknown;
};

@Injectable()
export class BlockchainService {
  logger = new Logger(BlockchainService.name);
  constructor(
    @InjectQueue(BQUEUE.BLOCKCHAIN_TRANSFER)
    private readonly blockchainQueue: Queue,
  ) {}

  async addTriggerOnChain(trigger: TriggerWithPhase) {
    try {
      const condition = this.buildOnChainCondition(trigger);

      const payload: BlockchainJobPayload = {
        triggerUuid: trigger.uuid,
        condition,
      };
      await this.blockchainQueue.add(JOBS.BLOCKCHAIN.ADD_TRIGGER, payload);
    } catch (error) {
      this.logger.error(
        `Failed to queue blockchain job for trigger ${trigger.uuid}`,
        error as Error,
      );
      throw new RpcException('Unable to enqueue trigger for on-chain sync.');
    }
  }

  async activateTriggerOnChain(trigger: TriggerWithPhase) {
    try {
      const condition = this.buildOnChainCondition(trigger);

      const payload: BlockchainJobPayload = {
        triggerUuid: trigger.uuid,
        condition,
      };
      await this.blockchainQueue.add(JOBS.BLOCKCHAIN.ADD_TRIGGER, payload);
    } catch (error) {
      this.logger.error(
        `Failed to queue blockchain job for trigger ${trigger.uuid}`,
        error as Error,
      );
      throw new RpcException('Unable to enqueue trigger for on-chain sync.');
    }
  }

  private buildOnChainCondition(
    trigger: TriggerWithPhase,
  ): SerializedCondition {
    const statement = trigger.triggerStatement || {};
    const sanitizedValue = this.resolveTriggerStatementValue(
      statement as TriggerStatementValues,
    );

    return {
      value: sanitizedValue.toString(),
      source: statement.source ?? trigger.source ?? '',
      operator: statement.operator ?? statement.condition ?? '>=',
      expression: statement.expression ?? '',
      sourceSubType: statement.sourceSubType ?? statement.metric ?? '',
    };
  }

  private resolveTriggerStatementValue(
    statement: TriggerStatementValues | null,
  ): string {
    if (!statement) {
      return '0';
    }
    const rawValue =
      statement.value ??
      statement.threshold ??
      statement.dangerLevel ??
      statement.warningLevel ??
      0;
    return this.sanitizeNumericValue(rawValue);
  }

  private sanitizeNumericValue(rawValue: unknown): string {
    const numericValue = Number(rawValue);
    if (!Number.isFinite(numericValue)) {
      return '0';
    }
    const safeValue = Math.max(Math.floor(numericValue), 0);
    return safeValue.toString();
  }
}
