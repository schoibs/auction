import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { isUUID } from 'class-validator';
import type { Server, Socket } from 'socket.io';
import type { CurrentUserPayload, JwtPayload } from '../auth/auth.types';
import { UsersService } from '../users/users.service';
import {
  auctionRoom,
  RealtimeClientEvent,
  userRoom,
} from './realtime-events.types';
import type { AuctionRoomPayload } from './realtime-events.types';
import { RealtimeSocketService } from './realtime-socket.service';

interface AuthenticatedSocket extends Socket {
  data: Socket['data'] & {
    user?: CurrentUserPayload;
  };
}

@WebSocketGateway({
  // registers a Socket.IO server inside the Nest app
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  },
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly realtimeSocketService: RealtimeSocketService,
  ) {}

  afterInit(server: Server): void {
    this.realtimeSocketService.bindServer(server);
    this.logger.log('Realtime gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    const token = this.extractToken(client);

    if (!token) {
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        return;
      }

      client.data.user = {
        id: user.id,
        email: user.email,
        username: user.username,
      };

      await client.join(userRoom(user.id));
    } catch {
      client.emit('auth.failed');
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    this.logger.debug(`Socket disconnected: ${client.id}`);
  }

  @SubscribeMessage(RealtimeClientEvent.AUCTION_JOIN)
  async handleAuctionJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: AuctionRoomPayload,
  ): Promise<{ event: string; data: AuctionRoomPayload }> {
    this.validateAuctionRoomPayload(payload);

    await client.join(auctionRoom(payload.auctionId));

    return {
      event: 'auction.joined',
      data: payload,
    };
  }

  @SubscribeMessage(RealtimeClientEvent.AUCTION_LEAVE)
  async handleAuctionLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: AuctionRoomPayload,
  ): Promise<{ event: string; data: AuctionRoomPayload }> {
    this.validateAuctionRoomPayload(payload);

    await client.leave(auctionRoom(payload.auctionId));

    return {
      event: 'auction.left',
      data: payload,
    };
  }

  private validateAuctionRoomPayload(payload: AuctionRoomPayload): void {
    if (!payload || !isUUID(payload.auctionId)) {
      throw new WsException('auctionId must be a UUID');
    }
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;

    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const authorizationHeader = client.handshake.headers.authorization;
    const authorization = Array.isArray(authorizationHeader)
      ? authorizationHeader[0]
      : authorizationHeader;

    if (!authorization) {
      return null;
    }

    return authorization.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : authorization;
  }
}
