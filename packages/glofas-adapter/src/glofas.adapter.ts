import { Inject, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  Indicator,
  Result,
  Ok,
  ObservationAdapter,
  Err,
  chainAsync,
} from '@lib/core';
import { DataSource, PrismaService, GlofasStationInfo } from '@lib/database';
import { SettingsService } from '@lib/core';
import { getFormattedDate, parseGlofasData } from './utils';
import { GlofasFetchResponse, GlofasObservation } from './types';

@Injectable()
export class GlofasAdapter extends ObservationAdapter {
  private readonly logger = new Logger(GlofasAdapter.name);

  constructor(
    @Inject(HttpService) httpService: HttpService,
    @Inject(PrismaService) private readonly db: PrismaService,
    @Inject(SettingsService) settingsService: SettingsService,
  ) {
    super(httpService, settingsService, {
      dataSource: DataSource.GLOFAS,
    });
  }

  async init() {
    this.logger.log('Glofas Adapter initialization');
  }

  /**
   * Fetch raw HTML/data from Glofas website
   */
  async fetch(): Promise<Result<GlofasFetchResponse[]>> {
    try {
      const baseUrl = this.getUrl();

      const config: GlofasStationInfo[] = this.getConfig();

      if (!baseUrl) {
        this.logger.error('Glofas Water Level URL is not configured');
        return Err('Glofas Water Level URL is not configured');
      }

      const htmlPages: GlofasFetchResponse[] = await Promise.all(
        config.map(async (cfg) => {
          const yesterdayDate = new Date();
          yesterdayDate.setDate(yesterdayDate.getDate() - 1);
          const { dateString, dateTimeString } =
            getFormattedDate(yesterdayDate);

          const glofasURL = new URL(baseUrl);

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
            BBOX: cfg.BBOX,
            I: cfg.I,
            J: cfg.J,
            TIME: dateTimeString,
          };

          for (const [key, value] of Object.entries(queryParams)) {
            glofasURL.searchParams.append(key, value);
          }

          return {
            data: await this.httpService.axiosRef.get(glofasURL.toString()),
            location: cfg.LOCATION,
          };
        }),
      );

      return Ok(htmlPages);
    } catch (error) {
      console.log(error);
      this.logger.error('Failed to fetch DHM data', error);
      return Err('Failed to fetch DHM observations', error);
    }
  }

  /**
   * Parse HTML and extract meaningful observation data
   */
  aggregate(rawDatas: GlofasFetchResponse[]): Result<GlofasObservation[]> {
    try {
      const observations: GlofasObservation[] = [];

      for (const {
        data: { data: rawData },
        location,
      } of rawDatas) {
        const reportingPoints = rawData?.content['Reporting Points'].point;
        const glofasData = parseGlofasData(reportingPoints);

        observations.push({
          data: glofasData,
          location,
        });
      }

      this.logger.log(`Aggregated ${observations.length} DHM observations`);
      return Ok(observations);
    } catch (error) {
      this.logger.error('Failed to aggregate DHM data', error);
      return Err('Failed to parse DHM HTML data', error);
    }
  }

  /**
   * Transform DHM observations to standard Indicators using ACL
   */
  transform(aggregatedData: GlofasObservation[]): Result<Indicator[]> {
    try {
      const observations = aggregatedData as GlofasObservation[];

      const indicators: Indicator[] = observations.flatMap((obs) => {
        const baseIndicator = {
          kind: 'OBSERVATION' as const,
          issuedAt: new Date().toISOString(),
          location: {
            type: 'BASIN' as const,
            basinId: obs.location,
          },
          source: {
            key: 'Glofas',
            metadata: { originalUnit: 'mm' },
          },
          info: obs.data,
        };

        const results: Indicator[] = [];

        results.push({
          ...baseIndicator,
          indicator: 'prob_flood',
          units: 'mm',
          value: obs.data[0]?.value || 0,
        });

        return results;
      });

      this.logger.log(`Transformed to ${indicators.length} indicators`);
      return Ok(indicators);
    } catch (error) {
      this.logger.error('Failed to transform DHM data', error);
      return Err('Failed to transform to indicators', error);
    }
  }

  /**
   * Main pipeline execution - chains fetch → aggregate → transform
   * Using functional composition - no if-else needed!
   */
  async execute(): Promise<Result<Indicator[]>> {
    return chainAsync(this.fetch(), (rawData: GlofasFetchResponse[]) =>
      chainAsync(this.aggregate(rawData), (observations: GlofasObservation[]) =>
        this.transform(observations),
      ),
    );
  }
}
