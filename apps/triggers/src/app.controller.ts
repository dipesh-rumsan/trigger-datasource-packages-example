import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { add } from "@lib/math";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): { message: string; result: number } {
    return {
      message: 'Hello from Rahat Triggers API!',
      result: add(1, 2)
    };
  }

  @Get('health')
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'OK',
      timestamp: new Date().toISOString()
    };
  }
}
