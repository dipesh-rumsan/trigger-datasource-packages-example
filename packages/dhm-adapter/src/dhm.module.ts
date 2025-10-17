import { Module, DynamicModule } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { DhmAdapter } from "./dhm.adapter";

@Module({})
export class DhmModule {
  static forRoot(): DynamicModule {
    return {
      global: true,
      module: DhmModule,
      imports: [HttpModule],
      providers: [DhmAdapter],
      exports: [DhmAdapter],
    };
  }

  static forFeature(): DynamicModule {
    return {
      module: DhmModule,
      imports: [],
      providers: [DhmAdapter],
      exports: [DhmAdapter],
    };
  }
}
