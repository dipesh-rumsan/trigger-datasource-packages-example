import axios from "axios";

export interface DhmObservation {
  data: DhmNormalizedItem[];
  seriesId: string;
}

export interface DhmFetchResponse extends Omit<DhmObservation, "data"> {
  data: axios.AxiosResponse<any, any, {}>;
}

export interface DhmFetchParams {
  seriesIds: string[];
  startDate?: string;
  endDate?: string;
  location: string;
}

export interface DhmNormalizedItem {
  datetime: string;
  value: number;
  max?: number;
  min?: number;
}

export type DhmInputItem =
  | {
      Date: string;
      Point: number;
    }
  | {
      Date: string;
      Max: number;
      Min: number;
      Average: number;
    }
  | {
      Date: string;
      Hourly: number;
      Total: number;
    }
  | {
      Date: string;
      Daily: number;
      Total: number;
    };

export enum DhmSourceDataTypeEnum {
  POINT = 1,
  HOURLY = 2,
  DAILY = 3,
}
