import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

export class CreateAuctionDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000000' })
  @IsUUID()
  cardId!: string;

  @ApiProperty({ example: 100, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  startPrice!: number;

  @ApiProperty({ example: 3600, minimum: 30 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationSeconds!: number;
}
