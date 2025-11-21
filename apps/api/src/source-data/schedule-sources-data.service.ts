import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { AxiosError } from 'axios';
import { Cron } from '@nestjs/schedule';
import {
  DhmWaterLevelAdapter,
  DhmRainfallAdapter,
  DhmService,
  RiverStationData,
} from '@lib/dhm-adapter';
import { GlofasAdapter, GlofasServices } from '@lib/glofas-adapter';
import {
  Indicator,
  isErr,
  HealthMonitoringService,
  HealthMonitoredAdapter,
} from '@lib/core';
import { SourceType } from '@lib/database';

@Injectable()
export class ScheduleSourcesDataService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ScheduleSourcesDataService.name);

  private dhmWaterMonitored: HealthMonitoredAdapter<undefined>;
  private dhmRainfallMonitored: HealthMonitoredAdapter<undefined>;
  private glofasMonitored: HealthMonitoredAdapter<null>;

  constructor(
    private readonly dhmWaterLevelAdapter: DhmWaterLevelAdapter,
    private readonly dhmRainfallLevelAdapter: DhmRainfallAdapter,
    private readonly glofasAdapter: GlofasAdapter,
    private readonly dhmService: DhmService,
    private readonly glofasServices: GlofasServices,
    private readonly healthService: HealthMonitoringService,
  ) {
    this.dhmWaterMonitored = new HealthMonitoredAdapter(
      this.dhmWaterLevelAdapter,
      this.healthService,
      this.dhmWaterLevelAdapter.getAdapterId(),
    );
    this.dhmRainfallMonitored = new HealthMonitoredAdapter(
      this.dhmRainfallLevelAdapter,
      this.healthService,
      this.dhmRainfallLevelAdapter.getAdapterId(),
    );
    this.glofasMonitored = new HealthMonitoredAdapter(
      this.glofasAdapter,
      this.healthService,
      this.glofasAdapter.getAdapterId(),
    );
  }
  onApplicationBootstrap() {
    this.syncRiverWaterData();
    this.syncRainfallData();
    this.synchronizeGlofas();
  }

  // run every 15 minutes
  @Cron('*/15 * * * *')
  async syncRiverWaterData() {
    const riverData = await this.dhmWaterMonitored.execute();

    if (isErr<Indicator[]>(riverData)) {
      this.logger.warn(riverData.details);
      if (riverData.details instanceof AxiosError) {
        const errorMessage = `HTTP Error: ${riverData.details.response?.status} ${riverData.details.response?.statusText} - Data: ${JSON.stringify(riverData.details.response?.data)} - Config: ${JSON.stringify(riverData.details.response?.config)}`;
        this.logger.warn(errorMessage);
      } else {
        this.logger.warn(riverData.details);
      }
      return;
    }

    riverData.data.forEach(async (indicator) => {
      const riverId = (indicator.location as any)?.basinId;
      // Currently we do not have station data so we are using dummy data
      const info: RiverStationData = {
        id: 5554,
        onm: '',
        name: riverId,
        tags: [],
        basin: 'Mahakali',
        images: [
          {
            id: 2625,
            name: 'bdca0624990c25570064692a7b807baa',
            size: 75478,
            type: 0,
            description: '',
          },
          {
            id: 2669,
            name: '8a0a35e1047c0877bef6f16699bbc61f',
            size: 61510,
            type: 0,
            description: '',
          },
        ],
        status: 'BELOW WARNING LEVEL',
        steady: 'STEADY',
        district: 'Kanchanpur',
        latitude: 28.8526,
        elevation: 162,
        longitude: 80.4344,
        series_id: 29089,
        description: 'Doda (Machheli) river at East West Highway',
        danger_level: '3.8',
        stationIndex: '281.5',
        warning_level: '3.4',
        waterLevel: {
          value: indicator.value,
          datetime: indicator.issuedAt,
        },
        history: indicator.info,
        indicator: indicator.indicator,
        units: indicator.units,
        value: indicator.value,
      };

      await this.dhmService.saveDataInDhm(
        SourceType.WATER_LEVEL,
        riverId,
        info,
      );
    });
  }

  // run every 15 minutes
  @Cron('*/15 * * * *')
  async syncRainfallData() {
    const rainfallData = await this.dhmRainfallMonitored.execute();

    if (isErr<Indicator[]>(rainfallData)) {
      this.logger.warn(rainfallData.details);
      if (rainfallData.details instanceof AxiosError) {
        const errorMessage = `HTTP Error: ${rainfallData.details.response?.status} ${rainfallData.details.response?.statusText} - Data: ${JSON.stringify(rainfallData.details.response?.data)} - Config: ${JSON.stringify(rainfallData.details.response?.config)}`;
        this.logger.warn(errorMessage);
      } else {
        this.logger.warn(rainfallData.details);
      }
      return;
    }
  }

  // run every hour
  @Cron('0 * * * *')
  async synchronizeGlofas() {
    const glofasResult = await this.glofasMonitored.execute(null);

    if (isErr<Indicator[]>(glofasResult)) {
      this.logger.warn(glofasResult.details);
      if (glofasResult.details instanceof AxiosError) {
        const errorMessage = `HTTP Error: ${glofasResult.details.response?.status} ${glofasResult.details.response?.statusText} - Data: ${JSON.stringify(glofasResult.details.response?.data)} - Config: ${JSON.stringify(glofasResult.details.response?.config)}`;
        this.logger.warn(errorMessage);
      } else {
        this.logger.warn(glofasResult.details);
      }
      return;
    }

    glofasResult.data.forEach(async (indicator) => {
      await this.glofasServices.saveDataInGlofas(
        (indicator.location as any).basinId,
        indicator,
      );
    });
  }
}
