import type { IsoDateString } from './api';

export interface AuctionRoomPayload {
  auctionId: string;
}

export interface AuctionCreatedPayload {
  auctionId: string;
  cardId: string;
  sellerUserId: string;
  startPrice: number;
  startTime: IsoDateString;
  endTime: IsoDateString;
}

export interface AuctionBidPlacedPayload {
  auctionId: string;
  bidId: string;
  bidderUserId: string;
  amount: number;
  createdAt: IsoDateString;
}

export interface AuctionOutbidPayload {
  auctionId: string;
  previousBidderUserId: string;
  newBidderUserId: string;
  newBidId: string;
  amount: number;
  createdAt: IsoDateString;
}

export interface AuctionClosedPayload {
  auctionId: string;
  winnerUserId: string | null;
  winningBidAmount: number | null;
  closedAt: IsoDateString;
}

export interface AuctionCancelledPayload {
  auctionId: string;
  cancelledAt: IsoDateString;
}

export interface ServerToClientEvents {
  'auction.created': (payload: AuctionCreatedPayload) => void;
  'auction.bid_placed': (payload: AuctionBidPlacedPayload) => void;
  'auction.outbid': (payload: AuctionOutbidPayload) => void;
  'auction.closed': (payload: AuctionClosedPayload) => void;
  'auction.cancelled': (payload: AuctionCancelledPayload) => void;
  'auction.joined': (payload: AuctionRoomPayload) => void;
  'auction.left': (payload: AuctionRoomPayload) => void;
  'auth.failed': () => void;
}

export interface ClientToServerEvents {
  'auction.join': (payload: AuctionRoomPayload) => void;
  'auction.leave': (payload: AuctionRoomPayload) => void;
}
