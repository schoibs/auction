import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { CurrentUserPayload } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuctionDetailResponse, AuctionsPage } from './auctions.types';
import { AuctionsService } from './auctions.service';
import { AuctionIdParamDto } from './dto/auction-id-param.dto';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { ListAuctionsQueryDto } from './dto/list-auctions-query.dto';

@ApiTags('auctions')
@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() createAuctionDto: CreateAuctionDto,
  ): Promise<AuctionDetailResponse> {
    return this.auctionsService.create(user.id, createAuctionDto);
  }

  @Get()
  list(@Query() query: ListAuctionsQueryDto): Promise<AuctionsPage> {
    return this.auctionsService.list(query);
  }

  @Get(':auctionId')
  findById(
    @Param() params: AuctionIdParamDto,
  ): Promise<AuctionDetailResponse> {
    return this.auctionsService.findById(params.auctionId);
  }
}
