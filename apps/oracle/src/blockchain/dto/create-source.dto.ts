import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSourceDto {
  @ApiProperty({
    example: 'Rainfall Data Source',
    description: 'The title of the source',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'rainfall',
    description: 'The subtype of the source',
  })
  @IsString()
  @IsNotEmpty()
  sourceSubType: string;

  @ApiProperty({
    example: 100,
    description: 'The value of the source (can be a number or string)',
  })
  @IsNotEmpty()
  value: number | string;
}
