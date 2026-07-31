# Postgres Performance Lab

## Stack

- **Runtime:** Node.js 26.5.0 (managed via [fnm](https://github.com/Schniz/fnm)), TypeScript 6
- **API:** [Fastify 5](https://fastify.dev/)
- **Database client:** [`pg`](https://node-postgres.com/) (node-postgres), via [`@fastify/postgres`](https://github.com/fastify/fastify-postgres)
- **Database:** PostgreSQL 18.4, with native `uuidv7()` primary keys
- **Migrations:** [dbmate](https://github.com/amacneil/dbmate) — raw `.sql` files, no ORM migration DSL
- **Connection pooling:** [PgBouncer](https://www.pgbouncer.org/) (transaction mode)
- **Config validation:** [`@fastify/env`](https://github.com/fastify/fastify-env) (JSON Schema)
- **Request/response validation:** [TypeBox](https://github.com/sinclairzx81/typebox) via `@fastify/type-provider-typebox`
- **Load testing:** [k6](https://k6.io/)
- **Containerization:** Docker Compose (app + Postgres + PgBouncer)
- **Linting/formatting:** ESLint 9 (flat config, type-aware rules) + `eslint-plugin-security` + Prettier

## Architecture

Feature code is organized by domain module, following a three-layer
pattern inspired by NestJS's structure, adapted for plain Fastify:

```
src/
  config/
    config.plugin.ts             ← @fastify/env config, validated at startup
    env.schema.ts                ← JSON Schema + EnvConfig type
  db/
    db.plugin.ts                 ← @fastify/postgres pool, routed through PgBouncer
  modules/
    categories/
      categories.repository.ts   ← data access only: raw SQL, parameterized queries
      categories.service.ts      ← business logic (uniqueness rules, orchestration)
      categories.controller.ts   ← Fastify plugin: routes, request/response handling
      categories.schemas.ts      ← TypeBox schemas + inferred TS types
      categories.module.ts       ← wires the three layers, exports one plugin
    v1.ts                        ← aggregates all v1 modules under one prefix
  plugins/
    config.plugin.ts             ← @fastify/env config, validated at startup
    db.plugin.ts                 ← @fastify/postgres pool, routed through PgBouncer
  types/
    fastify.d.ts                 ← FastifyInstance type augmentations, centralized
  app.ts                         ← builds the Fastify instance (no .listen())
  index.ts                       ← entrypoint: starts the server, handles graceful shutdown
```

**Layering rule:** repositories only touch the database (parameterized SQL,
no business logic); services hold business rules and call one or more
repositories; controllers own HTTP concerns only (status codes, request/response
shaping) and know nothing about SQL.

**API versioning:** all routes are mounted under `/api/v1` via a single
aggregator plugin (`modules/v1.ts`), so bumping to `/api/v2` later is a
one-line addition, not a per-module change.

## Database schema

| Table | Purpose |
|---|---|
| `categories` | Self-referencing hierarchy — recursive CTE exercises |
| `products` | `jsonb` attributes column, nullable `category_id` (NULL-handling exercises) |
| `inventory` | Composite PK, hot-updated rows — contention/write-skew exercises |
| `customers` | Unindexed `email`, soft-delete `deleted_at`, `char(2)` country code (type-mismatch index-miss demo) |
| `orders` | The core workhorse: range queries, status churn, partitioning target, planned `EXCLUDE` constraint for courier double-booking |
| `order_items` | Largest table; composite PK for Index Only Scan exercises |
| `outbox` | Transactional outbox / job queue — `SELECT ... FOR UPDATE SKIP LOCKED` exercises |

## Seed data

A custom, idempotent seeder (`db/seed.sql` + `src/scripts/seed.ts`) generates
realistic, **skewed** data entirely in set-based SQL (no per-row loops):

- 50,000 customers, 5,000 products, 500,000 orders, ~800,000 order items,
  100,000 outbox events
- Orders are skewed toward a "hot" pool of 500 repeat customers (75% of
  orders), with 5% guest checkouts and dates biased toward recent activity
- Full run takes under 20 seconds

## Local development environment

- **Windows**, Node managed via `fnm`
- **Docker Compose** runs Postgres, PgBouncer, and (optionally) the app itself
- Two separate connection strings are used for two different purposes:
  - `DATABASE_URL` — direct to Postgres, used by migrations and the seed script
  - `PGBOUNCER_URL` — routed through PgBouncer, used by the running app
- Config validated at startup via `@fastify/env`; missing or malformed env
  vars fail loudly before the server starts

## Setup

```bash
# install dependencies
npm install

# start containers
docker compose up -d --build

# apply migrations
npx dbmate --wait up

# seed the database
npm run db:seed

# run the app locally
npm run dev
```
