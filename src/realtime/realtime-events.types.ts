export const REALTIME_AUCTION_EVENTS_CHANNEL = 'auction-events';

export const auctionRoom = (auctionId: string) => `auction:${auctionId}`;
export const userRoom = (userId: string) => `user:${userId}`;

export enum RealtimeClientEvent {
  AUCTION_JOIN = 'auction.join',
  AUCTION_LEAVE = 'auction.leave',
}

export enum RealtimeServerEvent {
  AUCTION_CREATED = 'auction.created',
  AUCTION_BID_PLACED = 'auction.bid_placed',
  AUCTION_OUTBID = 'auction.outbid',
  AUCTION_CLOSED = 'auction.closed',
  AUCTION_CANCELLED = 'auction.cancelled',
}

export interface AuctionRoomPayload {
  auctionId: string;
}

export interface AuctionCreatedPayload {
  auctionId: string;
  cardId: string;
  sellerUserId: string;
  startPrice: number;
  startTime: string;
  endTime: string;
}

export interface AuctionBidPlacedPayload {
  auctionId: string;
  bidId: string;
  bidderUserId: string;
  amount: number;
  createdAt: string;
}

export interface AuctionOutbidPayload {
  auctionId: string;
  previousBidderUserId: string;
  newBidderUserId: string;
  newBidId: string;
  amount: number;
  createdAt: string;
}

export interface AuctionClosedPayload {
  auctionId: string;
  winnerUserId: string | null;
  winningBidAmount: number | null;
  closedAt: string;
}

export interface AuctionCancelledPayload {
  auctionId: string;
  cancelledAt: string;
}

export type RealtimeAuctionEvent =
  | {
      type: RealtimeServerEvent.AUCTION_CREATED;
      payload: AuctionCreatedPayload;
    }
  | {
      type: RealtimeServerEvent.AUCTION_BID_PLACED;
      payload: AuctionBidPlacedPayload;
    }
  | {
      type: RealtimeServerEvent.AUCTION_OUTBID;
      payload: AuctionOutbidPayload;
    }
  | {
      type: RealtimeServerEvent.AUCTION_CLOSED;
      payload: AuctionClosedPayload;
    }
  | {
      type: RealtimeServerEvent.AUCTION_CANCELLED;
      payload: AuctionCancelledPayload;
    };
