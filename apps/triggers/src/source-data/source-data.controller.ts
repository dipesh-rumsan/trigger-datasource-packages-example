import { Controller, Get, Post, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SourceDataService } from './source-data.service';

@ApiTags('source-data')
@Controller('source-data')
export class SourceDataController {
  constructor(private readonly sourceDataService: SourceDataService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new source data record' })
  @ApiResponse({ status: 201, description: 'Record created successfully' })
  create() {
    return this.sourceDataService.create();
  }

  @Get()
  @ApiOperation({ summary: 'Get all source data records' })
  @ApiResponse({ status: 200, description: 'Records retrieved successfully' })
  findAll() {
    return this.sourceDataService.findAll();
  }

  @Get('test-error')
  @ApiOperation({ summary: 'Test Prisma exception handling' })
  @ApiResponse({ status: 404, description: 'Demonstrates Prisma error handling' })
  testPrismaError() {
    return this.sourceDataService.testPrismaError();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a source data record by ID' })
  @ApiResponse({ status: 200, description: 'Record retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  findOne(@Param('id') id: string) {
    return this.sourceDataService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a source data record' })
  @ApiResponse({ status: 200, description: 'Record updated successfully' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  update(@Param('id') id: string) {
    return this.sourceDataService.update(+id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a source data record' })
  @ApiResponse({ status: 200, description: 'Record deleted successfully' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  remove(@Param('id') id: string) {
    return this.sourceDataService.remove(+id);
  }
}
