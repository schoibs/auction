import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateCardTypeDto {
  @ApiProperty({ example: 'Solar Knight' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 82, minimum: 1, maximum: 99 })
  @IsInt()
  @Min(1)
  @Max(99)
  attack!: number;

  @ApiProperty({ example: 64, minimum: 1, maximum: 99 })
  @IsInt()
  @Min(1)
  @Max(99)
  midfield!: number;

  @ApiProperty({ example: 71, minimum: 1, maximum: 99 })
  @IsInt()
  @Min(1)
  @Max(99)
  defense!: number;
}
