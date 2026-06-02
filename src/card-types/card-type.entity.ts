import {
    Check,
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from 'typeorm';
  
  @Check('"attack" >= 1 AND "attack" <= 99')
  @Check('"midfield" >= 1 AND "midfield" <= 99')
  @Check('"defense" >= 1 AND "defense" <= 99')
  @Entity('card_types')
  export class CardType {
    @PrimaryGeneratedColumn('uuid')
    id!: string;
  
    @Column()
    name!: string;
  
    @Column({ type: 'int' })
    attack!: number;
  
    @Column({ type: 'int' })
    midfield!: number;
  
    @Column({ type: 'int' })
    defense!: number;
  
    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt!: Date;
  
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt!: Date;
  }
