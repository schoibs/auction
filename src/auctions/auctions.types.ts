import { BidResponse } from '../bids/bids.types';
import { CardResponse } from '../cards/cards.types';
import { PublicUser } from '../users/user.types';
import { AuctionStatus } from './auction.entity';

export type BidSummaryResponse = BidResponse;

export interface AuctionResponse {
  id: string;
  cardId: string;
  sellerUserId: string;
  status: AuctionStatus;
  startPrice: number;
  currentHighestBid: BidSummaryResponse | null;
  startTime: Date;
  endTime: Date;
  closedAt: Date | null;
  cancelledAt: Date | null;
}

export interface AuctionDetailResponse extends AuctionResponse {
  card: CardResponse;
  seller: PublicUser;
  recentBids: BidSummaryResponse[];
}

export interface AuctionsPage {
  items: AuctionDetailResponse[];
  nextCursor: string | null;
}
