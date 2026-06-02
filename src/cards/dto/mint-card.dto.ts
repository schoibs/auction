import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class MintCardDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000000' })
  @IsUUID()
  ownerUserId!: string;

  @ApiProperty({ example: '00000000-0000-0000-0000-000000000000' })
  @IsUUID()
  cardTypeId!: string;
}
