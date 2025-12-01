import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DATA_SOURCE_EVENTS } from '@lib/core';
import type { DataSourceEventPayload, Indicator } from '@lib/core';
import { DataSource, PrismaService } from '@lib/database';
import { TriggerStatement } from 'src/trigger/validation/trigger.schema';
import { Parser } from 'expr-eval';
import { TriggerService } from 'src/trigger/trigger.service';

@Injectable()
export class DataSourceEventsListener {
  private readonly logger = new Logger(DataSourceEventsListener.name);

  constructor(
    private prisma: PrismaService,
    private readonly triggerService: TriggerService,
  ) {}

  @OnEvent(DATA_SOURCE_EVENTS.DHM.WATER_LEVEL)
  async handleDhmWaterLevel(event: DataSourceEventPayload) {
    const indicators: Indicator[] = event.indicators;
    this.logger.log(
      `DHM WATER LEVEL EVENT RECEIVED ${indicators.length} indicators`,
    );
    if (indicators.length === 0) {
      this.logger.warn(`indicators not found `);
      return;
    }
    const triggers = await this.triggerService.findTriggersBySourceAndIndicator(
      DataSource.DHM,
      indicators[0].indicator,
    );

    if (!triggers.length) {
      this.logger.log('No triggers found for DHM Rainfall event');
      return;
    }

    for (const trigger of triggers) {
      const statement = trigger.triggerStatement as TriggerStatement;
      const expression = statement.expression;

      // 2. Compute MEAN of all indicator values
      const meanValue =
        indicators.reduce((sum, ind) => sum + ind.value, 0) / indicators.length;

      const meetsThreshold = this.evaluateConditionExpression(
        {
          expression,
          sourceSubType: statement.sourceSubType,
        },
        meanValue,
      );

      if (meetsThreshold) {
        this.logger.log(`Trigger ${trigger.id} MET threshold`);
        // update trigger
        await this.triggerService.activateTrigger(trigger.uuid, '', trigger);
      } else {
        this.logger.log(`Trigger ${trigger.id} NOT met`);
      }
    }
  }

  @OnEvent(DATA_SOURCE_EVENTS.DHM.RAINFALL)
  async handleDhmRainfall(event: DataSourceEventPayload) {
    const indicators: Indicator[] = event.indicators;
    this.logger.log(
      `DHM RAIN FALL EVENT RECEIVED ${indicators.length} indicators`,
    );

    if (indicators.length === 0) {
      this.logger.warn(`indicators not found `);
      return;
    }
    const triggers = await this.triggerService.findTriggersBySourceAndIndicator(
      DataSource.DHM,
      indicators[0].indicator,
    );

    if (!triggers.length) {
      this.logger.log('No triggers found for DHM Rainfall event');
      return;
    }

    for (const trigger of triggers) {
      const statement = trigger.triggerStatement as TriggerStatement;
      const expression = statement.expression;

      // 2. Compute MEAN of all indicator values
      const meanValue =
        indicators.reduce((sum, ind) => sum + ind.value, 0) / indicators.length;

      const meetsThreshold = this.evaluateConditionExpression(
        {
          expression,
          sourceSubType: statement.sourceSubType,
        },
        meanValue,
      );

      if (meetsThreshold) {
        this.logger.log(`Trigger ${trigger.id} MET threshold`);
        // update trigger
        await this.triggerService.activateTrigger(trigger.uuid, '', trigger);
      } else {
        this.logger.log(`Trigger ${trigger.id} NOT met`);
      }
    }
  }

  @OnEvent(DATA_SOURCE_EVENTS.GLOFAS.WATER_LEVEL)
  async handleGlofasWaterLevel(event: DataSourceEventPayload) {
    const indicators: Indicator[] = event.indicators;

    this.logger.log(
      `GLOFAS WATER LEVEL EVENT RECEIVED ${indicators.length} indicators`,
    );

    if (indicators.length === 0) {
      this.logger.warn(`indicators not found `);
      return;
    }
    const triggers = await this.triggerService.findTriggersBySourceAndIndicator(
      DataSource.GLOFAS,
      indicators[0].indicator,
    );

    if (!triggers.length) {
      this.logger.log('No triggers found for DHM Rainfall event');
      return;
    }
    /** The indicators freshly emitted from transform() */

    for (const trigger of triggers) {
      const statement = trigger.triggerStatement as TriggerStatement;
      const expression = statement.expression;

      // 2. Compute MEAN of all indicator values
      const meanValue =
        indicators.reduce((sum, ind) => sum + ind.value, 0) / indicators.length;

      const meetsThreshold = this.evaluateConditionExpression(
        {
          expression,
          sourceSubType: statement.sourceSubType,
        },
        meanValue,
      );

      if (meetsThreshold) {
        this.logger.log(`Trigger ${trigger.id} MET threshold`);
        // update trigger
        await this.triggerService.activateTrigger(trigger.uuid, '', trigger);
      } else {
        this.logger.log(`Trigger ${trigger.id} NOT met`);
      }
    }
  }

  private evaluateConditionExpression(
    triggerStatement: { expression: string; sourceSubType: string },
    indicatorValue: number,
  ): boolean {
    try {
      const parser = new Parser();

      const variableName = triggerStatement.sourceSubType;

      const exprResult = parser.evaluate(triggerStatement.expression, {
        [variableName]: indicatorValue,
      });

      return Boolean(exprResult);
    } catch (error) {
      this.logger.error(
        `Failed to evaluate expression: ${triggerStatement.expression}`,
        error,
      );
      return false;
    }
  }
}
