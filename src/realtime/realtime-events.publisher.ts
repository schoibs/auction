import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
  AuctionBidPlacedPayload,
  AuctionCancelledPayload,
  AuctionClosedPayload,
  AuctionCreatedPayload,
  AuctionOutbidPayload,
  REALTIME_AUCTION_EVENTS_CHANNEL,
  RealtimeAuctionEvent,
  RealtimeServerEvent,
} from './realtime-events.types';

// This is a provider. Any module that imports the module exporting this provider can inject it into a service.
@Injectable()
export class RealtimeEventsPublisher implements OnModuleDestroy {
  private readonly logger = new Logger(RealtimeEventsPublisher.name);
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.getOrThrow<string>('REDIS_HOST'),
      port: this.configService.getOrThrow<number>('REDIS_PORT'),
    });

    this.redis.on('error', (error) => {
      this.logger.warn(`Redis publisher error: ${error.message}`);
    });
  }

  publishAuctionCreated(payload: AuctionCreatedPayload): Promise<void> {
    return this.publish({
      type: RealtimeServerEvent.AUCTION_CREATED,
      payload,
    });
  }

  publishBidPlaced(payload: AuctionBidPlacedPayload): Promise<void> {
    return this.publish({
      type: RealtimeServerEvent.AUCTION_BID_PLACED,
      payload,
    });
  }

  publishOutbid(payload: AuctionOutbidPayload): Promise<void> {
    return this.publish({
      type: RealtimeServerEvent.AUCTION_OUTBID,
      payload,
    });
  }

  publishAuctionClosed(payload: AuctionClosedPayload): Promise<void> {
    return this.publish({
      type: RealtimeServerEvent.AUCTION_CLOSED,
      payload,
    });
  }

  publishAuctionCancelled(payload: AuctionCancelledPayload): Promise<void> {
    return this.publish({
      type: RealtimeServerEvent.AUCTION_CANCELLED,
      payload,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }

  private async publish(event: RealtimeAuctionEvent): Promise<void> {
    try {
      await this.redis.publish(
        REALTIME_AUCTION_EVENTS_CHANNEL,
        JSON.stringify(event),
      );
    } catch (error) {
        // just log errors, no need throw back into the auction flow. else might undo the bid/close auction flow.
      this.logger.warn(
        `Failed to publish realtime event ${event.type}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}