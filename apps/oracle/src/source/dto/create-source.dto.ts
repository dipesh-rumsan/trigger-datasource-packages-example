import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsArray, IsEnum } from 'class-validator';
import { DataSource } from '@lib/database';

export class CreateSourceDto {
  @ApiProperty({
    example: 'Karnali',
    description: 'The river basin name',
  })
  @IsString()
  @IsNotEmpty()
  riverBasin: string;

  @ApiProperty({
    example: ['DHM', 'GLOFAS'],
    description: 'Array of data sources',
    enum: DataSource,
    isArray: true,
  })
  @IsArray()
  @IsEnum(DataSource, { each: true })
  @IsNotEmpty()
  source: DataSource[];

  @ApiProperty({
    example: 'Rainfall Data Source',
    description: 'The title of the source for blockchain',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'rainfall',
    description: 'The subtype of the source for blockchain',
  })
  @IsString()
  @IsNotEmpty()
  sourceSubType: string;

  @ApiProperty({
    example: 100,
    description:
      'The value of the source for blockchain (can be a number or string)',
  })
  @IsNotEmpty()
  value: number | string;
}
