import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuctionJobsModule } from '../auction-jobs/auction-jobs.module';
import { CardTypesModule } from '../card-types/card-types.module';
import { UsersModule } from '../users/users.module';
import { Auction } from './auction.entity';
import { AuctionsController } from './auctions.controller';
import { AuctionsService } from './auctions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Auction]),
    AuctionJobsModule,
    UsersModule,
    CardTypesModule,
  ],
  controllers: [AuctionsController],
  providers: [AuctionsService],
  exports: [AuctionsService],
})
export class AuctionsModule {}
