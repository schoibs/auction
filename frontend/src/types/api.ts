export type IsoDateString = string;

export interface PublicUser {
  id: string;
  email: string;
  username: string;
}

export type CurrentUser = PublicUser;

export interface AuthResponse {
  accessToken: string;
  user: PublicUser;
}

export interface CardType {
  id: string;
  name: string;
  attack: number;
  midfield: number;
  defense: number;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export type CardStatus = 'OWNED' | 'LOCKED_IN_AUCTION';

export interface Card {
  id: string;
  status: CardStatus;
  cardType: CardType;
  owner: PublicUser;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface Bid {
  id: string;
  auctionId: string;
  bidderUserId: string;
  amount: number;
  createdAt: IsoDateString;
}

export type AuctionStatus = 'ACTIVE' | 'CLOSING' | 'CLOSED' | 'CANCELLED';

export interface AuctionDetail {
  id: string;
  cardId: string;
  sellerUserId: string;
  status: AuctionStatus;
  startPrice: number;
  currentHighestBid: Bid | null;
  startTime: IsoDateString;
  endTime: IsoDateString;
  closedAt: IsoDateString | null;
  cancelledAt: IsoDateString | null;
  card: Card;
  seller: PublicUser;
  recentBids: Bid[];
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CreateBidInput {
  amount: number;
}

export interface CreateAuctionInput {
  cardId: string;
  startPrice: number;
  durationSeconds: number;
}
