export interface BidResponse {
  id: string;
  auctionId: string;
  bidderUserId: string;
  amount: number;
  createdAt: Date;
}

export interface BidsPage {
  items: BidResponse[];
  nextCursor: string | null;
}
