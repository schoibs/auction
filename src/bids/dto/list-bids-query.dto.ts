import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum BidListSort {
  CREATED_AT = 'createdAt',
  AMOUNT = 'amount',
}

export class ListBidsQueryDto {
  @ApiPropertyOptional({ enum: BidListSort, default: BidListSort.CREATED_AT })
  @IsOptional()
  @IsEnum(BidListSort)
  sort?: BidListSort;

  @ApiPropertyOptional({ example: '2026-06-02T10:15:00.000Z' })
  @IsOptional()
  @IsDateString()
  cursor?: string;

  @ApiPropertyOptional({ example: 25, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
