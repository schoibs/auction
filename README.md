# Auction Marketplace

An online system for auctioning virtual trading cards. Built on NestJS API, background worker, and a Next.js client. Users can browse live auctions without an account, register to manage an inventory, list owned cards, bid in realtime, and review completed auctions.

## Runtime Architecture

The project runs as 3 application processes:

| Process | Entrypoint | Purpose |
| --- | --- | --- |
| Frontend | `frontend/src/app/` | Next.js browser client for browsing auctions, bidding, and managing cards. |
| API | `src/main.ts` | HTTP API, Swagger UI, and Socket.IO server. |
| Worker | `src/worker.ts` | The background worker that processes auction close jobs and scans for expired auctions. |

- PostgreSQL is the source of truth for users, cards, auctions, bids, and transfer history. 
- Redis carries BullMQ close jobs and relays realtime events from either NestJS process to Socket.IO clients connected to the API.

## API Surface

Swagger API documentation is available at:

```text
http://localhost:3000/docs
```

The main HTTP routes are:

| Route | Authentication | Purpose |
| --- | --- | --- |
| `GET /health` | Public | API health check. |
| `POST /auth/register`, `POST /auth/login` | Public | Create a user or obtain a JWT. |
| `GET /auth/me` | Bearer JWT | Restore the current user session. |
| `GET /card-types` | Public | List the card type catalog. |
| `POST /card-types` | Bearer JWT | Create a card type. |
| `GET /cards/mine`, `POST /cards/mint` | Bearer JWT | Browse the current user's inventory or mint a card. |
| `GET /auctions`, `GET /auctions/:auctionId` | Public | Browse auctions and load auction details. |
| `POST /auctions` | Bearer JWT | List an owned card for auction. |
| `GET /auctions/:auctionId/bids` | Public | Read bid history. |
| `POST /auctions/:auctionId/bids` | Bearer JWT | Place a bid. |

List endpoints use cursor pagination. The Swagger UI documents their supported filters, limits, and request bodies.

## Core Domain Rules

- Basic auth system (username, email and password) is implemented with JWT authentication.
- An authenticated user can mint cards, and place any of the cards into auction (sell).
- An authenticated user can place bid for a card during an active auction.
- The first bid of the auction must be at least the auction start price. Later bids must be greater than the current highest bid.
- Auction creation schedules a BullMQ delayed job for the auction end time.
- The background worker processes `close-auction` jobs from the `auction-close` queue.
- A scanner periodically queues any expired active auctions that were missed.
- If there are no bids, the card returns to the seller in `OWNED` status.
- If there is a winner, the card owner becomes the highest bidder and a card ownership transfer occurs.

## Frontend

- Public live and completed auction listings with card-type filters and cursor pagination.
- Auction detail pages with countdowns, bid history, and realtime updates.
- Registration, login, session restoration, and protected inventory routes.
- Card inventory filters and auction creation for owned cards.
- Realtime outbid notifications for authenticated bidders.
- Responsive layouts, visible keyboard focus, live status announcements, and reduced-motion support.

| Browser route | Purpose |
| --- | --- |
| `/auctions` | Marketplace; supports `status` and `cardTypeId` search parameters. |
| `/auctions/:auctionId` | Auction details, bidding, and bid history. |
| `/login`, `/register` | Authentication. |
| `/my-cards` | Protected inventory and auction creation. |

Realtime messages are update signals rather than authoritative data. The frontend responds to them by refreshing the affected API resource.

## Local Development

### Prerequisites

- Node.js 22
- npm
- Docker Desktop or another Docker Compose compatible runtime

The complete local stack includes the frontend, API, and worker. The API and
worker are both required for complete auction behavior: the worker closes
expired auctions in the background.

### Docker Compose Setup

Create a local `.env` from `.env.example`.

```bash
cp .env.example .env
```

First time setup (PostgreSQL's UUID extension, migrations, and seed data):

```bash
docker compose up -d postgres redis
docker compose build api worker frontend
docker compose exec postgres psql -U auction -d auction -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
docker compose run --rm api npm run migration:run
docker compose run --rm api npm run seed:local
docker compose up
```

For normal development after:

```bash
docker compose up --build
```

Useful local URLs:

```text
API:      http://localhost:3000
Frontend: http://localhost:3001
Swagger:  http://localhost:3000/docs
Adminer:  http://localhost:8080
```

Adminer connection values:

```text
System:   PostgreSQL
Server:   postgres
Username: auction
Password: auction
Database: auction
```

Frontend-only logs and rebuilds:

```bash
docker compose logs -f frontend
docker compose up --build frontend
```

### Host Node Setup

If you want to run Nest directly on your machine while Postgres and Redis stay in Docker:

```bash
npm install
cp .env.example .env
docker compose up -d postgres redis
docker compose exec postgres psql -U auction -d auction -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
```

Then edit `.env`:

```env
DATABASE_HOST=localhost
REDIS_HOST=localhost
```

Run migrations and seed data:

```bash
npm run migration:run
npm run seed:local
```

Start the API and worker in separate terminals:

```bash
npm run start:dev
npm run start:worker:dev
```

Start the frontend in a third terminal. On first use, copy its browser-facing
environment example:

```bash
cp frontend/.env.example frontend/.env.local
cd frontend
npm install
npm run dev -- --port 3001
```

The host-run frontend is available at `http://localhost:3001` and expects the
host-run API at `http://localhost:3000`.

### Configuration

The root `.env` configures the API, worker, and Docker Compose frontend. The
host-run Next.js app reads `frontend/.env.local`.

| Variable | Purpose | Local example |
| --- | --- | --- |
| `DATABASE_HOST`, `DATABASE_PORT` | PostgreSQL connection location. | `postgres`, `5432` |
| `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME` | PostgreSQL credentials and database. | `auction` |
| `REDIS_HOST`, `REDIS_PORT` | BullMQ and realtime Redis connection. | `redis`, `6379` |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | JWT signing secret and token lifetime. | `replace-me-in-local-env`, `1d` |
| `CORS_ORIGIN` | Browser origin allowed by the API. | `http://localhost:3001` |
| `AUCTION_MIN_DURATION_SECONDS` | Minimum accepted auction duration. | `30` |
| `AUCTION_MAX_DURATION_SECONDS` | Maximum accepted auction duration. | `604800` |
| `AUCTION_SCANNER_INTERVAL_SECONDS` | Recovery scan interval for expired auctions. | `30` |
| `NEXT_PUBLIC_API_URL` | Browser-visible HTTP API base URL. | `http://localhost:3000` |
| `NEXT_PUBLIC_SOCKET_URL` | Browser-visible Socket.IO URL. | `http://localhost:3000` |
| `NEXT_PUBLIC_AUCTION_MIN_DURATION_SECONDS` | Browser-side minimum duration validation. | `30` |
| `NEXT_PUBLIC_AUCTION_MAX_DURATION_SECONDS` | Browser-side maximum duration validation. | `604800` |

Do not use the example JWT secret outside local development.

## Seed Data

`npm run seed:local` creates:

| Email | Username | Password |
| --- | --- | --- |
| `user1@example.com` | `user1` | `password123` |
| `user2@example.com` | `user2` | `password123` |

It also creates three card types and mints cards for the seeded users.

## Current Gaps

- Card type creation and card minting are protected, but there is no admin/role model yet.
- Auction cancellation exists as a status but is not exposed as an endpoint.
