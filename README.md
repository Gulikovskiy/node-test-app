# node-test-app

A production-grade REST API for task management, built to demonstrate fullstack backend engineering fundamentals: relational data modeling, JWT authentication, caching, containerization, testing, and AWS deployment with CI/CD.

## Tech stack

- **Runtime**: Node.js 20 + TypeScript
- **Framework**: Express 5
- **Database**: PostgreSQL via Drizzle ORM — chosen over Prisma for its SQL-proximity, smaller bundle size, and native pgvector support
- **Caching**: Redis (Upstash in production) via ioredis
- **Auth**: JWT + argon2 password hashing
- **Testing**: Vitest + Supertest (integration tests against a real database)
- **Containerization**: Docker + docker-compose
- **Deployment**: AWS EC2 + RDS (PostgreSQL) + Upstash Redis, eu-north-1
- **CI/CD**: GitHub Actions — pushes to `main` automatically deploy to EC2

## Architecture

```
Client
  │
  ▼
EC2 (Express API, pm2)
  │         │
  ▼         ▼
RDS       Upstash
(PostgreSQL) (Redis)
```

Request flow:
- All task routes require a valid JWT (`Authorization: Bearer <token>`)
- `GET /tasks` checks Redis first; on miss, queries Postgres and caches the result with a 60s TTL
- Write operations (create, update, delete) invalidate the cache for that user
- If Redis is unavailable, requests fall through to Postgres — cache is never on the critical path

## Features

- User registration and login with secure password hashing (argon2)
- JWT-based authentication with 1-hour token expiry
- Full CRUD for tasks, scoped to the authenticated user
- Per-user data isolation enforced at the SQL level (`WHERE user_id = ?`) — not just in application code
- Redis caching with graceful degradation
- Migrations managed via Drizzle Kit — schema changes are versioned and applied automatically on startup
- Integration tests covering auth flows, task ownership, and cross-user isolation
- Dockerized for local development with a single `docker compose up`

## Security decisions

- `404` rather than `403` when a user requests another user's resource — avoids leaking whether the resource exists
- Generic `401` on login failure regardless of whether the email or password was wrong — prevents user enumeration
- Internal error messages never exposed to clients — 500 responses return a generic message only
- JWT secret and DB credentials read from environment variables, never hardcoded

## Getting started

### Prerequisites

- Node.js 20+
- Docker (for local Postgres + Redis)

### Local setup

```bash
git clone https://github.com/Gulikovskiy/node-test-app
cd node-test-app
npm install
```

Copy the example env file and fill in the values:

```bash
cp .env.example .env
```

Start Postgres and Redis:

```bash
docker compose up postgres redis -d
```

Run migrations:

```bash
npm run db:migrate
```

Start the dev server:

```bash
npm run dev
```

The API is available at `http://localhost:3000`.

### Running tests

Start the test database first:

```bash
docker compose up postgres-test -d
```

Then:

```bash
npm test
```

## API reference

### Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login, returns a JWT |

### Tasks

All task routes require `Authorization: Bearer <token>`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/tasks` | List all tasks for the authenticated user |
| GET | `/tasks/:id` | Get a single task |
| POST | `/tasks` | Create a task |
| PATCH | `/tasks/:id` | Update a task (partial) |
| DELETE | `/tasks/:id` | Delete a task |

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Returns `{ "status": "ok" }` |

### Request/response shape

**Register / Login**
```json
// POST /auth/register
{ "email": "user@example.com", "password": "securepassword" }

// Response 201
{ "data": { "id": 1, "email": "user@example.com" } }
```

```json
// POST /auth/login
{ "email": "user@example.com", "password": "securepassword" }

// Response 200
{ "data": { "token": "<jwt>" } }
```

**Tasks**
```json
// POST /tasks
{ "name": "Buy groceries", "description": "Milk, eggs, bread" }

// Response 201
{ "data": { "id": 1, "name": "Buy groceries", "description": "Milk, eggs, bread", "userId": 1 } }
```

Errors always follow this shape:
```json
{ "error": { "message": "Task not found" } }
```

## Deployment

The API runs on an AWS EC2 instance (`t3.micro`, eu-north-1) managed by pm2.

- **Database**: AWS RDS PostgreSQL 16, private subnet, SSL required, not publicly accessible
- **Cache**: Upstash Redis (serverless)
- **CI/CD**: GitHub Actions workflow (`.github/workflows/deploy.yml`) SSHs into EC2 on every push to `main`, pulls the latest code, rebuilds, and restarts the process via pm2
- **Migrations**: Run automatically on startup via Drizzle's programmatic migrator

## Environment variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `DATABASE_URL` | PostgreSQL connection string |
| `DATABASE_URL_TEST` | Test database connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Secret used to sign JWTs |