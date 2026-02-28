# MarketHub API

A Mercado Livre-inspired ecommerce marketplace backend built with **microservice architecture**. This project demonstrates event-driven design, polyglot persistence, and production-grade patterns using NestJS.

## Architecture

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
│  Auth  ││ Product/ ││ Order  ││ Payment ││ Notification │
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
| Runtime | Node.js 20, TypeScript |
| Framework | NestJS (monorepo) |
| Auth | Keycloak (OAuth2/OIDC + JWKS) |
| Databases | MongoDB (products), PostgreSQL (orders, payments) |
| ORM | Prisma 6 (multi-schema, polyglot) |
| Messaging | RabbitMQ (topic exchange, DLQ) |
| Payments | Stripe (Checkout Sessions, webhooks) |
| Notifications | Resend (email), Socket.IO (WebSocket) |
| Logging | Pino + Loki + Grafana |
| Deployment | Docker Compose, Kubernetes (Kustomize) |

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm

### 1. Clone and install

```bash
git clone <repo-url> markethub-api
cd markethub-api
npm install
```

### 2. Start infrastructure

```bash
cp .env.example .env
docker-compose up -d mongodb postgres-order postgres-payment rabbitmq redis keycloak-db keycloak loki grafana
```

### 3. Generate Prisma clients and push schemas

```bash
npx prisma generate --schema=prisma/product-catalog/schema.prisma
npx prisma generate --schema=prisma/order/schema.prisma
npx prisma generate --schema=prisma/payment/schema.prisma
npx prisma db push --schema=prisma/order/schema.prisma
npx prisma db push --schema=prisma/payment/schema.prisma
```

### 4. Run services

```bash
# In separate terminals
npm run start:dev gateway
npm run start:dev product-catalog
npm run start:dev order
npm run start:dev payment
npm run start:dev notification
```

### 5. Access

- **Gateway**: http://localhost:3000
- **Swagger (per service)**: http://localhost:300{1-4}/api/docs
- **Keycloak Admin**: http://localhost:8080 (admin/admin)
- **RabbitMQ Management**: http://localhost:15672 (markethub/markethub)
- **Grafana**: http://localhost:3001 (admin/admin)

## Services

| Service | Port | Database | Description |
|---------|------|----------|-------------|
| Gateway | 3000 | — | API entry point, HTTP proxy, JWT validation |
| Product Catalog | 3001 | MongoDB | Product CRUD, search, stock management |
| Order | 3002 | PostgreSQL | Order lifecycle with state machine |
| Payment | 3003 | PostgreSQL | Stripe Checkout integration |
| Notification | 3004 | — | Email (Resend) + WebSocket notifications |

## Shared Libraries

| Library | Purpose |
|---------|---------|
| `@markethub/common` | DTOs, event interfaces, decorators, constants |
| `@markethub/auth` | JWT guard, Keycloak JWKS strategy, `@Public()` / `@Roles()` |
| `@markethub/messaging` | RabbitMQ publisher, DomainEvent envelope |
| `@markethub/logger` | Pino structured logging, correlation ID middleware |

## Event-Driven Architecture

Services communicate via RabbitMQ topic exchange (`markethub.events`):

```
order.created    → Payment (create payment record)
                 → Notification (notify user)

order.cancelled  → Product Catalog (restore stock)

payment.completed → Order (transition to PAID)
                  → Product Catalog (decrement stock)
                  → Notification (notify user)

payment.failed   → Order (transition to FAILED)
                 → Notification (notify user)
```

## Order State Machine

```
PENDING → PAYMENT_PROCESSING → PAID → SHIPPED → DELIVERED
  ↓              ↓               ↓
CANCELLED      FAILED          CANCELLED
               (→ PENDING retry)
```

## Testing

```bash
npm test              # Run all unit tests
npm test -- --watch   # Watch mode
npx jest apps/order   # Run tests for specific service
```

## Deployment

### Docker Compose (Full Stack)

```bash
docker-compose up --build
```

### Kubernetes (Minikube)

```bash
minikube start
kubectl apply -k k8s/overlays/minikube/
```

### Kubernetes (Raspberry Pi / K3s)

```bash
kubectl apply -k k8s/overlays/pi/
```

See [docs/deployment.md](docs/deployment.md) for detailed guides.

## Documentation

- [Architecture](docs/architecture.md) — System design and patterns
- [Event Catalog](docs/event-catalog.md) — Complete event reference
- [Local Setup](docs/local-setup.md) — Step-by-step development guide
- [Deployment](docs/deployment.md) — Docker Compose, Minikube, K3s guides

## License

MIT
