# Auction API

Backend API for an online auction system for virtual trading cards.

## Runtime Architecture

The project has two NestJS runtime entrypoints:

| Process | Entrypoint | Purpose |
| --- | --- | --- |
| API | `src/main.ts` | The HTTP server |
| Worker | `src/worker.ts` | The background worker that processes auction close jobs and scans for expired auctions. |

## API Surface

Swagger API docs is available at:

```text
http://localhost:3000/docs
```

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

## Local Development

### Prerequisites

- Node.js 22
- npm
- Docker Desktop or another Docker Compose compatible runtime

### Docker Compose Setup

Create a local `.env` from `.env.example`.

```bash
cp .env.example .env
docker compose up -- build
docker compose up -d postgres redis
docker compose build api worker
docker compose exec postgres psql -U auction -d auction -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
docker compose run --rm api npm run migration:run
docker compose run --rm api npm run seed:local
docker compose up api worker
```

Useful local URLs:

```text
API:     http://localhost:3000
Swagger: http://localhost:3000/docs
Adminer: http://localhost:8080
```

Adminer connection values:

```text
System:   PostgreSQL
Server:   postgres
Username: auction
Password: auction
Database: auction
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

## Seed Data

`npm run seed:local` creates:

| Email | Username | Password |
| --- | --- | --- |
| `user1@example.com` | `user1` | `password123` |
| `user2@example.com` | `user2` | `password123` |

It also creates three card types and mints cards for the seeded users.

## Current Gaps

- No frontend is included yet.
- Card type creation and card minting are protected, but there is no admin/role model yet.
- Auction cancellation exists as a status but is not exposed as an endpoint.
