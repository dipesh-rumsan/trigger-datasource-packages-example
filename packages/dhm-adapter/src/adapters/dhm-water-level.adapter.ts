import { Inject, Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import {
  DhmObservation,
  DhmFetchParams,
  DhmInputItem,
  DhmNormalizedItem,
  DhmSourceDataTypeEnum,
  DhmFetchResponse,
} from "../types/dhm-observation.type";
import {
  Indicator,
  Result,
  Ok,
  ObservationAdapter,
  Err,
  chainAsync,
  tryCatchAsync,
  isOk,
} from "@lib/core";
import { buildQueryParams, scrapeDataFromHtml } from "../../utils";
import { PrismaService } from "@lib/database";

@Injectable()
export class DhmWaterLevelAdapter extends ObservationAdapter<DhmFetchParams> {
  private readonly dhmUrl =
    "https://dhm.gov.np/site/getRiverWatchBySeriesId_Single";

  private readonly logger = new Logger(DhmWaterLevelAdapter.name);

  private sourceUrls = {};

  constructor(
    @Inject(HttpService) httpService: HttpService,
    private readonly db: PrismaService
  ) {
    super(httpService);
    this.logger.log(
      `Constructor called - PrismaService is ${this.db ? "injected ✓" : "NOT injected ✗"}`
    );
  }

  async init() {
    this.logger.log(
      `init() called via OnModuleInit - PrismaService is ${this.db ? "available ✓" : "NOT available ✗"}`
    );

    const result = await tryCatchAsync(async () => {
      const settings = await this.db.setting.findFirst({
        where: {
          name: "DATASOURCE",
        },
      });

      if (!settings) {
        this.logger.warn("DATASOURCE setting not found");
        return Ok(null);
      }

      this.logger.log(`Successfully loaded DATASOURCE settings from database`);
      return Ok(settings);
    });

    if (isOk(result)) {
      this.logger.log("Initialization completed successfully");
    } else {
      this.logger.error("Initialization failed", result.error);
    }
  }

  /**
   * Fetch raw HTML/data from DHM website
   */
  async fetch(params: DhmFetchParams): Promise<Result<DhmFetchResponse[]>> {
    try {
      this.logger.log(
        `Fetching DHM data for stations: ${params.seriesIds.join(", ")}`
      );

      const htmlPages: DhmFetchResponse[] = await Promise.all(
        params.seriesIds.map(async (seriesId) => {
          const queryParams = buildQueryParams(+seriesId);

          const form = new FormData();

          form.append("date", queryParams.date_from || "");
          form.append("period", DhmSourceDataTypeEnum.POINT.toString());
          form.append("seriesid", seriesId);

          return {
            data: await this.httpService.axiosRef.post(this.dhmUrl, form),
            seriesId,
          };
        })
      );

      return Ok(htmlPages);
    } catch (error) {
      this.logger.error("Failed to fetch DHM data", error);
      return Err("Failed to fetch DHM observations", error);
    }
  }

  /**
   * Parse HTML and extract meaningful observation data
   */
  aggregate(rawDatas: DhmFetchResponse[]): Result<DhmObservation[]> {
    try {
      const observations: DhmObservation[] = [];

      for (const {
        data: { data: rawData },
        seriesId,
      } of rawDatas) {
        const data = scrapeDataFromHtml(rawData.data.table);

        if (!data || data.length === 0) {
          this.logger.warn(`No data found`);
          continue;
        }

        const normalizedData = this.normalizeDhmRiverAndRainfallWatchData(
          data as DhmInputItem[]
        );

        observations.push({
          data: normalizedData,
          seriesId,
        });
      }

      this.logger.log(`Aggregated ${observations.length} DHM observations`);
      return Ok(observations);
    } catch (error) {
      this.logger.error("Failed to aggregate DHM data", error);
      return Err("Failed to parse DHM HTML data", error);
    }
  }

  /**
   * Transform DHM observations to standard Indicators using ACL
   */
  transform(aggregatedData: DhmObservation[]): Result<Indicator[]> {
    try {
      const observations = aggregatedData as DhmObservation[];

      const indicators: Indicator[] = observations.flatMap((obs) => {
        const baseIndicator = {
          kind: "OBSERVATION" as const,
          issuedAt: new Date().toISOString(),
          location: {
            type: "STATION" as const,
            seriesId: obs.seriesId,
          },
          source: {
            key: "DHM",
            metadata: { originalUnit: "m" },
          },
          history: obs.data,
        };

        const results: Indicator[] = [];

        // Water level indicator
        results.push({
          ...baseIndicator,
          indicator: "water_level_m",
          units: "m",
          value: obs.data[0]?.value || 0,
        });

        return results;
      });

      this.logger.log(`Transformed to ${indicators.length} indicators`);
      return Ok(indicators);
    } catch (error) {
      this.logger.error("Failed to transform DHM data", error);
      return Err("Failed to transform to indicators", error);
    }
  }

  /**
   * Main pipeline execution - chains fetch → aggregate → transform
   * Using functional composition - no if-else needed!
   */
  async execute(params: DhmFetchParams): Promise<Result<Indicator[]>> {
    return chainAsync(this.fetch(params), (rawData: DhmFetchResponse[]) =>
      chainAsync(this.aggregate(rawData), (observations: DhmObservation[]) =>
        this.transform(observations)
      )
    );
  }

  private normalizeDhmRiverAndRainfallWatchData(
    dataArray: DhmInputItem[]
  ): DhmNormalizedItem[] {
    return dataArray.map((item) => {
      const base = {
        datetime: item.Date,
      };

      if ("Point" in item) {
        return {
          ...base,
          value: item.Point,
        };
      }

      if ("Average" in item && "Max" in item && "Min" in item) {
        return {
          ...base,
          value: item.Average,
          max: item.Max,
          min: item.Min,
        };
      }

      if ("Total" in item && "Hourly" in item) {
        return {
          ...base,
          value: item.Total,
          min: Math.min(item.Hourly, item.Total),
          max: Math.max(item.Hourly, item.Total),
        };
      }

      if ("Total" in item && "Daily" in item) {
        return {
          ...base,
          value: item.Total,
          min: Math.min(item.Daily, item.Total),
          max: Math.max(item.Daily, item.Total),
        };
      }

      throw new Error("Invalid data format");
    });
  }
}
