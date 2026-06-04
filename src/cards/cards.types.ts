import { CardTypeResponse } from '../card-types/card-types.types';
import { PublicUser } from '../users/user.types';
import { CardStatus } from './card.entity';

export interface CardResponse {
  id: string;
  status: CardStatus;
  cardType: CardTypeResponse;
  owner: PublicUser;
  createdAt: Date;
  updatedAt: Date;
}

export interface CardsPage {
  items: CardResponse[];
  nextCursor: string | null;
}
