import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { AUCTION_CLOSE_QUEUE, CLOSE_AUCTION_JOB } from './auction-jobs.constants';

export interface CloseAuctionJobData {
  auctionId: string;
}

interface SchedulableAuction {
  id: string;
  endTime: Date;
}

@Injectable()
export class AuctionCloseQueueService {
  constructor(
    @InjectQueue(AUCTION_CLOSE_QUEUE)
    private readonly auctionCloseQueue: Queue<CloseAuctionJobData>,
  ) {}

  async scheduleClose(auction: SchedulableAuction): Promise<void> {
    // call this method right after auction creation succeeds
    // then a job to close the auction will be scheduled for when the auction ends 
    const delay = Math.max(0, auction.endTime.getTime() - Date.now());

    await this.auctionCloseQueue.add(
      CLOSE_AUCTION_JOB,
      { auctionId: auction.id },
      {
        jobId: `${CLOSE_AUCTION_JOB}-${auction.id}`,
        delay,
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }
}
