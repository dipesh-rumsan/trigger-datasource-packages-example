import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleInit,
} from '@nestjs/common';
import { AxiosError } from 'axios';
import { Cron } from '@nestjs/schedule';
import {
  DhmWaterLevelAdapter,
  DhmRainfallAdapter,
  DhmService,
  RiverStationData,
  RainfallStationData,
} from '@lib/dhm-adapter';
import { GlofasAdapter, GlofasServices } from '@lib/glofas-adapter';
import { GfhAdapter, GfhService } from '@lib/gfh-adapter';
import {
  Indicator,
  isErr,
  HealthMonitoringService,
  HealthMonitoredAdapter,
  HealthCacheService,
  ObservationAdapter,
} from '@lib/core';
import { SourceType } from '@lib/database';

@Injectable()
export class ScheduleSourcesDataService
  implements OnModuleInit, OnApplicationBootstrap
{
  private readonly logger = new Logger(ScheduleSourcesDataService.name);

  private dhmWaterMonitored: HealthMonitoredAdapter<undefined>;
  private dhmRainfallMonitored: HealthMonitoredAdapter<undefined>;
  private glofasMonitored: HealthMonitoredAdapter<null>;
  private gfhMonitored: HealthMonitoredAdapter<undefined>;

  constructor(
    @Inject(HealthCacheService)
    private readonly healthCacheService: HealthCacheService,
    private readonly dhmWaterLevelAdapter: DhmWaterLevelAdapter,
    private readonly dhmRainfallLevelAdapter: DhmRainfallAdapter,
    private readonly glofasAdapter: GlofasAdapter,
    private readonly gfhAdapter: GfhAdapter,
    private readonly dhmService: DhmService,
    private readonly glofasServices: GlofasServices,
    private readonly gfhService: GfhService,
    private readonly healthService: HealthMonitoringService,
  ) {
    this.dhmWaterMonitored = this.wrapWithHealthMonitoring(
      this.dhmWaterLevelAdapter,
    );
    this.dhmRainfallMonitored = this.wrapWithHealthMonitoring(
      this.dhmRainfallLevelAdapter,
    );
    this.glofasMonitored = this.wrapWithHealthMonitoring(this.glofasAdapter);
    this.gfhMonitored = this.wrapWithHealthMonitoring(this.gfhAdapter);
  }

  onModuleInit() {
    HealthMonitoringService.setCacheService(this.healthCacheService);
    [
      this.dhmWaterLevelAdapter,
      this.dhmRainfallLevelAdapter,
      this.glofasAdapter,
      this.gfhAdapter,
    ].forEach((adapter) => adapter.setHealthService(this.healthService));
  }

  onApplicationBootstrap() {
    this.syncRiverWaterData();
    this.syncRainfallData();
    this.synchronizeGlofas();
    this.syncGfhData();
  }

  private wrapWithHealthMonitoring<T>(
    adapter: ObservationAdapter<T>,
  ): HealthMonitoredAdapter<T> {
    return new HealthMonitoredAdapter(
      adapter,
      this.healthService,
      adapter.getAdapterId(),
    );
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
      // return;
    }
    // Currently rainfall api is not working so we are using dummy data
    const info: RainfallStationData = {
      id: 111,
      name: 'Doda river at East-West Highway',
      basin: 'Koshi',
      blink: false,
      status: 'BELOW WARNING LEVEL',
      history: [
        {
          max: 0,
          min: 0,
          value: 0,
          datetime: '2025-10-14T05:00:00.000Z',
        },
        {
          max: 0,
          min: 0,
          value: 0,
          datetime: '2025-10-14T06:00:00.000Z',
        },
        {
          max: 0,
          min: 0,
          value: 0,
          datetime: '2025-10-14T07:00:00.000Z',
        },
        {
          max: 0,
          min: 0,
          value: 0,
          datetime: '2025-10-14T08:00:00.000Z',
        },
        {
          max: 0,
          min: 0,
          value: 0,
          datetime: '2025-10-14T09:00:00.000Z',
        },
        {
          max: 0,
          min: 0,
          value: 0,
          datetime: '2025-10-14T10:00:00.000Z',
        },
      ],
      district: 'Sunsari',
      interval: null,
      latitude: 26.855192,
      longitude: 87.152283,
      series_id: 1505,
      description: 'Hydrological Station with RLS',
      stationIndex: '695',
      indicator: 'water_level_m',
      units: 'mm',
      value: 10.9,
    };

    await this.dhmService.saveDataInDhm(SourceType.RAINFALL, info.name, info);
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

  //run every 24 hours
  @Cron('0 0 * * *')
  async syncGfhData() {
    const gfhResult = await this.gfhMonitored.execute();

    if (isErr<Indicator[]>(gfhResult)) {
      this.logger.warn(gfhResult.details);
      if (gfhResult.details instanceof AxiosError) {
        const errorMessage = `HTTP Error: ${gfhResult.details.response?.status} ${gfhResult.details.response?.statusText} - Data: ${JSON.stringify(gfhResult.details.response?.data)} - Config: ${JSON.stringify(gfhResult.details.response?.config)}`;
        this.logger.warn(errorMessage);
      } else {
        this.logger.warn(gfhResult.details);
      }
      return;
    }

    gfhResult.data.forEach(async (indicator) => {
      await this.gfhService.saveDataInGfh(
        SourceType.WATER_LEVEL,
        (indicator.location as any).basinId,
        indicator,
      );
    });
  }
}
