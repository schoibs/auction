import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CardTypesService } from './card-types.service';
import { CardTypeResponse } from './card-types.types';
import { CreateCardTypeDto } from './dto/create-card-type.dto';

@ApiTags('card-types')
@Controller('card-types')
export class CardTypesController {
  constructor(private readonly cardTypesService: CardTypesService) {}

  @Get()
  findAll(): Promise<CardTypeResponse[]> {
    return this.cardTypesService.findAll();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createCardTypeDto: CreateCardTypeDto,
  ): Promise<CardTypeResponse> {
    return this.cardTypesService.create(createCardTypeDto);
  }
}
