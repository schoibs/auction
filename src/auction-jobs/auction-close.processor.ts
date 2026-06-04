import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { AuctionClosingService } from '../auctions/auction-closing.service';
import {
  AuctionCloseQueueService,
  CloseAuctionJobData,
} from './auction-close-queue.service';
import {
  AUCTION_CLOSE_QUEUE,
  CLOSE_AUCTION_JOB,
} from './auction-jobs.constants';

@Processor(AUCTION_CLOSE_QUEUE)
export class AuctionCloseProcessor extends WorkerHost {
  // this processor listens to the auction-close queue for BullMQ jobs to close auctions

  private readonly logger = new Logger(AuctionCloseProcessor.name);

  constructor(
    private readonly auctionClosingService: AuctionClosingService,
    private readonly auctionCloseQueueService: AuctionCloseQueueService,
  ) {
    super();
  }

  async process(job: Job<CloseAuctionJobData>): Promise<void> {
    if (job.name !== CLOSE_AUCTION_JOB) {
      this.logger.warn(`Ignoring unexpected job ${job.name}`);
      return;
    }

    // close auction here
    const result = await this.auctionClosingService.closeAuction(
      job.data.auctionId,
    );

    if (result.outcome === 'not-expired' && result.rescheduleAt) {
      await this.auctionCloseQueueService.scheduleClose({
        id: result.auctionId,
        endTime: result.rescheduleAt,
      });
    }

    this.logger.log(
      `Processed ${CLOSE_AUCTION_JOB} for auction ${result.auctionId}: ${result.outcome}`,
    );
  }
}
