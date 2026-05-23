# Flowforge Product Demo API

A small, production-structured sample API for a **child toys catalog**. It demonstrates a feature-based Express + MongoDB (Mongoose) + TypeScript layout with validation, pagination, filtering, sorting, structured errors, and seed data.

## Tech stack

- Node.js (>=18)
- Express.js
- MongoDB + Mongoose
- TypeScript
- Zod (request validation)
- dotenv (environment variables)
- cors, morgan, helmet (security headers)
- express-rate-limit
- nodemon + tsx (local development)

## Folder structure

```
backend/product-demo/
  src/
    config/
      env.ts
      db.ts
    features/
      products/
        product.model.ts
        product.types.ts
        product.schema.ts
        product.repository.ts
        product.service.ts
        product.controller.ts
        product.routes.ts
        product.seed.ts
    middlewares/
      error-handler.ts
      not-found.ts
      validate-request.ts
      rate-limiter.ts
      request-id.ts
    types/
      express.d.ts
    utils/
      api-error.ts
      api-response.ts
      async-handler.ts
      logger.ts
      slugify.ts
      query-builder.ts
    app.ts
    server.ts
  scripts/
    seed.ts
  .env.example
  package.json
  tsconfig.json
  README.md
```

## Prerequisites

- Node.js 18+
- MongoDB running locally (or update `MONGODB_URI`)

## Setup

```bash
cd backend/product-demo
npm install
cp .env.example .env
```

Edit `.env` if your MongoDB connection string differs.

## Run

Development (auto-reload):

```bash
npm run dev
```

Production build + start:

```bash
npm run build
npm start
```

## Seed database

This inserts **15** demo toy products (and clears the `products` collection first):

```bash
npm run seed
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | HTTP port |
| `NODE_ENV` | `development` | Runtime mode |
| `MONGODB_URI` | `mongodb://localhost:27017/flowforge_product_db` | Mongo connection string |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 minutes) |
| `RATE_LIMIT_MAX` | `100` | Max requests per IP per window |

## API endpoints

### Health

- `GET /health`

### Products (v1)

Base path: `/api/v1/products`

| Method | Path | Description |
|---|---|---|
| `POST` | `/` | Create a product |
| `GET` | `/` | List products (pagination, filters, sorting, search) |
| `GET` | `/:id` | Get a product by Mongo ObjectId |
| `PATCH` | `/:id` | Partial update |
| `DELETE` | `/:id` | Hard delete (returns `204 No Content`) |

## Example query params (GET list)

All query params are optional unless noted.

- **Pagination**: `page`, `limit` (max `100`, default `10`)
- **Sorting**: `sortBy` (`createdAt` | `price` | `name` | `rating`), `sortOrder` (`asc` | `desc`)
  - Defaults: `sortBy=createdAt`, `sortOrder=desc`
- **Filters**:
  - `category` (one of the allowed categories)
  - `ageGroup` (`0-2` | `3-5` | `6-8` | `9-12`)
  - `brand`
  - `isActive` (`true` | `false`)
    - If omitted, the API defaults to **active products only** (`isActive=true`)
  - `minPrice`, `maxPrice`
- **Search**: `search` (uses MongoDB text index on `name` + `description`)

### Example requests

List first page:

```bash
curl "http://localhost:5000/api/v1/products?page=1&limit=5"
```

Filter + sort:

```bash
curl "http://localhost:5000/api/v1/products?category=building-blocks&sortBy=price&sortOrder=asc"
```

Search + price range:

```bash
curl "http://localhost:5000/api/v1/products?search=wooden&minPrice=10&maxPrice=40"
```

Include inactive products:

```bash
curl "http://localhost:5000/api/v1/products?isActive=false"
```

Create:

```bash
curl -X POST http://localhost:5000/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Plush Duck",
    "description": "A cheerful duck plush for bathtime stories and pretend adventures at home.",
    "category": "soft-toys",
    "ageGroup": "0-2",
    "price": 12.99,
    "stock": 25,
    "brand": "DemoBrand",
    "material": "Polyester plush",
    "tags": ["plush", "duck"],
    "images": ["https://placehold.co/600x400/png?text=Duck"]
  }'
```

## Example responses

### List products

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  },
  "data": []
}
```

### Single product

```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {}
}
```

### Validation error

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {}
  }
}
```

## Architecture decisions (short)

- **Feature folders** keep product domain code together (routes → controller → service → repository → model).
- **Thin controllers** keep HTTP concerns separate from business rules (service) and persistence (repository).
- **Zod** validates inputs early; controllers mostly delegate.
- **Centralized error handler** maps predictable failures to stable JSON (no stack traces in responses).
- **MongoDB indexes** support common filters and unique `slug` constraints, plus text search for keyword queries.

## Assumptions

- MongoDB is reachable at `MONGODB_URI` (defaults to local).
- This is a **demo** API: no authentication/authorization.
- `DELETE` returns **204** with an empty body (no JSON envelope).
- Image fields are **URLs/strings** (no file upload pipeline).
