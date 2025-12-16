import { HttpService } from '@nestjs/axios';
import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
// import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService, DataSource, SourceType } from '@lib/database';
import { SettingsService } from '@lib/core';
import type { Queue } from 'bull';
// import { BQUEUE, EVENTS, JOBS } from '../constants';
// import { AbstractSource } from './datasource.abstract';
// import { GlofasDataObject, GlofasStationInfo } from './dto';
import {
  AddTriggerStatementDto,
  GlofasDataObject,
  GlofasStationInfo,
} from './dto';

import { EventEmitter2 } from '@nestjs/event-emitter';
import { BQUEUE, EVENTS, JOBS } from 'src/constant';
import { SourcesDataService } from './sources-data.service';
import { RpcException } from '@nestjs/microservices';
import { DataSourceConfigValue } from 'src/types/datasource-config.type';

@Injectable()
export class GlofasService implements OnApplicationBootstrap {
  private readonly logger = new Logger(GlofasService.name);
  private baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private prisma: PrismaService,
    private readonly sourceDataService: SourcesDataService,
    @InjectQueue(BQUEUE.TRIGGER) private readonly triggerQueue: Queue,
    private eventEmitter: EventEmitter2,
  ) {}

  async onApplicationBootstrap() {
    const url = await this.getBaseUrl();
    this.logger.fatal(`GLOFAS base URL Set to: ${url}`);
    this.baseUrl = url;
    if (!url) {
      this.logger.error('GLOFAS base URL not found');
    }
  }

  private async getBaseUrl(): Promise<string> {
    const dataSourceConfig = (await SettingsService.get(
      'DATASOURCECONFIG',
    )) as DataSourceConfigValue;

    return dataSourceConfig[DataSource.GLOFAS]?.URL;
  }

  async getStationData(payload: GlofasStationInfo) {
    const glofasURL = new URL(payload.URL);

    const queryParams = {
      SERVICE: 'WMS',
      VERSION: '1.3.0',
      REQUEST: 'GetFeatureInfo',
      FORMAT: 'image/png',
      TRANSPARENT: 'true',
      QUERY_LAYERS: 'reportingPoints',
      LAYERS: 'reportingPoints',
      INFO_FORMAT: 'application/json',
      WIDTH: '832',
      HEIGHT: '832',
      CRS: 'EPSG:3857',
      STYLES: '',
      BBOX: payload.BBOX,
      I: payload.I,
      J: payload.J,
      TIME: payload.TIMESTRING,
      // BBOX: '9914392.14877593,2400326.5202299603,12627804.736861974,5113739.108316004',
      // I: '108',
      // J: '341',
      // TIME: "2024-06-09T00:00:00"
    };

    for (const [key, value] of Object.entries(queryParams)) {
      glofasURL.searchParams.append(key, value);
    }

    this.logger.log(`Fetching GLOFAS data from URL: ${this.baseUrl}`);

    return (await this.httpService.axiosRef.get(this.baseUrl)).data;
  }

  async saveGlofasStationData(riverBasin: string, payload: GlofasDataObject) {
    try {
      const recordExists = await this.prisma.sourcesData.findFirst({
        where: {
          dataSource: DataSource.GLOFAS,
          source: {
            riverBasin: riverBasin,
          },
          info: {
            path: ['forecastDate'],
            equals: payload.forecastDate,
          },
        },
      });

      if (!recordExists) {
        // await this.prisma.sourcesData.create({
        //   data: {
        //     source: 'GLOFAS',
        //     riverBasin: riverBasin,
        //     info: JSON.parse(JSON.stringify(payload)),
        //   },
        // });
        await this.sourceDataService.create({
          riverBasin: riverBasin,
          source: 'GLOFAS',
          type: SourceType.WATER_LEVEL,
          info: JSON.parse(JSON.stringify(payload)),
        });
      }
    } catch (error: any) {
      this.logger.error(error);
    }
  }

  async getLatestWaterLevels() {
    this.logger.log('Getting latest water levels from Glofas');
    try {
      const glofasSettings = SettingsService.get(
        'DATASOURCE.GLOFAS',
      ) as GlofasStationInfo;

      return await this.prisma.sourcesData.findFirst({
        where: {
          source: {
            riverBasin: glofasSettings.LOCATION,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error: any) {
      this.logger.error(error);
      throw new RpcException(error);
    }
  }

  async findGlofasDataByDate(riverBasin: string, forecastDate: string) {
    const recordExists = await this.prisma.sourcesData.findFirst({
      where: {
        source: {
          riverBasin: {
            contains: riverBasin,
          },
        },
        dataSource: DataSource.GLOFAS,
        info: {
          path: ['forecastDate'],
          equals: forecastDate,
        },
      },
    });

    return recordExists;
  }
}
