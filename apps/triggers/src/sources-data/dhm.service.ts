import { HttpService } from '@nestjs/axios';
import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService, DataSource, SourceType } from '@lib/database';
import type { Queue } from 'bull';
import { DateTime } from 'luxon';
import { BQUEUE, JOBS } from 'src/constant';
import {
  AddTriggerStatementDto,
  DhmDataObject,
  DHMWaterLevelInfo,
} from './dto';
import { RpcException } from '@nestjs/microservices';
import {
  InputItem,
  NormalizedItem,
  RainfallStationData,
  RiverStationData,
} from 'src/types/data-source';
import { scrapeDataFromHtml } from 'src/common';
import {
  dhmRainfallWatchUrl,
  dhmRiverWatchUrl,
} from 'src/constant/datasourceUrls';
import { SettingsService } from '@lib/core';
import {
  DataSourceConfigValue,
  DataSourceDHMConfig,
} from 'src/types/datasource-config.type';
@Injectable()
export class DhmService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DhmService.name);
  private dhmRainfallWatchUrl: string = dhmRainfallWatchUrl;
  private dhmRiverWatchUrl: string = dhmRiverWatchUrl;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private prisma: PrismaService,
    @InjectQueue(BQUEUE.TRIGGER) private readonly triggerQueue: Queue,
  ) {}

  async onApplicationBootstrap() {
    const config = await this.getUrlConfig();

    if (config) {
      this.dhmRainfallWatchUrl = config[SourceType.RAINFALL].URL;
      this.dhmRiverWatchUrl = config[SourceType.WATER_LEVEL].URL;
      this.logger.fatal(
        `DHM rainfall watch URL Set to: ${this.dhmRainfallWatchUrl}`,
      );
      this.logger.fatal(`DHM river watch URL Set to: ${this.dhmRiverWatchUrl}`);
    }
  }

  private async getUrlConfig(): Promise<DataSourceDHMConfig | null> {
    const dataSourceConfig = (await SettingsService.get(
      'DATASOURCECONFIG',
    )) as DataSourceConfigValue;

    return dataSourceConfig[DataSource.DHM] || null;
  }

  async getRiverStations() {
    this.logger.log('Fetching river stations from DHM');
    try {
      // TODO: Need to add DHM variable in environment variable
      const dataSourceURL = this.configService.get('DHM');
      const riverStationsURL = `${dataSourceURL}/river-stations/?latest=true`;
      console.log(
        '🚀 ~ DhmService ~ getRiverStations ~ riverStationsURL:',
        riverStationsURL,
      );
      const stations = await this.getData(riverStationsURL);
      return stations.data;
    } catch (error: any) {
      this.logger.error(error);
      throw new RpcException('Failed to fetch river stations');
    }
  }

  async getData(url: string): Promise<any> {
    return await this.httpService.axiosRef.get(url);
  }

  async getDhmRiverWatchData(payload: {
    date: string;
    period: string;
    seriesid: string;
    location: string;
  }): Promise<{ [key: string]: any }[]> {
    const { date, period, seriesid, location } = payload;

    const form = new FormData();
    form.append('date', date);
    form.append('period', period);
    form.append('seriesid', seriesid);

    try {
      const {
        data: { data },
      } = await this.httpService.axiosRef.post(dhmRiverWatchUrl, form);

      const sanitizedData = scrapeDataFromHtml(data.table);

      if (!sanitizedData || sanitizedData.length === 0) {
        this.logger.warn(`No history data returned for ${location}`);
        return;
      }
      return sanitizedData;
    } catch (e) {
      this.logger.log(
        `Error fetching river watch by series id: ${seriesid}`,
        e,
      );
    }
  }

  async getDhmRainfallWatchData(payload: {
    date: string;
    period: string;
    seriesid: string;
    location: string;
  }): Promise<{ [key: string]: any }[]> {
    const { date, period, seriesid, location } = payload;

    const form = new FormData();
    form.append('date', date);
    form.append('period', period);
    form.append('seriesid', seriesid);

    try {
      const {
        data: { data },
      } = await this.httpService.axiosRef.post(dhmRainfallWatchUrl, form);

      const sanitizedData = scrapeDataFromHtml(data.table);

      if (!sanitizedData || sanitizedData.length === 0) {
        this.logger.warn(`No history data returned for ${location}`);
        return;
      }
      return sanitizedData;
    } catch (e) {
      this.logger.log(
        `Error fetching rainfall watch by series id: ${seriesid}`,
        e,
      );
    }
  }

  async normalizeDhmRiverAndRainfallWatchData(
    dataArray: InputItem[],
  ): Promise<NormalizedItem[]> {
    return dataArray.map((item) => {
      const base = {
        datetime: item.Date,
      };

      if ('Point' in item) {
        return {
          ...base,
          value: item.Point,
        };
      }

      if ('Average' in item && 'Max' in item && 'Min' in item) {
        return {
          ...base,
          value: item.Average,
          max: item.Max,
          min: item.Min,
        };
      }

      if ('Total' in item && 'Hourly' in item) {
        return {
          ...base,
          value: item.Total,
          min: Math.min(item.Hourly, item.Total),
          max: Math.max(item.Hourly, item.Total),
        };
      }

      if ('Total' in item && 'Daily' in item) {
        return {
          ...base,
          value: item.Total,
          min: Math.min(item.Daily, item.Total),
          max: Math.max(item.Daily, item.Total),
        };
      }

      throw new Error('Invalid data format');
    });
  }
}
