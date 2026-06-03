import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { DataSource, EntityManager, Repository } from 'typeorm';
  import { Auction, AuctionStatus } from '../auctions/auction.entity';
  import { Bid } from './bid.entity';
  import { BidResponse, BidsPage } from './bids.types';
  import { CreateBidDto } from './dto/create-bid.dto';
  import { BidListSort, ListBidsQueryDto } from './dto/list-bids-query.dto';
  
  @Injectable()
  export class BidsService {
    constructor(
      @InjectRepository(Bid)
      private readonly bidsRepository: Repository<Bid>,
      @InjectRepository(Auction)
      private readonly auctionsRepository: Repository<Auction>,
      private readonly dataSource: DataSource,
    ) {}
  
    async placeBid(
      auctionId: string,
      bidderUserId: string,
      input: CreateBidDto,
    ): Promise<BidResponse> {
      const bid = await this.dataSource.transaction(async (manager) => {
        const auction = await manager.findOne(Auction, {
          where: { id: auctionId },
          lock: { mode: 'pessimistic_write' },
        });
  
        if (!auction) {
          throw new NotFoundException('Auction not found');
        }
  
        if (auction.status !== AuctionStatus.ACTIVE) {
          throw new ConflictException('Auction is not active');
        }
  
        const databaseNow = await this.getDatabaseNow(manager);
  
        if (databaseNow >= auction.endTime) {
          throw new ConflictException('Auction has ended');
        }
  
        if (auction.sellerUserId === bidderUserId) {
          throw new ForbiddenException('Seller cannot bid on own auction');
        }
  
        const currentHighestBid = auction.currentHighestBidId
          ? await manager.findOne(Bid, {
              where: { id: auction.currentHighestBidId },
            })
          : null;
  
        if (!currentHighestBid && input.amount < auction.startPrice) {
          throw new BadRequestException(
            `First bid must be at least ${auction.startPrice}`,
          );
        }
  
        if (currentHighestBid && input.amount <= currentHighestBid.amount) {
          throw new BadRequestException(
            `Bid must be greater than ${currentHighestBid.amount}`,
          );
        }
  
        const bidToSave = manager.create(Bid, {
          auctionId: auction.id,
          bidderUserId,
          amount: input.amount,
        });
  
        const savedBid = await manager.save(Bid, bidToSave);
  
        auction.currentHighestBidId = savedBid.id;
        await manager.save(Auction, auction);
  
        return savedBid;
      });
  
      return this.toResponse(bid);
    }
  
    async listForAuction(
      auctionId: string,
      query: ListBidsQueryDto,
    ): Promise<BidsPage> {
      const auctionExists = await this.auctionsRepository.exists({
        where: { id: auctionId },
      });
  
      if (!auctionExists) {
        throw new NotFoundException('Auction not found');
      }
  
      const limit = query.limit ?? 25;
      const sort = query.sort ?? BidListSort.CREATED_AT;
      const sortColumn =
        sort === BidListSort.AMOUNT ? 'bid.amount' : 'bid.created_at';
  
      if (query.cursor && sort !== BidListSort.CREATED_AT) {
        throw new BadRequestException(
          'Cursor pagination is only supported with createdAt sort',
        );
      }
  
      const queryBuilder = this.bidsRepository
        .createQueryBuilder('bid')
        .where('bid.auction_id = :auctionId', { auctionId });
  
      if (query.cursor) {
        queryBuilder.andWhere('bid.created_at < :cursor', {
          cursor: new Date(query.cursor),
        });
      }
  
      const bids = await queryBuilder
        .orderBy(sortColumn, 'DESC')
        .addOrderBy('bid.created_at', 'DESC')
        .take(limit + 1)
        .getMany();
  
      const hasNextPage = bids.length > limit;
      const items = hasNextPage ? bids.slice(0, limit) : bids;
      const lastItem = items.at(-1);
  
      return {
        items: items.map((bid) => this.toResponse(bid)),
        nextCursor:
          hasNextPage && lastItem ? lastItem.createdAt.toISOString() : null,
      };
    }
  
    toResponse(bid: Bid): BidResponse {
      return {
        id: bid.id,
        auctionId: bid.auctionId,
        bidderUserId: bid.bidderUserId,
        amount: bid.amount,
        createdAt: bid.createdAt,
      };
    }
  
    private async getDatabaseNow(manager: EntityManager): Promise<Date> {
      const result = await manager.query<{ now: Date | string }[]>('SELECT NOW() AS now');
      return new Date(result[0].now);
    }
  }
  