import { Injectable, Logger } from '@nestjs/common';
import type { Server } from 'socket.io';
import {
  auctionRoom,
  RealtimeAuctionEvent,
  RealtimeServerEvent,
  userRoom,
} from './realtime-events.types';

@Injectable()
export class RealtimeSocketService {
  private readonly logger = new Logger(RealtimeSocketService.name);
  private server: Server | null = null;

  bindServer(server: Server): void {
    this.server = server;
  }

  broadcast(event: RealtimeAuctionEvent): void {
    if (!this.server) {
      this.logger.warn(`Socket server not ready for ${event.type}`);
      return;
    }

    switch (event.type) {
      case RealtimeServerEvent.AUCTION_CREATED:
        this.server.emit(event.type, event.payload);
        return;

      case RealtimeServerEvent.AUCTION_BID_PLACED:
        this.server
          .to(auctionRoom(event.payload.auctionId))
          .emit(event.type, event.payload);
        return;

      case RealtimeServerEvent.AUCTION_OUTBID:
        this.server
          .to(userRoom(event.payload.previousBidderUserId))
          .emit(event.type, event.payload);
        return;

      case RealtimeServerEvent.AUCTION_CLOSED:
        this.server
          .to(auctionRoom(event.payload.auctionId))
          .emit(event.type, event.payload);
        return;

      case RealtimeServerEvent.AUCTION_CANCELLED:
        this.server
          .to(auctionRoom(event.payload.auctionId))
          .emit(event.type, event.payload);
        return;
    }
  }
}
