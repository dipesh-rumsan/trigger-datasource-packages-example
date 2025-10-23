import { Inject, Injectable } from '@nestjs/common';
import { PrismaService, Setting, SettingDataType } from '@lib/database';

@Injectable()
export class SettingsService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async get<T>(name: string): Promise<T> {
    const setting = await this.findOne(name);
    return setting?.value as T;
  }

  async findAll(): Promise<Setting[]> {
    return this.prisma.setting.findMany();
  }

  async findOne(name: string): Promise<Setting | null> {
    return this.prisma.setting.findUnique({
      where: { name },
    });
  }

  async create(data: {
    name: string;
    value: any;
    dataType: SettingDataType;
    requiredFields?: string[];
    isReadOnly?: boolean;
    isPrivate?: boolean;
  }): Promise<Setting> {
    return this.prisma.setting.create({
      data: {
        name: data.name,
        value: data.value,
        dataType: data.dataType,
        requiredFields: data.requiredFields || [],
        isReadOnly: data.isReadOnly || false,
        isPrivate: data.isPrivate || true,
      },
    });
  }

  async update(
    name: string,
    data: {
      value?: any;
      dataType?: SettingDataType;
      requiredFields?: string[];
      isReadOnly?: boolean;
      isPrivate?: boolean;
    },
  ): Promise<Setting> {
    return this.prisma.setting.update({
      where: { name },
      data,
    });
  }

  async delete(name: string): Promise<Setting> {
    return this.prisma.setting.delete({
      where: { name },
    });
  }
}
