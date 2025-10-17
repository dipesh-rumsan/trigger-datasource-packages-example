import { Result } from '../types/result.type';
import { Indicator } from '../types/indicator.type';
import { HttpService } from '@nestjs/axios';
import { OnModuleInit } from '@nestjs/common';

export abstract class ObservationAdapter<TParams = any>
  implements OnModuleInit
{
  constructor(protected readonly httpService: HttpService) {}

  /**
   * Called by NestJS after all dependencies are injected
   * Override this method to perform initialization that requires injected dependencies
   */
  async onModuleInit(): Promise<void> {
    await this.init();
  }

  /**
   * Initialize the adapter - called automatically after dependency injection is complete
   * Override this method in your adapter implementation
   */
  abstract init(): Promise<void>;

  // Pipeline methods
  abstract fetch(params: TParams): Promise<Result<unknown>>;
  abstract aggregate(rawData: unknown): Result<unknown>;
  abstract transform(aggregatedData: unknown): Result<Indicator[]>;

  // Main method that chains the pipeline
  abstract execute(params: TParams): Promise<Result<Indicator[]>>;
}
