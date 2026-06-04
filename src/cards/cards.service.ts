import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, LessThan, Repository } from 'typeorm';
import { CardTypesService } from '../card-types/card-types.service';
import { UsersService } from '../users/users.service';
import { Card, CardStatus } from './card.entity';
import { CardsPage, CardResponse } from './cards.types';
import { ListMyCardsQueryDto } from './dto/list-my-cards-query.dto';
import { MintCardDto } from './dto/mint-card.dto';

@Injectable()
export class CardsService {
  constructor(
    @InjectRepository(Card)
    private readonly cardsRepository: Repository<Card>,
    private readonly usersService: UsersService,
    private readonly cardTypesService: CardTypesService,
  ) {}

  async listMine(
    ownerUserId: string,
    query: ListMyCardsQueryDto,
  ): Promise<CardsPage> {
    const limit = query.limit ?? 20;
    const where: FindOptionsWhere<Card> = {
      ownerUserId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.cursor) {
      where.createdAt = LessThan(new Date(query.cursor));
    }

    const cards = await this.cardsRepository.find({
      where,
      relations: {
        cardType: true,
        owner: true,
      },
      order: {
        createdAt: 'DESC',
      },
      take: limit + 1,
    });

    const hasNextPage = cards.length > limit;
    const items = hasNextPage ? cards.slice(0, limit) : cards;
    const lastItem = items.at(-1);

    return {
      items: items.map((card) => this.toResponse(card)),
      nextCursor:
        hasNextPage && lastItem ? lastItem.createdAt.toISOString() : null,
    };
  }

  async mint(input: MintCardDto): Promise<CardResponse> {
    const owner = await this.usersService.findById(input.ownerUserId);

    if (!owner) {
      throw new NotFoundException('Owner user not found');
    }

    const cardType = await this.cardTypesService.findByIdOrThrow(
      input.cardTypeId,
    );

    const card = this.cardsRepository.create({
      ownerUserId: owner.id,
      owner,
      cardTypeId: cardType.id,
      cardType,
      status: CardStatus.OWNED,
    });

    const savedCard = await this.cardsRepository.save(card);

    return this.toResponse({
      ...savedCard,
      owner,
      cardType,
    });
  }

  private toResponse(card: Card): CardResponse {
    return {
      id: card.id,
      status: card.status,
      cardType: this.cardTypesService.toResponse(card.cardType),
      owner: this.usersService.toPublicUser(card.owner),
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
    };
  }
}
