import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Auction } from '../auctions/auction.entity';
import { User } from '../users/user.entity';
import { Card } from './card.entity';

@Index('idx_card_transfers_card_id', ['cardId'])
@Index('idx_card_transfers_from_user_id', ['fromUserId'])
@Index('idx_card_transfers_to_user_id', ['toUserId'])
@Index('idx_card_transfers_auction_id', ['auctionId'])
@Entity('card_transfers')
export class CardTransfer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'card_id', type: 'uuid' })
  cardId!: string;

  @ManyToOne(() => Card, { nullable: false })
  @JoinColumn({ name: 'card_id' })
  card!: Card;

  @Column({ name: 'from_user_id', type: 'uuid' })
  fromUserId!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'from_user_id' })
  fromUser!: User;

  @Column({ name: 'to_user_id', type: 'uuid' })
  toUserId!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'to_user_id' })
  toUser!: User;

  @Column({ name: 'auction_id', type: 'uuid', nullable: true })
  auctionId!: string | null;

  @ManyToOne(() => Auction, { nullable: true })
  @JoinColumn({ name: 'auction_id' })
  auction!: Auction | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
