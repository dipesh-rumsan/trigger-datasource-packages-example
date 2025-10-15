import { Controller, Get, Post, Patch, Param, Delete } from '@nestjs/common';
import { SourceDataService } from './source-data.service';

@Controller('source-data')
export class SourceDataController {
  constructor(private readonly sourceDataService: SourceDataService) {}

  @Post()
  create() {
    return this.sourceDataService.create();
  }

  @Get()
  findAll() {
    return this.sourceDataService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sourceDataService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string) {
    return this.sourceDataService.update(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sourceDataService.remove(+id);
  }
}
