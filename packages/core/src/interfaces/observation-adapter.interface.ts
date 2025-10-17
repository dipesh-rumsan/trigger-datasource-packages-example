import { Result } from '../types/result.type';
import { Indicator } from '../types/indicator.type';
import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

export abstract class ObservationAdapter<TParams = any> {
  constructor(protected readonly httpService: HttpService) {}

  // Pipeline methods
  abstract fetch(params: TParams): Promise<Result<unknown>>;
  abstract aggregate(rawData: unknown): Result<unknown>;
  abstract transform(aggregatedData: unknown): Result<Indicator[]>;

  // Main method that chains the pipeline
  abstract execute(params: TParams): Promise<Result<Indicator[]>>;
}
