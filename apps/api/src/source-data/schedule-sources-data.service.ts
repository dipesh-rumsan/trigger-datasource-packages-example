import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  buildQueryParams,
  getFormattedDate,
  parseGlofasData,
} from 'src/common';
import { HttpService } from '@nestjs/axios';
import {
  rainfallStationUrl,
  riverStationUrl,
} from 'src/constants/datasourceUrls';
import * as https from 'https';
import {
  RiverStationItem,
  RiverStationData,
  RainfallStationItem,
  RainfallStationData,
  SourceDataTypeEnum,
  InputItem,
} from 'src/types/data-source';
import { DhmService } from './dhm.service';
import { GfhService } from './gfh.service';
import { GlofasService } from './glofas.service';
import { DhmAdapter, DhmFetchParams } from '@lib/dhm-adapter';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });
@Injectable()
export class ScheduleSourcesDataService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ScheduleSourcesDataService.name);

  constructor(
    private readonly dhmService: DhmService,
    private readonly httpService: HttpService,
    private readonly gfhService: GfhService,
    private readonly glofasService: GlofasService,
    private readonly dhmAdapter: DhmAdapter,
  ) {}
  onApplicationBootstrap() {
    // this.syncRiverWaterData();
    // this.syncRainfallData();
    // this.synchronizeGlofas();
    // this.syncGlobalFloodHub();
    this.fetchDhmData();
  }

  async fetchDhmData() {
    const params: DhmFetchParams = {
      seriesIds: ['29089'],
      location: 'Doda river at East-West Highway',
      startDate: new Date('2025-01-01').toISOString().split('T')[0],
      endDate: new Date('2025-12-31').toISOString().split('T')[0],
    };

    const result = await this.dhmAdapter.execute(params);
    console.log('result', result);
  }

  // run every 15 minutes
  @Cron('*/15 * * * *')
  async syncRiverWaterData() {
    this.logger.log('Syncing river water data');
    try {
      const dhmSettings = [
        {
          RAINFALL: {
            LOCATION: 'Doda river at East-West Highway',
            SERIESID: [29785, 29608, 5726, 29689],
          },
          WATER_LEVEL: {
            LOCATION: 'Doda river at East-West Highway',
            SERIESID: [29089],
          },
        },
      ];

      for (const {
        WATER_LEVEL: { LOCATION, SERIESID },
      } of dhmSettings) {
        for (const seriesId of SERIESID) {
          const riverWatchQueryParam = buildQueryParams(seriesId);
          const stationData = await this.fetchRiverStation(seriesId);

          if (!stationData || !riverWatchQueryParam) {
            this.logger.warn(
              `Missing station data or query params for ${LOCATION}`,
            );
          }

          try {
            const data = await this.dhmService.getDhmRiverWatchData({
              date: riverWatchQueryParam.date_from,
              period: SourceDataTypeEnum.POINT.toString(),
              seriesid: seriesId.toString(),
              location: LOCATION,
            });

            const normalizedData =
              await this.dhmService.normalizeDhmRiverAndRainfallWatchData(
                data as InputItem[],
              );

            const waterLevelData: RiverStationData = {
              ...stationData,
              history: normalizedData,
            };

            this.logger.warn(
              `Fetched river watch history data for ${LOCATION}`,
            );

            console.log('Save data in dB', waterLevelData);

            if (true) {
              this.logger.log(
                `Water level data saved successfully for ${LOCATION}`,
              );
            } else {
              this.logger.warn(
                `Failed to save water level data for ${LOCATION}`,
              );
            }
          } catch (dbError: any) {
            this.logger.error(
              `Error while fetching river watch history data ${LOCATION}: '${dbError?.response?.data?.message || dbError.message}'`,
            );
          }
        }
      }
    } catch (error: any) {
      console.log('error', error);
      this.logger.error(
        'Error in syncRiverWaterData:',
        error?.response?.data?.message || error.message,
      );
    }
  }

  // run every 15 minutes
  @Cron('*/15 * * * *')
  async syncRainfallData() {
    this.logger.log('Syncing rainfall data');
    try {
      const dhmSettings = [
        {
          RAINFALL: {
            LOCATION: 'Doda river at East-West Highway',
            SERIESID: [29785, 29608, 5726, 29689],
          },
          WATER_LEVEL: {
            LOCATION: 'Doda river at East-West Highway',
            SERIESID: [29089],
          },
        },
      ];

      for (const {
        RAINFALL: { LOCATION, SERIESID },
      } of dhmSettings) {
        for (const seriesId of SERIESID) {
          try {
            const rainfallQueryParams = buildQueryParams(seriesId);
            const stationData = await this.fetchRainfallStation(seriesId);

            if (!stationData || !rainfallQueryParams) {
              this.logger.warn(
                `Missing station data or query params for ${LOCATION}`,
              );
              continue;
            }

            const data = await this.dhmService.getDhmRainfallWatchData({
              date: rainfallQueryParams.date_from,
              period: SourceDataTypeEnum.HOURLY.toString(),
              seriesid: seriesId.toString(),
              location: LOCATION,
            });

            const normalizedData =
              await this.dhmService.normalizeDhmRiverAndRainfallWatchData(
                data as InputItem[],
              );

            const rainfallData: RainfallStationData = {
              ...stationData,
              history: normalizedData,
            };

            this.logger.warn(`Fetched rainfall history data for ${LOCATION}`);

            console.log('Save data in dB', rainfallData);

            if (true) {
              this.logger.log(
                `Rainfall data saved successfully for ${LOCATION}`,
              );
            } else {
              this.logger.warn(`Failed to save rainfall data for ${LOCATION}`);
            }
          } catch (dbError: any) {
            this.logger.error(
              `Error while fetching rainfall history data for ${LOCATION}: '${dbError?.response?.data?.message || dbError.message}'`,
            );
          }
        }
      }
    } catch (error: any) {
      this.logger.error(
        'Error fetching rainfall data:',
        error?.response?.data?.message || error.message,
      );
    }
  }

  //run every 24 hours
  @Cron('0 0 * * *')
  async syncGlobalFloodHub() {
    this.logger.log('Starting flood data fetching process...');
    try {
      const gfhSettings = [
        {
          RIVER_BASIN: 'Doda river at East-West Highway',
          STATION_LOCATIONS_DETAILS: [
            {
              LATITUDE: 28.84375,
              POINT_ID: 'SI002576',
              LONGITUDE: 80.422917,
              RIVER_NAME: 'doda',
              STATION_ID: 'G10165',
              STATION_NAME: 'Doda River Basin',
              RIVER_GAUGE_ID: 'hybas_4120803470',
              'LISFLOOD_X_(DEG)': 80.422917,
              'LISFLOOD_Y_[DEG]': 28.84375,
              LISFLOOD_DRAINAGE_AREA: 432,
            },
            {
              LATITUDE: 28.84375,
              POINT_ID: 'SI002576',
              LONGITUDE: 80.422917,
              RIVER_NAME: 'doda',
              STATION_ID: 'G10165',
              STATION_NAME: 'Sarda River Basin',
              'LISFLOOD_X_(DEG)': 80.422917,
              'LISFLOOD_Y_[DEG]': 28.84375,
              LISFLOOD_DRAINAGE_AREA: 432,
            },
          ],
        },
      ];

      // Step 1 : Check if GFH settings are available
      if (!gfhSettings || gfhSettings.length === 0) {
        this.logger.warn('GFH settings not found or empty');
        return;
      }

      // Step 2: Fetch all gauges
      const gauges = await this.gfhService.fetchAllGauges();
      if (gauges.length === 0) {
        throw new Error('No gauges found');
      }

      gfhSettings.forEach((gfhStationDetails) => {
        const { dateString } = getFormattedDate();

        // get one station location details
        gfhStationDetails.STATION_LOCATIONS_DETAILS.forEach(
          async (stationDetails) => {
            const riverBasin = gfhStationDetails.RIVER_BASIN;
            const stationName = stationDetails.STATION_NAME;
            // Step 3: Check data are already fetched
            const hasExistingRecord = [];
            if (hasExistingRecord?.length) {
              this.logger.log(
                `Global flood data for ${stationName} on ${dateString} already exists.`,
              );
              return;
            }

            // Step 4: Match stations to gauges
            const [stationGaugeMapping, uniqueGaugeIds] =
              this.gfhService.matchStationToGauge(gauges, stationDetails);

            // Step 5: Process gauge data
            const gaugeDataCache =
              await this.gfhService.processGaugeData(uniqueGaugeIds);

            // Step 6: Build final output
            const output = this.gfhService.buildFinalOutput(
              stationGaugeMapping,
              gaugeDataCache,
            );

            // Step 7: Filter and process the output
            const [stationKey, stationData] = Object.entries(output)[0] || [];
            if (!stationKey || !stationData) {
              this.logger.warn(`No data found for station ${stationName}`);
              return;
            }

            // Step 8: Format the data
            const gfhData = this.gfhService.formateGfhStationData(
              dateString,
              stationData,
              stationName,
              riverBasin,
            );

            // Step 9: Save the data in Global Flood Hub
            this.logger.warn(`Fetched global flood data for ${stationName}`);
            console.log('Save data in dB', gfhData);
            if (true) {
              this.logger.log(
                `Global flood data saved successfully for ${stationName}`,
              );
            } else {
              this.logger.warn(
                `Failed to Global flood data for ${stationName}`,
              );
            }
          },
        );
      });
    } catch (error) {
      Logger.error(`Error in main execution: ${error}`);
      throw error;
    }
  }

  async fetchRainfallStation(
    seriesId: number,
  ): Promise<RainfallStationItem | null> {
    try {
      const {
        data: { data },
      } = (await this.httpService.axiosRef.get(rainfallStationUrl, {
        httpsAgent: httpsAgent,
      })) as { data: { data: RainfallStationItem[][] } };

      const targettedData = data[0].find((item) => item.series_id == seriesId);

      if (!targettedData) {
        this.logger.warn(`No rainfall station found for series ID ${seriesId}`);
        return null;
      }

      return targettedData;
    } catch (error) {
      this.logger.warn('Error fetching rainfall station:', error);
      throw error;
    }
  }

  async fetchRiverStation(seriesId: number): Promise<RiverStationItem | null> {
    try {
      const {
        data: { data: riverStation },
      } = (await this.httpService.axiosRef.get(riverStationUrl, {
        httpsAgent: httpsAgent,
      })) as { data: { data: RiverStationItem[] } };

      const targettedData = riverStation.find(
        (item) => item.series_id === seriesId,
      );

      if (!targettedData) {
        this.logger.warn(`No river station found for series ID ${seriesId}`);
        return null;
      }

      return targettedData;
    } catch (error) {
      console.log('error', error);
      this.logger.warn('Error fetching river station:', error);
      return null;
    }
  }

  // run every hour
  @Cron('0 * * * *')
  async synchronizeGlofas() {
    try {
      this.logger.log('GLOFAS: syncing Glofas data');
      const glofasSettings = [
        {
          I: '227',
          J: '67',
          URL: 'https://ows.globalfloods.eu/glofas-ows/ows.py',
          BBOX: '8918060.964088082,3282511.7426786087,9006116.420672605,3370567.1992631317',
          LOCATION: 'Doda river at East-West Highway',
          TIMESTRING: '2023-10-01T00:00:00Z',
        },
      ];

      if (!glofasSettings) {
        this.logger.warn('GLOFAS settings not found');
        return;
      }
      glofasSettings.forEach(async (glofasStation: any) => {
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const { dateString, dateTimeString } = getFormattedDate(yesterdayDate);

        const riverBasin = glofasStation['LOCATION'];

        const hasExistingRecord = false;
        if (hasExistingRecord) {
          this.logger.log(
            `GLOFAS: Data for ${riverBasin} on ${dateString} already exists.`,
          );
          return;
        }

        this.logger.log(
          `GLOFAS: Fetching data for ${riverBasin} on ${dateString}`,
        );
        const stationData = await this.glofasService.getStationData({
          ...glofasStation,
          TIMESTRING: dateTimeString,
        });

        const reportingPoints = stationData?.content['Reporting Points'].point;

        const glofasData = parseGlofasData(reportingPoints);
        this.logger.log(
          `GLOFAS: Parsed data for ${riverBasin} on ${dateString}`,
        );

        console.log('Save data in dB', {
          ...glofasData,
          forecastDate: dateString,
        });
        if (true) {
          this.logger.log(
            `GLOFAS: Data saved successfully for ${riverBasin} on ${dateString}`,
          );
        } else {
          this.logger.warn(
            `GLOFAS: Failed to save data for ${riverBasin} on ${dateString}`,
          );
        }
      });
    } catch (err: any) {
      this.logger.error('GLOFAS Err:', err.message);
    }
  }
}
