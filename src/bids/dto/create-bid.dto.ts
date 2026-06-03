import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CreateBidDto {
  @ApiProperty({ example: 150, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount!: number;
}
