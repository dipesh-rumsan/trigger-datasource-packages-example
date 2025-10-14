import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SourceDataService } from './source-data.service';
import { CreateSourceDatumDto } from './dto/create-source-datum.dto';
import { UpdateSourceDatumDto } from './dto/update-source-datum.dto';

@Controller('source-data')
export class SourceDataController {
  constructor(private readonly sourceDataService: SourceDataService) {}

  @Post()
  create(@Body() createSourceDatumDto: CreateSourceDatumDto) {
    return this.sourceDataService.create(createSourceDatumDto);
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
  update(@Param('id') id: string, @Body() updateSourceDatumDto: UpdateSourceDatumDto) {
    return this.sourceDataService.update(+id, updateSourceDatumDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sourceDataService.remove(+id);
  }
}
