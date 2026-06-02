import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { CurrentUserPayload } from '../auth/auth.types';
import { CardsService } from './cards.service';
import { CardsPage, CardResponse } from './cards.types';
import { ListMyCardsQueryDto } from './dto/list-my-cards-query.dto';
import { MintCardDto } from './dto/mint-card.dto';

@ApiTags('cards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get('mine')
  mine(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: ListMyCardsQueryDto,
  ): Promise<CardsPage> {
    return this.cardsService.listMine(user.id, query);
  }

  @Post('mint')
  mint(@Body() mintCardDto: MintCardDto): Promise<CardResponse> {
    return this.cardsService.mint(mintCardDto);
  }
}
