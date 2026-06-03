import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { CurrentUserPayload } from '../auth/auth.types';
import { AuctionIdParamDto } from '../auctions/dto/auction-id-param.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BidResponse, BidsPage } from './bids.types';
import { BidsService } from './bids.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { ListBidsQueryDto } from './dto/list-bids-query.dto';

@ApiTags('bids')
@Controller('auctions/:auctionId/bids')
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  placeBid(
    @Param() params: AuctionIdParamDto,
    @CurrentUser() user: CurrentUserPayload,
    @Body() createBidDto: CreateBidDto,
  ): Promise<BidResponse> {
    return this.bidsService.placeBid(
      params.auctionId,
      user.id,
      createBidDto,
    );
  }

  @Get()
  listForAuction(
    @Param() params: AuctionIdParamDto,
    @Query() query: ListBidsQueryDto,
  ): Promise<BidsPage> {
    return this.bidsService.listForAuction(params.auctionId, query);
  }
}
