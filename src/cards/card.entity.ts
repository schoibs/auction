import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from 'typeorm';
  import { CardType } from '../card-types/card-type.entity';
  import { User } from '../users/user.entity';
  
  export enum CardStatus {
    OWNED = 'OWNED',
    LOCKED_IN_AUCTION = 'LOCKED_IN_AUCTION',
  }
  
  @Entity('cards')
  export class Card {
    @PrimaryGeneratedColumn('uuid')
    id!: string;
  
    @Column({ name: 'card_type_id', type: 'uuid' })
    cardTypeId!: string;
  
    @ManyToOne(() => CardType, { nullable: false })
    @JoinColumn({ name: 'card_type_id' })
    cardType!: CardType;
  
    @Column({ name: 'owner_user_id', type: 'uuid' })
    ownerUserId!: string;
  
    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'owner_user_id' })
    owner!: User;
  
    @Column({
      type: 'enum',
      enum: CardStatus,
      enumName: 'card_status',
      default: CardStatus.OWNED,
    })
    status!: CardStatus;
  
    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt!: Date;
  
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt!: Date;
  }
  