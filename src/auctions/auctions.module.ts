import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuctionJobsModule } from '../auction-jobs/auction-jobs.module';
import { CardTypesModule } from '../card-types/card-types.module';
import { UsersModule } from '../users/users.module';
import { Auction } from './auction.entity';
import { AuctionsController } from './auctions.controller';
import { AuctionsService } from './auctions.service';
import { Bid } from '../bids/bid.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Auction, Bid]),
    AuctionJobsModule,
    UsersModule,
    CardTypesModule,
  ],
  controllers: [AuctionsController],
  providers: [AuctionsService],
  exports: [AuctionsService],
})
export class AuctionsModule {}
