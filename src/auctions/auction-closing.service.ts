import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Bid } from '../bids/bid.entity';
import { CardTransfer } from '../cards/card-transfer.entity';
import { Card, CardStatus } from '../cards/card.entity';
import { Auction, AuctionStatus } from './auction.entity';
import { RealtimeEventsPublisher } from '../realtime/realtime-events.publisher';

export type AuctionCloseOutcome =
  | 'not-found'
  | 'already-final'
  | 'not-expired'
  | 'closed-without-bids'
  | 'closed-with-winner';

export interface AuctionCloseResult {
  auctionId: string;
  outcome: AuctionCloseOutcome;
  rescheduleAt?: Date;
  winnerUserId?: string;
  winningBidAmount?: number | null;
  closedAt?: Date;
}

@Injectable()
export class AuctionClosingService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly realtimeEventsPublisher: RealtimeEventsPublisher,
  ) {}

  async closeAuction(auctionId: string): Promise<AuctionCloseResult> {
    // first checks if auction is CLOSED or CANCELLED, then check database time, then find highest bid and transfer card ownership if needed.

    const result = await this.dataSource.transaction<AuctionCloseResult>(
      async (manager) => {
        const auction = await manager.findOne(Auction, {
          where: { id: auctionId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!auction) {
          return { auctionId, outcome: 'not-found' };
        }

        // for idempotency
        if (
          auction.status === AuctionStatus.CLOSED ||
          auction.status === AuctionStatus.CANCELLED
        ) {
          return { auctionId, outcome: 'already-final' };
        }

        const databaseNow = await this.getDatabaseNow(manager);

        if (databaseNow < auction.endTime) {
          return {
            auctionId,
            outcome: 'not-expired',
            rescheduleAt: auction.endTime,
          };
        }

        if (auction.status !== AuctionStatus.ACTIVE) {
          return { auctionId, outcome: 'already-final' };
        }

        auction.status = AuctionStatus.CLOSING;
        await manager.save(Auction, auction);

        const highestBid = auction.currentHighestBidId
          ? await manager.findOne(Bid, {
              where: { id: auction.currentHighestBidId },
            })
          : null;

        const card = await manager.findOne(Card, {
          where: { id: auction.cardId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!card) {
          throw new Error(
            `Card ${auction.cardId} not found for auction ${auction.id}`,
          );
        }

        card.status = CardStatus.OWNED;

        let outcome: AuctionCloseOutcome = 'closed-without-bids';
        let winnerUserId: string | undefined;

        if (highestBid) {
          winnerUserId = highestBid.bidderUserId;
          card.ownerUserId = highestBid.bidderUserId;

          const transfer = manager.create(CardTransfer, {
            cardId: card.id,
            fromUserId: auction.sellerUserId,
            toUserId: highestBid.bidderUserId,
            auctionId: auction.id,
          });

          await manager.save(CardTransfer, transfer);
          outcome = 'closed-with-winner';
        } else {
          card.ownerUserId = auction.sellerUserId;
        }

        auction.status = AuctionStatus.CLOSED;
        auction.closedAt = databaseNow;

        await manager.save(Card, card);
        await manager.save(Auction, auction);

        return {
          auctionId,
          outcome,
          winnerUserId,
          winningBidAmount: highestBid?.amount ?? null,
          closedAt: auction.closedAt,
        };
      },
    );

    if (
      result.outcome === 'closed-with-winner' ||
      result.outcome === 'closed-without-bids'
    ) {
      await this.realtimeEventsPublisher.publishAuctionClosed({
        auctionId: result.auctionId,
        winnerUserId: result.winnerUserId ?? null,
        winningBidAmount: result.winningBidAmount ?? null,
        closedAt: result.closedAt!.toISOString(),
      });
    }

    return result;
  }

  private async getDatabaseNow(manager: EntityManager): Promise<Date> {
    const result = await manager.query<{ now: Date | string }[]>(
      'SELECT NOW() AS now',
    );

    return new Date(result[0].now);
  }
}
