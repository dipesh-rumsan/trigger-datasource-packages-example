import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DATA_SOURCE_EVENTS } from '@lib/core';
import type { DataSourceEventPayload } from '@lib/core';

@Injectable()
export class DataSourceEventsListener {
  private readonly logger = new Logger(DataSourceEventsListener.name);

  constructor() {}

  @OnEvent(DATA_SOURCE_EVENTS.DHM.WATER_LEVEL)
  handleDhmWaterLevel(event: DataSourceEventPayload) {
    console.log('LOGGED EVENT');
  }

  @OnEvent(DATA_SOURCE_EVENTS.DHM.RAINFALL)
  handleDhmRainfall(event: DataSourceEventPayload) {
    console.log('LOGGED EVENT');
  }

  @OnEvent(DATA_SOURCE_EVENTS.GLOFAS.WATER_LEVEL)
  handleGlofasWaterLevel(event: DataSourceEventPayload) {
    console.log('LOGGED EVENT');
  }
}
