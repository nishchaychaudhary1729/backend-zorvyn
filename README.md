# Finance Dashboard Backend

A RESTful backend API for a finance dashboard system built with **Node.js**, **Express**, **TypeScript**, **Prisma**, and **PostgreSQL**. Features role-based access control (RBAC), JWT authentication with refresh tokens, financial record management, and dashboard analytics.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| ORM | Prisma |
| Database | PostgreSQL 16 |
| Auth | JWT (access + refresh tokens) |
| Validation | Zod |
| Docs | Swagger/OpenAPI via swagger-jsdoc |
| Testing | Jest + Supertest |
| Containerization | Docker Compose |

## Architecture

```
src/
├── config/          # App config & Swagger setup
├── lib/             # Prisma client singleton
├── middleware/       # Auth, RBAC, validation, error handling, rate limiting
├── modules/
│   ├── auth/        # Register, login, refresh, logout
│   ├── users/       # User CRUD (admin-only)
│   ├── records/     # Financial record CRUD with filtering
│   └── dashboard/   # Summary & analytics endpoints
├── types/           # TypeScript interfaces
├── utils/           # Error classes, API response helpers, pagination
├── app.ts           # Express app setup
└── server.ts        # Entry point
```

## Roles & Permissions

| Action | Viewer | Analyst | Admin |
|--------|--------|---------|-------|
| View dashboard summary | ✅ | ✅ | ✅ |
| View category totals | ✅ | ✅ | ✅ |
| View recent activity | ✅ | ✅ | ✅ |
| View monthly/weekly trends | ❌ | ✅ | ✅ |
| List/view financial records | ✅ | ✅ | ✅ |
| Create/update/delete records | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose

### 1. Clone & Install

```bash
cd backend
npm install
```

### 2. Start Database

```bash
docker-compose up -d
```

### 3. Setup Environment

```bash
cp .env.example .env
# Edit .env with your secrets for production
```

### 4. Run Migrations & Seed

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 5. Start Development Server

```bash
npm run dev
```

Server runs at `http://localhost:3000`

### 6. Explore API Docs

Open `http://localhost:3000/api/docs` for Swagger UI.

## Seeded Users

All seeded users share the password: `Password123!`

| Email | Role |
|-------|------|
| admin@finance.com | ADMIN |
| analyst@finance.com | ANALYST |
| viewer@finance.com | VIEWER |

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout (invalidate refresh token) |

### Users (Admin only, except `/me`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get current user |
| GET | `/api/users` | List users (pagination, search, filter) |
| GET | `/api/users/:id` | Get user by ID |
| POST | `/api/users` | Create user |
| PATCH | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Soft-delete user |

### Financial Records
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/records` | All roles | List records (pagination, filter, search, sort) |
| GET | `/api/records/:id` | All roles | Get record by ID |
| POST | `/api/records` | Admin | Create record |
| PATCH | `/api/records/:id` | Admin | Update record |
| DELETE | `/api/records/:id` | Admin | Soft-delete record |

**Query Parameters for GET /api/records:**
- `page`, `limit` — Pagination
- `type` — Filter by INCOME or EXPENSE
- `category` — Filter by category
- `startDate`, `endDate` — Date range filter
- `search` — Search in description and category
- `sortBy` — Sort by `date`, `amount`, or `createdAt`
- `order` — `asc` or `desc`

### Dashboard
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard/summary` | All roles | Total income, expenses, net balance |
| GET | `/api/dashboard/categories` | All roles | Category-wise totals |
| GET | `/api/dashboard/trends/monthly` | Analyst, Admin | Monthly income/expense trends |
| GET | `/api/dashboard/trends/weekly` | Analyst, Admin | Weekly trends |
| GET | `/api/dashboard/recent` | All roles | Recent activity |

## Running Tests

Requires a running test database (port 5433 via docker-compose):

```bash
docker-compose up -d

# Set test database URL
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/finance_dashboard_test npx prisma migrate deploy

# Run tests
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/finance_dashboard_test npm test
```

## Key Design Decisions

1. **Soft Deletes** — Users and records are soft-deleted (`deletedAt` timestamp) to maintain data integrity and audit trail. All queries filter out soft-deleted rows.

2. **Refresh Token Rotation** — Each refresh token use invalidates the old token and issues a new pair, mitigating token theft.

3. **Hashed Refresh Tokens** — Refresh tokens are stored as SHA-256 hashes in the database, so a database breach does not leak valid tokens.

4. **Rate Limiting** — Global rate limiter (100 req/15 min) + stricter auth-specific limiter (20 req/15 min) to prevent brute-force attacks.

5. **Zod Validation** — Schema-based input validation at the middleware level ensures clean data reaches service layer.

6. **Modular Architecture** — Each domain (auth, users, records, dashboard) is a self-contained module with its own validation, service, controller, and routes.

7. **Decimal for Money** — Financial amounts use `Decimal(12,2)` in PostgreSQL to avoid floating-point precision issues.

8. **Raw SQL for Analytics** — Dashboard aggregation queries use Prisma's `$queryRaw` for efficient GROUP BY operations that would be cumbersome with the ORM API.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `DATABASE_URL` | PostgreSQL connection string | — |
| `JWT_SECRET` | Access token signing secret | — |
| `JWT_EXPIRES_IN` | Access token TTL | 15m |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | — |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | 7d |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |

## License

MIT
