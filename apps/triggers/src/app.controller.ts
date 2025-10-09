import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { add } from "@lib/math/src"

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): number {
    return add(1, 2);
  }
}
