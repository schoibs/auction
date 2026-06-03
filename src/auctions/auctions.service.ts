import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuctionCloseQueueService } from '../auction-jobs/auction-close-queue.service';
import { CardTypesService } from '../card-types/card-types.service';
import { Card, CardStatus } from '../cards/card.entity';
import { CardResponse } from '../cards/cards.types';
import { UsersService } from '../users/users.service';
import { Auction, AuctionStatus } from './auction.entity';
import {
  AuctionDetailResponse,
  AuctionResponse,
  AuctionsPage,
} from './auctions.types';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { ListAuctionsQueryDto } from './dto/list-auctions-query.dto';
import { Bid } from '../bids/bid.entity';
import { BidResponse } from '../bids/bids.types';
  
@Injectable()
export class AuctionsService {
  constructor(
    @InjectRepository(Auction)
    private readonly auctionsRepository: Repository<Auction>,
    @InjectRepository(Bid)
    private readonly bidsRepository: Repository<Bid>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly auctionCloseQueueService: AuctionCloseQueueService,
    private readonly usersService: UsersService,
    private readonly cardTypesService: CardTypesService,
  ) {}

  async create(
    sellerUserId: string,
    input: CreateAuctionDto,
  ): Promise<AuctionDetailResponse> {
    this.validateDuration(input.durationSeconds);

    const startTime = new Date();
    const endTime = new Date(
      startTime.getTime() + input.durationSeconds * 1000,
    );

    const auction = await this.dataSource.transaction(async (manager) => {
      const card = await manager.findOne(Card, {
        where: { id: input.cardId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!card) {
        throw new NotFoundException('Card not found');
      }

      if (card.ownerUserId !== sellerUserId) {
        throw new ForbiddenException('Card does not belong to current user');
      }

      if (card.status !== CardStatus.OWNED) {
        throw new ConflictException('Card is already locked in an auction');
      }

      card.status = CardStatus.LOCKED_IN_AUCTION;
      await manager.save(Card, card);

      const auctionToSave = manager.create(Auction, {
        cardId: card.id,
        sellerUserId,
        status: AuctionStatus.ACTIVE,
        startPrice: input.startPrice,
        currentHighestBidId: null,
        startTime,
        endTime,
        closedAt: null,
        cancelledAt: null,
      });

      return manager.save(Auction, auctionToSave);
    });

    try {
      await this.auctionCloseQueueService.scheduleClose(auction);
    } catch (error) {
      console.error(`Failed to schedule close job for auction ${auction.id}`, error);
    }

    return this.findById(auction.id);
  }

  async list(query: ListAuctionsQueryDto): Promise<AuctionsPage> {
    const limit = query.limit ?? 25;
    const status = query.status ?? AuctionStatus.ACTIVE;
    const isActiveList = status === AuctionStatus.ACTIVE;
    const sortColumn = isActiveList ? 'auction.end_time' : 'auction.closed_at';
    const sortDirection: 'ASC' | 'DESC' = isActiveList ? 'ASC' : 'DESC';

    const queryBuilder = this.auctionsRepository
      .createQueryBuilder('auction')
      .leftJoinAndSelect('auction.card', 'card')
      .leftJoinAndSelect('card.cardType', 'cardType')
      .leftJoinAndSelect('card.owner', 'cardOwner')
      .leftJoinAndSelect('auction.seller', 'seller')
      .leftJoinAndSelect('auction.currentHighestBid', 'currentHighestBid')
      .where('auction.status = :status', { status });

    if (query.sellerUserId) {
      queryBuilder.andWhere('auction.seller_user_id = :sellerUserId', {
        sellerUserId: query.sellerUserId,
      });
    }

    if (query.cardTypeId) {
      queryBuilder.andWhere('card.card_type_id = :cardTypeId', {
        cardTypeId: query.cardTypeId,
      });
    }

    if (query.cursor) {
      queryBuilder.andWhere(
        `${sortColumn} ${isActiveList ? '>' : '<'} :cursor`,
        { cursor: new Date(query.cursor) },
      );
    }

    const auctions = await queryBuilder
      .orderBy(sortColumn, sortDirection)
      .take(limit + 1)
      .getMany();

    const hasNextPage = auctions.length > limit;
    const items = hasNextPage ? auctions.slice(0, limit) : auctions;
    const lastItem = items.at(-1);

    return {
      items: items.map((auction) => this.toDetailResponse(auction)),
      nextCursor:
        hasNextPage && lastItem
          ? (isActiveList ? lastItem.endTime : lastItem.closedAt)?.toISOString() ?? null
          : null,
    };
  }

  async findById(auctionId: string): Promise<AuctionDetailResponse> {
    const auction = await this.auctionsRepository.findOne({
      where: { id: auctionId },
      relations: {
        card: {
          cardType: true,
          owner: true,
        },
        seller: true,
        currentHighestBid: true,
      },
    });
  
    if (!auction) {
      throw new NotFoundException('Auction not found');
    }
  
    const recentBids = await this.bidsRepository.find({
      where: { auctionId: auction.id },
      order: { createdAt: 'DESC' },
      take: 10,
    });
  
    return this.toDetailResponse(auction, recentBids);
  }
    

  private validateDuration(durationSeconds: number): void {
    const minDuration = Number(
      this.configService.getOrThrow('AUCTION_MIN_DURATION_SECONDS'),
    );
    const maxDuration = Number(
      this.configService.getOrThrow('AUCTION_MAX_DURATION_SECONDS'),
    );

    if (durationSeconds < minDuration || durationSeconds > maxDuration) {
      throw new BadRequestException(
        `Auction duration must be between ${minDuration} and ${maxDuration} seconds`,
      );
    }
  }

  private toDetailResponse(
    auction: Auction,
    recentBids: Bid[] = [],
  ): AuctionDetailResponse {
    return {
      ...this.toResponse(auction),
      card: this.toCardResponse(auction.card),
      seller: this.usersService.toPublicUser(auction.seller),
      recentBids: recentBids.map((bid) => this.toBidResponse(bid)),
    };
  }

  private toBidResponse(bid: Bid): BidResponse {
    return {
      id: bid.id,
      auctionId: bid.auctionId,
      bidderUserId: bid.bidderUserId,
      amount: bid.amount,
      createdAt: bid.createdAt,
    };
  }

  private toResponse(auction: Auction): AuctionResponse {
    return {
      id: auction.id,
      cardId: auction.cardId,
      sellerUserId: auction.sellerUserId,
      status: auction.status,
      startPrice: auction.startPrice,
      currentHighestBid: null,
      startTime: auction.startTime,
      endTime: auction.endTime,
      closedAt: auction.closedAt,
      cancelledAt: auction.cancelledAt,
    };
  }

  private toCardResponse(card: Card): CardResponse {
    return {
      id: card.id,
      status: card.status,
      cardType: this.cardTypesService.toResponse(card.cardType),
      owner: this.usersService.toPublicUser(card.owner),
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
    };
  }
}
