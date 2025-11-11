import { DataSource, PrismaService, SourceType } from "@lib/database";
import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  RainfallStationData,
  RiverStationData,
} from "types/dhm-observation.type";

@Injectable()
export class DhmService {
  private readonly logger = new Logger(DhmService.name);
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  async saveDataInDhm(
    type: SourceType,
    riverBasin: string,
    payload: RiverStationData | RainfallStationData
  ): Promise<any> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existingRecord = await tx.sourcesData.findFirst({
          where: {
            type,
            dataSource: DataSource.DHM,
            source: {
              riverBasin,
            },
            info: {
              path: ["series_id"],
              equals: payload.series_id,
            },
          },
        });

        const payloadData = JSON.parse(JSON.stringify(payload));

        if (existingRecord) {
          const existingInfo = JSON.parse(JSON.stringify(existingRecord.info));

          if (existingInfo.series_id === payloadData.series_id) {
            this.logger.log(`Found existing series: ${payloadData.name}`);

            return tx.sourcesData.update({
              where: { id: existingRecord.id },
              data: {
                info: {
                  ...existingInfo,
                  ...payloadData,
                },
                updatedAt: new Date(),
              },
            });
          }

          this.logger.log(
            `Series mismatch. Creating new for: ${payloadData.name}`
          );
        } else {
          this.logger.log(
            `No record found. Creating new for: ${payloadData.name}`
          );
        }

        return tx.sourcesData.create({
          data: {
            type,
            dataSource: DataSource.DHM,
            info: payloadData,
            source: {
              connectOrCreate: {
                where: { riverBasin },
                create: {
                  riverBasin,
                  source: [DataSource.DHM],
                },
              },
            },
          },
        });
      });
    } catch (error: any) {
      this.logger.error(`Error saving data for ${riverBasin}:`, error);
      throw error;
    }
  }
}
