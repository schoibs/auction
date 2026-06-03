import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { AuctionStatus } from '../auctions/auction.entity';
import { AuctionCloseQueueService } from './auction-close-queue.service';

interface ExpiredAuctionRow {
  id: string;
  end_time: Date | string;
}

@Injectable()
export class ExpiredAuctionsScanner implements OnModuleInit, OnModuleDestroy {
  // runs periodically to scan for ACTIVE auctions that should have been closed

  private readonly logger = new Logger(ExpiredAuctionsScanner.name);
  private interval: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    private readonly auctionCloseQueueService: AuctionCloseQueueService,
  ) {}

  onModuleInit(): void {
    const intervalSeconds = Number(
      this.configService.get('AUCTION_SCANNER_INTERVAL_SECONDS') ?? 30,
    );

    this.interval = setInterval(() => {
      void this.scan();
    }, intervalSeconds * 1000);

    void this.scan();
  }

  onModuleDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  private async scan(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;

    try {
      const expiredAuctions = await this.dataSource.query<ExpiredAuctionRow[]>(
        `
          SELECT id, end_time
          FROM auctions
          WHERE status = $1
          AND end_time <= NOW()
          ORDER BY end_time ASC
          LIMIT 100
        `,
        [AuctionStatus.ACTIVE],
      );

      for (const auction of expiredAuctions) {
        await this.auctionCloseQueueService.scheduleClose({
          id: auction.id,
          endTime: new Date(auction.end_time),
        });
      }

      if (expiredAuctions.length > 0) {
        this.logger.log(`Queued ${expiredAuctions.length} expired auction(s)`);
      }
    } catch (error) {
      this.logger.error(
        'Failed to scan expired auctions',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.running = false;
    }
  }
}
