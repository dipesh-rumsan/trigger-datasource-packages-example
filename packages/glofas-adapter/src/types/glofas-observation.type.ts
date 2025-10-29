import axios from 'axios';

export interface GlofasObservation {
  data: any;
  location: string;
}

export interface GlofasFetchResponse extends Omit<GlofasObservation, 'data'> {
  data: axios.AxiosResponse<any, any, {}>;
}
