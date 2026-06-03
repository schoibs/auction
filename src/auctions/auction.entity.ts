import {
    Check,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from 'typeorm';
  import { Card } from '../cards/card.entity';
  import { User } from '../users/user.entity';
  import { Bid } from '../bids/bid.entity';

  export enum AuctionStatus {
    ACTIVE = 'ACTIVE',
    CLOSING = 'CLOSING',
    CLOSED = 'CLOSED',
    CANCELLED = 'CANCELLED',
  }
  
  @Check('"start_price" >= 0')
  @Check('"end_time" > "start_time"')
  @Entity('auctions')
  export class Auction {
    @PrimaryGeneratedColumn('uuid')
    id!: string;
  
    @Column({ name: 'card_id', type: 'uuid' })
    cardId!: string;
  
    @ManyToOne(() => Card, { nullable: false })
    @JoinColumn({ name: 'card_id' })
    card!: Card;
  
    @Column({ name: 'seller_user_id', type: 'uuid' })
    sellerUserId!: string;
  
    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'seller_user_id' })
    seller!: User;
  
    @Column({
      type: 'enum',
      enum: AuctionStatus,
      enumName: 'auction_status',
      default: AuctionStatus.ACTIVE,
    })
    status!: AuctionStatus;
  
    @Column({ name: 'start_price', type: 'int' })
    startPrice!: number;
  
    @Column({ name: 'current_highest_bid_id', type: 'uuid', nullable: true })
    currentHighestBidId!: string | null;

    @ManyToOne(() => Bid, { nullable: true })
    @JoinColumn({ name: 'current_highest_bid_id' })
    currentHighestBid!: Bid | null;
  
    @Column({ name: 'start_time', type: 'timestamptz' })
    startTime!: Date;
  
    @Column({ name: 'end_time', type: 'timestamptz' })
    endTime!: Date;
  
    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt!: Date;
  
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt!: Date;
  
    @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
    closedAt!: Date | null;
  
    @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
    cancelledAt!: Date | null;
  }
  