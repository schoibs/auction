import { Module } from '@nestjs/common';
import { AuctionCloseProcessor } from './auction-jobs/auction-close.processor';
import { AuctionJobsModule } from './auction-jobs/auction-jobs.module';
import { ExpiredAuctionsScanner } from './auction-jobs/expired-auctions.scanner';
import { AuctionsModule } from './auctions/auctions.module';
import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    AuctionJobsModule,
    AuctionsModule,
  ],
  providers: [AuctionCloseProcessor, ExpiredAuctionsScanner],
})
export class WorkerModule {}
