# MarketHub

A full-stack ecommerce marketplace inspired by Mercado Livre, built with **microservice architecture** and a modern **Next.js** frontend.

```
┌──────────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js 15)                  │
└─────────────────────────┬────────────────────────────────┘
                          │ HTTPS
                          ▼
┌──────────────────────────────────────────────────────────┐
│                    API GATEWAY (NestJS)                   │
│         JWT validation, routing, request proxy           │
└────┬──────────┬──────────┬──────────┬──────────┬─────────┘
     │          │          │          │          │
     ▼          ▼          ▼          ▼          ▼
┌────────┐┌──────────┐┌────────┐┌─────────┐┌──────────────┐
│  Auth  ││ Product  ││ Order  ││ Payment ││ Notification │
│Keycloak││ Catalog  ││Service ││ Service ││   Service    │
└────────┘└────┬─────┘└───┬────┘└────┬────┘└──────┬───────┘
               │          │          │             │
          ┌────▼───┐ ┌───▼────┐ ┌───▼────┐  ┌────▼────┐
          │MongoDB │ │Postgres│ │Postgres│  │  Redis  │
          └────────┘ └────────┘ └────────┘  └─────────┘

               ┌─────────────┐    ┌─────────────┐
               │  RabbitMQ   │    │ Loki+Grafana│
               │ (event bus) │    │  (logging)  │
               └─────────────┘    └─────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS, shadcn/ui |
| Backend | NestJS (monorepo, 5 microservices) |
| Auth | Keycloak (OAuth2/OIDC + JWKS) |
| Databases | MongoDB (products), PostgreSQL (orders, payments) |
| ORM | Prisma 6 (multi-schema, polyglot persistence) |
| Messaging | RabbitMQ (topic exchange, DLQ) |
| Payments | Stripe (Checkout Sessions, webhooks) |
| Notifications | Resend (email), Socket.IO (WebSocket) |
| Logging | Pino + Loki + Grafana |
| Deployment | Docker Compose, Kubernetes (Kustomize) |

## Project Structure

```
markethub/
├── api/          # NestJS backend (5 microservices + gateway)
├── web/          # Next.js 15 frontend
└── README.md
```

- **[api/](api/)** — Backend services, infrastructure config, Kubernetes manifests
- **[web/](web/)** — Frontend application with SSR, auth, and responsive UI

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose

### 1. Start infrastructure

```bash
cd api
cp .env.example .env
npm install
docker-compose up -d mongodb postgres-order postgres-payment rabbitmq redis keycloak-db keycloak loki grafana
```

### 2. Initialize databases

```bash
npx prisma generate --schema=prisma/product-catalog/schema.prisma
npx prisma generate --schema=prisma/order/schema.prisma
npx prisma generate --schema=prisma/payment/schema.prisma
npx prisma db push --schema=prisma/order/schema.prisma
npx prisma db push --schema=prisma/payment/schema.prisma
```

### 3. Seed demo data (optional)

```bash
npx prisma db seed
```

### 4. Run backend

```bash
npm run start:dev gateway          # port 3000
npm run start:dev product-catalog  # port 3001
npm run start:dev order            # port 3002
npm run start:dev payment          # port 3003
npm run start:dev notification     # port 3004
```

### 5. Run frontend

```bash
cd ../web
npm install
npm run dev                        # port 3000 (or next available)
```

### 6. Access

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Swagger (per service) | http://localhost:300{1-4}/api/docs |
| Keycloak Admin | http://localhost:8080 (admin/admin) |
| RabbitMQ | http://localhost:15672 (markethub/markethub) |
| Grafana | http://localhost:3001 (admin/admin) |

**Test users (pre-configured in Keycloak):**

| Username | Password | Role |
|----------|----------|------|
| testuser | testuser123 | user |
| seller | seller123 | user |
| admin | admin123 | user, admin |

## Deployment

```bash
# Docker Compose (full stack)
cd api && docker-compose up --build

# Kubernetes (Minikube)
cd api && ./k8s/deploy.sh minikube

# Kubernetes (Raspberry Pi / K3s)
cd api && kubectl apply -k k8s/overlays/pi/
```

See [api/docs/deployment.md](api/docs/deployment.md) for detailed guides.

## Testing

```bash
cd api

# Unit tests (68 tests)
npm test

# E2E tests (19 tests, requires Docker databases)
npm run test:e2e
```

## Documentation

- [Architecture](api/docs/architecture.md) — System design and patterns
- [Event Catalog](api/docs/event-catalog.md) — Complete event reference
- [Local Setup](api/docs/local-setup.md) — Step-by-step development guide
- [Deployment](api/docs/deployment.md) — Docker Compose, Minikube, K3s guides

## License

MIT
