import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CardType } from './card-type.entity';
import { CardTypeResponse } from './card-types.types';
import { CreateCardTypeDto } from './dto/create-card-type.dto';

@Injectable()
export class CardTypesService {
  constructor(
    @InjectRepository(CardType)
    private readonly cardTypesRepository: Repository<CardType>,
  ) {}

  async create(input: CreateCardTypeDto): Promise<CardTypeResponse> {
    const cardType = this.cardTypesRepository.create({
      name: input.name.trim(),
      attack: input.attack,
      midfield: input.midfield,
      defense: input.defense,
    });

    const savedCardType = await this.cardTypesRepository.save(cardType);
    return this.toResponse(savedCardType);
  }

  async findAll(): Promise<CardTypeResponse[]> {
    const cardTypes = await this.cardTypesRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });

    return cardTypes.map((cardType) => this.toResponse(cardType));
  }

  async findByIdOrThrow(id: string): Promise<CardType> {
    const cardType = await this.cardTypesRepository.findOne({
      where: { id },
    });

    if (!cardType) {
      throw new NotFoundException('Card type not found');
    }

    return cardType;
  }

  toResponse(cardType: CardType): CardTypeResponse {
    return {
      id: cardType.id,
      name: cardType.name,
      attack: cardType.attack,
      midfield: cardType.midfield,
      defense: cardType.defense,
      createdAt: cardType.createdAt,
      updatedAt: cardType.updatedAt,
    };
  }
}
