# Realtime Module

This folder owns the Socket.IO realtime layer for auction updates.

Realtime events are not the source of truth. PostgreSQL and the HTTP API remain authoritative. The socket layer only tells connected clients that an auction changed so the UI can update without polling constantly.

## Mental Model

The app has two NestJS runtimes:

```text
api:
  owns HTTP
  owns Socket.IO
  has connected clients

worker:
  closes auctions
  has no connected clients
```

Because the worker cannot emit directly to sockets connected to the API process, realtime events travel through Redis Pub/Sub:

```text
Domain service
  |
  v
RealtimeEventsPublisher
  |
  v
Redis channel: auction-events
  |
  v
RealtimeRedisSubscriber
  |
  v
RealtimeSocketService
  |
  v
Socket.IO clients
```

## Module Boundaries

There are two realtime modules because publishing an event is different from owning socket connections.

###  `RealtimePublisherModule` is the small, shared module.

- It exports `RealtimeEventsPublisher`, which lets domain services publish auction events into the Redis `auction-events` channel.

- This module is safe to import from services used by both runtimes, including worker-used services like auction closing. It does not create a Socket.IO gateway, does not subscribe to Redis, and does not know which clients are connected.

- Use `RealtimePublisherModule` when a module needs to publish events.

- Shared by API and worker-side domain code.

### `RealtimeModule` is the API-only module.

- It imports `RealtimePublisherModule`, but also starts the pieces that only make sense in the API process: Socket.IO gateway, Redis subscriber and socket broadcasting service.

- Use `RealtimeModule` only in `AppModule`. No need to import it into `WorkerModule`, because the worker should not start a WebSocket server.

- Main responsibilities: Accept socket clients and broadcast events

- Used by API process only.


## High Overview:

```text
RealtimeEventsPublisher:
  domain event -> Redis

RealtimeRedisSubscriber:
  Redis -> parsed realtime event

RealtimeSocketService:
  realtime event -> Socket.IO room
```

- `RealtimeRedisSubscriber` runs in the API process and listens to the same Redis channel that the publisher writes to.

- When `RealtimeRedisSubscriber` receives a message, it parses the event and hands it to `RealtimeSocketService` (the Socket.IO broadcasting side).

- `RealtimeSocketService` receives already-published realtime events and decides where each event should go:

```text
auction.created:
  all connected sockets

auction.bid_placed:
  auction:<auctionId>

auction.outbid:
  user:<previousBidderUserId>

auction.closed:
  auction:<auctionId>

auction.cancelled:
  auction:<auctionId>
```

## Rooms

Auction rooms:

```text
auction:<auctionId>
```

Clients join these rooms to receive public auction updates such as bids and closure.

User rooms:

```text
user:<userId>
```

Authenticated sockets join their user room automatically. This is used for private user-specific events such as `auction.outbid`.

## Client Events

Join an auction room:

```ts
socket.emit('auction.join', {
  auctionId: '<auction-id>',
});
```

Leave an auction room:

```ts
socket.emit('auction.leave', {
  auctionId: '<auction-id>',
});
```

The gateway validates that `auctionId` is a UUID before joining or leaving a room.

## Server Events

`auction.created`

Broadcast to all connected sockets when an auction is created.

`auction.bid_placed`

Broadcast to `auction:<auctionId>` after a bid transaction commits.

`auction.outbid`

Sent to `user:<previousBidderUserId>` after a higher bid commits.

`auction.closed`

Broadcast to `auction:<auctionId>` after the worker closes an auction.

`auction.cancelled`

Broadcast to `auction:<auctionId>` when auction cancellation is wired in.

## Authentication

Socket authentication is optional for public auction watching.

Authenticated clients can pass the JWT in the Socket.IO handshake:

```ts
io('http://localhost:3000', {
  auth: {
    token: '<jwt>',
  },
});
```

The gateway also accepts an `Authorization: Bearer <jwt>` handshake header. If authentication succeeds, the socket joins `user:<userId>`.

## Publishing Rules

Publish only after the database transaction commits.

Good flow:

```text
write rows
commit transaction
publish event
```

Avoid this:

```text
write rows
publish event
rollback transaction
```

If Redis publish fails, the publisher logs the error and does not throw into the auction flow. A missed realtime event should not undo a valid bid or auction close.

## Smoke Test

Start the app:

```bash
docker compose up api worker postgres redis
```

In another terminal, connect a socket client:

```bash
docker compose exec api npm run socket:smoke -- <auction-id> [jwt]
```

Then create a bid with HTTP:

```bash
curl -X POST http://localhost:3000/auctions/<auction-id>/bids \
  -H "Authorization: Bearer <bidder-token>" \
  -H "Content-Type: application/json" \
  -d '{"amount":150}'
```

The smoke client should print `auction.bid_placed`. When the auction expires and the worker closes it, the same client should print `auction.closed`.

## Notes

- The gateway should not contain bidding or auction-closing rules.
- Domain services should not know about Socket.IO rooms.
- `RealtimeModule` belongs in the API process.
- `RealtimePublisherModule` is the piece domain services import.
- HTTP responses and database rows are authoritative if socket output and HTTP ever disagree.
