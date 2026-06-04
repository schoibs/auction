import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuctionJobsModule } from '../auction-jobs/auction-jobs.module';
import { CardTypesModule } from '../card-types/card-types.module';
import { UsersModule } from '../users/users.module';
import { Auction } from './auction.entity';
import { AuctionsController } from './auctions.controller';
import { AuctionsService } from './auctions.service';
import { Bid } from '../bids/bid.entity';
import { CardTransfer } from '../cards/card-transfer.entity';
import { Card } from '../cards/card.entity';
import { AuctionClosingService } from './auction-closing.service';
import { RealtimePublisherModule } from '../realtime/realtime-publisher.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Auction, Bid, Card, CardTransfer]),
    AuctionJobsModule,
    UsersModule,
    CardTypesModule,
    RealtimePublisherModule,
  ],
  controllers: [AuctionsController],
  providers: [AuctionsService, AuctionClosingService],
  exports: [AuctionsService, AuctionClosingService],
})
export class AuctionsModule {}
