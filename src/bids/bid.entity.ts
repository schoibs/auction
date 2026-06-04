import {
  Check,
  Column,
  CreateDateColumn,
  Index,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Auction } from '../auctions/auction.entity';
import { User } from '../users/user.entity';

@Index('idx_bids_auction_amount', ['auctionId', 'amount'])
@Index('idx_bids_bidder_user_id', ['bidderUserId'])
@Check('"amount" > 0')
@Entity('bids')
export class Bid {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'auction_id', type: 'uuid' })
  auctionId!: string;

  @ManyToOne(() => Auction, { nullable: false })
  @JoinColumn({ name: 'auction_id' })
  auction!: Auction;

  @Column({ name: 'bidder_user_id', type: 'uuid' })
  bidderUserId!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'bidder_user_id' })
  bidder!: User;

  @Column({ type: 'int' })
  amount!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
