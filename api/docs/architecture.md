# Architecture

## Overview

MarketHub uses a microservice architecture with an API gateway pattern. Services communicate asynchronously through RabbitMQ events, following an event-driven design that enables loose coupling and independent scalability.

## Key Design Decisions

### NestJS Monorepo

All backend services live in a single NestJS monorepo. This simplifies:
- Shared code via `@markethub/*` libraries
- Consistent tooling (ESLint, Jest, TypeScript config)
- Atomic refactors across service boundaries
- Single CI/CD pipeline

Each service runs independently with its own `main.ts`, port, and database connection.

### Polyglot Persistence

Each service owns its data and uses the database best suited to its access patterns:

| Service | Database | Rationale |
|---------|----------|-----------|
| Product Catalog | MongoDB | Flexible product schemas, text search, nested arrays (images) |
| Order | PostgreSQL | Transactional integrity, relational data (order ↔ items) |
| Payment | PostgreSQL | Financial data requires ACID, Stripe session tracking |

All accessed through **Prisma 6** with separate schema files per service, generating isolated Prisma clients (`@prisma/client/product-catalog`, `@prisma/client/order`, `@prisma/client/payment`).

### Event-Driven Communication

Services never call each other directly. All inter-service communication flows through RabbitMQ:

- **Topic exchange** (`markethub.events`) routes events by type
- **DomainEvent envelope** wraps every payload with `eventId`, `eventType`, `timestamp`, `correlationId`
- **Dead Letter Queues** (DLQ) catch failed message processing
- **Idempotent handlers** prevent duplicate processing

### API Gateway

The gateway is the single entry point for all client requests:
- Validates JWT tokens against Keycloak's JWKS endpoint
- Proxies HTTP requests to downstream services
- Forwards authorization headers and correlation IDs
- Provides unified Swagger documentation

### Auth (Keycloak)

Authentication is externalized to Keycloak:
- OAuth2/OIDC with JWT access tokens
- JWKS endpoint for token verification (no shared secrets)
- Realm-level roles (`user`, `admin`)
- Pre-configured clients: `markethub-api` (bearer-only), `markethub-web` (public)

## Service Communication Flow

### Order Saga (Happy Path)

```
1. User creates order via Gateway
2. Order Service creates order (PENDING), publishes order.created
3. Payment Service receives order.created, creates payment record
4. User completes Stripe Checkout
5. Stripe webhook → Payment Service marks payment COMPLETED
6. Payment Service publishes payment.completed
7. Order Service receives payment.completed → order transitions to PAID
8. Product Catalog receives payment.completed → decrements stock
9. Notification Service receives payment.completed → notifies user
```

### Order Cancellation

```
1. User cancels order via Gateway
2. Order Service validates state machine allows cancellation
3. Order transitions to CANCELLED, publishes order.cancelled
4. Product Catalog receives order.cancelled → restores stock
```

## Project Structure

```
markethub-api/
├── apps/
│   ├── gateway/          # API Gateway (port 3000)
│   ├── product-catalog/  # Product service (port 3001)
│   ├── order/            # Order service (port 3002)
│   ├── payment/          # Payment service (port 3003)
│   └── notification/     # Notification service (port 3004)
├── libs/
│   ├── common/           # Shared DTOs, interfaces, decorators
│   ├── auth/             # JWT guard, Keycloak strategy
│   ├── messaging/        # RabbitMQ publisher, DomainEvent
│   └── logger/           # Pino logger, correlation ID
├── prisma/
│   ├── product-catalog/  # MongoDB schema
│   ├── order/            # PostgreSQL schema
│   └── payment/          # PostgreSQL schema
├── k8s/
│   ├── base/             # Kubernetes base manifests
│   └── overlays/         # Minikube and Pi overlays
├── infra/
│   ├── keycloak/         # Realm configuration
│   └── grafana/          # Dashboard provisioning
└── docker-compose.yml    # Full stack with infrastructure
```
