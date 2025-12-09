import { DataSource, PrismaService, SourceType } from "@lib/database";
import { Inject, Injectable, Logger } from "@nestjs/common";

@Injectable()
export class GfhService {
  private readonly logger = new Logger(GfhService.name);
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async saveDataInGfh(
    type: SourceType,
    riverBasin: string,
    payload: any
  ): Promise<any> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // have to check if old formatted date exit if exit update that.
        const existingRecord = await tx.sourcesData.findFirst({
          where: {
            dataSource: DataSource.GFH,
            source: {
              riverBasin,
            },
            AND: [
              {
                info: {
                  path: ["info", "stationName"],
                  equals: payload.info.stationName,
                },
              },
              {
                info: {
                  path: ["info", "forecastDate"],
                  equals: payload.info.forecastDate,
                },
              },
            ],
          },
        });

        if (existingRecord) {
          this.logger.log(
            `Updating existing record with new data for ${payload?.info?.stationName}`
          );
          return await tx.sourcesData.update({
            where: { id: existingRecord.id },
            data: {
              info: {
                ...JSON.parse(JSON.stringify(payload)),
              },
              updatedAt: new Date(),
            },
          });
        } else {
          this.logger.log(
            `Creating new record for ${payload?.info?.stationName}`
          );
          return await tx.sourcesData.create({
            data: {
              type,
              dataSource: DataSource.GFH,
              info: JSON.parse(JSON.stringify(payload)),
              source: {
                connectOrCreate: {
                  where: {
                    riverBasin,
                  },
                  create: {
                    source: [DataSource.GFH],
                    riverBasin,
                  },
                },
              },
            },
          });
        }
      });
    } catch (err) {
      this.logger.error(`Error saving data for ${riverBasin}:`, err);
      throw err;
    }
  }
  async getDataSource() {
    try {
      const sourceData = await this.prisma.setting.findFirst({
        where: {
          name: "DATASOURCE",
        },
        select: {
          value: true,
        },
      });
      const gfh = (sourceData?.value as Record<string, any>)["GFH"];
      return gfh;
    } catch (error: any) {
      this.logger.error("Error while fetching source data", error);
      throw error;
    }
  }
}
