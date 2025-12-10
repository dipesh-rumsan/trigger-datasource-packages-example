import { Controller, Post, Body } from '@nestjs/common';
import { SourceService } from './source.service';
import { CreateSourceDto } from './dto';

@Controller('source')
export class SourceController {
  constructor(private readonly sourceService: SourceService) {}

  @Post()
  async create(@Body() dto: CreateSourceDto) {
    return this.sourceService.create(dto);
  }
}
