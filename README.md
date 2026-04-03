# Finance Dashboard Backend

A backend API for a finance dashboard system built with **Node.js**, **Express**, **TypeScript**, **Prisma**, and **PostgreSQL**. It exposes REST endpoints for auth/users/records and a GraphQL endpoint (`POST /graphql`) for dashboard analytics.

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

## Architecture & Project Structure

The project follows a modular, feature-based architecture to establish clear boundaries and simplify maintenance.

```
src/
├── config/          # App config & Swagger setup (Environment validation, secrets mapping)
├── graphql/         # GraphQL schema & resolvers (Consolidates all dashboard analytics)
├── lib/             # Third-party instance singletons (e.g., Prisma client setup)
├── middleware/      # Cross-cutting concerns (Auth, RBAC, Validation, Error Handling, Request Tracing)
├── modules/         # Feature domains
│   ├── auth/        # Register, login, refresh, logout logic
│   ├── users/       # User CRUD operations (Admin-only capabilities)
│   ├── records/     # Financial record CRUD (Pagination, filtering, constraints)
│   └── dashboard/   # Dashboard service logic (Abstracted for GraphQL usage)
├── types/           # Global TypeScript interfaces and custom extensions (e.g., Express Request)
├── utils/           # Utilities (Custom AppError classes, Pagination helpers, API standard responses)
├── app.ts           # Express application scaffolding & global middleware chaining
└── server.ts        # Entry point (Handles graceful shutdown and DB connectivity checks)
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

*(Note: Admins are prevented from deleting or deactivating their own accounts to ensure system recoverability.)*

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose

### 1. Clone & Install

```bash
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
```

### 5. Start Development Server

```bash
npm run dev
```

Server runs at `http://localhost:3000`

### 6. Explore API Docs

Open `http://localhost:3000/api/docs` for Swagger UI.

Note: Swagger documents the REST API plus the single GraphQL endpoint (`POST /graphql`). Dashboard analytics are not exposed as `/api/dashboard/*` REST routes.

## Seeded Users

All seeded users share the password: `Password123!`

| Email | Role |
|-------|------|
| admin@finance.com | ADMIN |
| analyst@finance.com | ANALYST |
| viewer@finance.com | VIEWER |

## Standardized Responses

### Success Response
```json
{
  "success": true,
  "message": "Resource retrieved",
  "data": { ... },
  "pagination": { "page": 1, "limit": 20, "total": 45, "totalPages": 3 }
}
```

### Error Response Format
All errors return a consistent envelope, making it easy for frontends to handle validation or operational failures.
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "body.email": ["Invalid email address"]
  },
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

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

## Dashboard (GraphQL)

REST dashboard endpoints are replaced by a single GraphQL endpoint (`POST /graphql`).  
Below are some handy curl examples to query the dashboard data. *(Replace `YOUR_TOKEN` with a valid JWT access token).*

### 1. Dashboard Summary (All roles)
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query": "query { dashboardSummary { totalIncome totalExpenses netBalance } }"}'
```

### 2. Monthly Trends (Analyst/Admin)
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "query": "query($months: Int) { dashboardMonthlyTrends(months: $months) { month type total count } }",
    "variables": {"months": 12}
  }'
```

### 3. Recent Activity (All roles)
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query": "query { dashboardRecentActivity(limit: 5) { amount type category date } }"}'
```

## Assumptions & Tradeoffs

1. **GraphQL over REST for Analytics:** We opted for a single GraphQL `/graphql` endpoint for dashboard analytics rather than scattered REST routes. This enables clients to fetch precisely the data fragments they need (Summary + Trends) in a single round-trip, optimizing for dashboard UI rendering speeds.
2. **Soft Deletes Strategy:** Instead of hard-deleting records and users, we utilize a `deletedAt` timestamp. This preserves foreign-key relationships, retains a traceable audit history for financial queries, and avoids accidental data loss. Constraints and queries actively map to filter out `deletedAt` rows.
3. **Database Precision:** Storing monetary values as floating-point types introduces precision artifacts. We heavily utilize PostgreSQL's `Decimal(12,2)` and cast results manually back to standard JavaScript numerics securely at the service boundary.
4. **JWT Rotation:** Refresh Tokens operate on a forced rotation strategy. Single-use hash tracking on the backend minimizes the window for replay attacks since using a stolen token automatically invalidates the session sequence.
5. **Raw SQL for Dashboards:** Rather than awkwardly chaining Prisma aggregate methods, dashboard grouping routines manually execute raw query (`$queryRaw`) mapping. This is radically more performant for group-bys across dates/intervals.

## Request Tracing

Every incoming API request is tagged with a unique `X-Request-Id` (UUID). This ID traverses through the middleware boundary and is included in all application logs and error responses. It severely simplifies debugging server issues, as users can simply provide the trace ID from their network panel pointing back directly to the logged failure.

## Running Tests

Tests are integrated with docker databases to simulate true end-to-end operational readiness. 

```bash
docker-compose up -d

# Using the unified CI command to set up and run all tests seamlessly:
npm run test:ci
```

### Test Results
Below are the expected passing metrics for the test suites verifying criteria requirements:

| Test Suite | Files | Coverage / Status | Description |
|------------|-------|-------------------|-------------|
| Authentication | `auth.test.ts` | Passing | Asserts JWT rotation, passwords validation, rate-limiting |
| User Capabilities | `users.test.ts` | Passing | Validates RBAC isolation and self-deletion defenses |
| Financial Records | `records.test.ts` | Passing | Checks CRUD enforcement alongside search logic |
| Dashboard Graph | `dashboard.test.ts` | Passing | Confirms granular graphql restrictions and aggregated mapping |

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
