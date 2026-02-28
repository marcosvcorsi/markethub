# Local Setup Guide

## Prerequisites

- **Node.js** 20+ ([download](https://nodejs.org))
- **Docker Desktop** with Docker Compose ([download](https://docker.com/products/docker-desktop))
- **npm** (comes with Node.js)

If using WSL, ensure Docker Desktop has WSL integration enabled.

## Step 1: Clone and Install

```bash
git clone <repo-url> markethub-api
cd markethub-api
npm install
```

## Step 2: Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` if you need custom passwords. Defaults work for local development.

For Stripe integration, add your test keys:
```env
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

## Step 3: Start Infrastructure

```bash
docker-compose up -d mongodb postgres-order postgres-payment rabbitmq redis keycloak-db keycloak loki grafana
```

Wait for all services to be healthy:
```bash
docker-compose ps
```

Keycloak takes ~30 seconds to start. The `markethub` realm is auto-imported.

## Step 4: Initialize Databases

Generate Prisma clients:
```bash
npx prisma generate --schema=prisma/product-catalog/schema.prisma
npx prisma generate --schema=prisma/order/schema.prisma
npx prisma generate --schema=prisma/payment/schema.prisma
```

Push PostgreSQL schemas:
```bash
npx prisma db push --schema=prisma/order/schema.prisma
npx prisma db push --schema=prisma/payment/schema.prisma
```

MongoDB collections are created automatically on first write.

## Step 5: Seed Data (Optional)

Populate the databases with demo data (20 products, 5 orders, 5 payments):

```bash
npx prisma db seed
```

This requires Keycloak to be running (it fetches user IDs from Keycloak to link seeded orders to real users).

**Test users (pre-configured in Keycloak):**

| Username | Password | Role |
|----------|----------|------|
| testuser | testuser123 | user |
| seller | seller123 | user |
| admin | admin123 | user, admin |

## Step 6: Run Services

Open 5 terminal windows (or use a process manager):

```bash
# Terminal 1: Gateway (port 3000)
npm run start:dev gateway

# Terminal 2: Product Catalog (port 3001)
npm run start:dev product-catalog

# Terminal 3: Order (port 3002)
npm run start:dev order

# Terminal 4: Payment (port 3003)
npm run start:dev payment

# Terminal 5: Notification (port 3004)
npm run start:dev notification
```

## Step 7: Verify

| Service | URL | Credentials |
|---------|-----|-------------|
| Gateway | http://localhost:3000/health | — |
| Product Catalog Swagger | http://localhost:3001/api/docs | — |
| Order Swagger | http://localhost:3002/api/docs | — |
| Payment Swagger | http://localhost:3003/api/docs | — |
| Notification Swagger | http://localhost:3004/api/docs | — |
| Keycloak Admin | http://localhost:8080 | admin / admin |
| RabbitMQ Management | http://localhost:15672 | markethub / markethub |
| Grafana | http://localhost:3001 | admin / admin |

## Step 8: Get a JWT Token

To test authenticated endpoints, get a token from Keycloak:

```bash
curl -s -X POST http://localhost:8080/realms/markethub/protocol/openid-connect/token \
  -d "client_id=markethub-api" \
  -d "grant_type=password" \
  -d "username=testuser" \
  -d "password=testuser123" \
  | jq -r '.access_token'
```

Use this token in the `Authorization: Bearer <token>` header.

## Running Tests

```bash
# Unit tests
npm test                        # All unit tests (68 tests)
npm test -- --watch             # Watch mode
npx jest apps/product-catalog   # Single service

# End-to-end tests (requires Docker databases running)
npm run test:e2e                # All e2e tests (19 tests)
npm run test:e2e:products       # Product catalog only
npm run test:e2e:orders         # Orders only
npm run test:e2e:payments       # Payments only

# Coverage
npx jest --coverage
```

## Troubleshooting

### Docker containers won't start
- Ensure Docker Desktop is running
- Check port conflicts: `lsof -i :5672` (RabbitMQ), `lsof -i :27017` (MongoDB)
- Reset volumes: `docker-compose down -v && docker-compose up -d`

### Keycloak realm not imported
- Ensure `infra/keycloak/markethub-realm.json` exists
- Restart Keycloak: `docker-compose restart keycloak`

### Prisma client not found
- Run `npx prisma generate` for the relevant schema
- Check that the `output` path in the Prisma schema matches the import

### RabbitMQ connection refused
- Wait for RabbitMQ health check to pass
- Check URI in `.env` matches Docker Compose settings
