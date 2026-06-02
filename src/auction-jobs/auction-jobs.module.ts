import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AuctionCloseQueueService } from './auction-close-queue.service';
import { AUCTION_CLOSE_QUEUE } from './auction-jobs.constants';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.getOrThrow<string>('REDIS_HOST'),
          port: configService.getOrThrow<number>('REDIS_PORT'),
        },
      }),
    }),
    BullModule.registerQueue({
      name: AUCTION_CLOSE_QUEUE,
    }),
  ],
  providers: [AuctionCloseQueueService],
  exports: [AuctionCloseQueueService],
})
export class AuctionJobsModule {}
