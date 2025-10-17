import { PrismaService } from '@lib/database';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GlofasService {
  private readonly logger = new Logger(GlofasService.name);

  constructor(private readonly httpService: HttpService) {}

  async getStationData(payload: any) {
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

    this.logger.log(`Fetching GLOFAS data from URL: ${glofasURL.href}`);

    return (await this.httpService.axiosRef.get(glofasURL.href)).data;
  }

  checkProbability(
    indexRange: number[],
    latestForecastData: any,
    probability: number,
  ) {
    for (const index of indexRange) {
      const forecastData = Number(latestForecastData[index]);

      if (forecastData && forecastData >= probability) {
        return true;
      }
    }
  }

  createRange(start: number, end: number) {
    const rangeArray = [];
    for (let i = start; i <= end; i++) {
      rangeArray.push(i);
    }
    return rangeArray;
  }
}
