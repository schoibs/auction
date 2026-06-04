import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auction } from '../auctions/auction.entity';
import { Bid } from './bid.entity';
import { BidsController } from './bids.controller';
import { BidsService } from './bids.service';
import { RealtimePublisherModule } from '../realtime/realtime-publisher.module';

@Module({
  imports: [TypeOrmModule.forFeature([Bid, Auction]), RealtimePublisherModule],
  controllers: [BidsController],
  providers: [BidsService],
  exports: [BidsService],
})
export class BidsModule {}
