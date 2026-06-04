import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
  REALTIME_AUCTION_EVENTS_CHANNEL,
  RealtimeAuctionEvent,
} from './realtime-events.types';
import { RealtimeSocketService } from './realtime-socket.service';

@Injectable()
export class RealtimeRedisSubscriber implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RealtimeRedisSubscriber.name);
  private readonly redis: Redis;

  constructor(
    private readonly configService: ConfigService,
    private readonly realtimeSocketService: RealtimeSocketService,
  ) {
    this.redis = new Redis({
      host: this.configService.getOrThrow<string>('REDIS_HOST'),
      port: this.configService.getOrThrow<number>('REDIS_PORT'),
    });

    this.redis.on('error', (error) => {
      this.logger.warn(`Redis subscriber error: ${error.message}`);
    });
  }

  async onModuleInit(): Promise<void> {
    await this.redis.subscribe(REALTIME_AUCTION_EVENTS_CHANNEL);

    this.redis.on('message', (channel, message) => {
      if (channel !== REALTIME_AUCTION_EVENTS_CHANNEL) {
        return;
      }

      this.handleMessage(message);
    });

    this.logger.log(`Subscribed to ${REALTIME_AUCTION_EVENTS_CHANNEL}`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }

  private handleMessage(message: string): void {
    try {
      const event = JSON.parse(message) as RealtimeAuctionEvent;
      this.realtimeSocketService.broadcast(event);
    } catch (error) {
      this.logger.warn(
        `Failed to handle realtime message: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}