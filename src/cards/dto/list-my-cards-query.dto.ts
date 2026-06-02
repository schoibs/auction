import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { CardStatus } from '../card.entity';

export class ListMyCardsQueryDto {
  @ApiPropertyOptional({ enum: CardStatus })
  @IsOptional()
  @IsEnum(CardStatus)
  status?: CardStatus;

  @ApiPropertyOptional({ example: '2026-06-02T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  cursor?: string;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
