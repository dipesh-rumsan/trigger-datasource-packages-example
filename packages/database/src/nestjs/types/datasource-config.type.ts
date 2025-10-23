import { DataSource, SourceType } from '../../../index';

type Config = {
  URL: string;
};

export type DataSourceDHMConfig = {
  [SourceType.RAINFALL]: Config;
  [SourceType.WATER_LEVEL]: Config;
};

export type DataSourceConfigValue = {
  [DataSource.DHM]: DataSourceDHMConfig;
  [DataSource.GLOFAS]: Config;
  [DataSource.GFH]?: Config;
};

export type DataSourceConfigType = {
  name: string;
  value: DataSourceConfigValue;
  isPrivate: boolean;
};
