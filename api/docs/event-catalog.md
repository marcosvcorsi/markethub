# Event Catalog

All events flow through the `markethub.events` RabbitMQ topic exchange wrapped in a `DomainEvent<T>` envelope.

## Envelope Format

```typescript
interface DomainEvent<T> {
  eventId: string;       // UUID, unique per event
  eventType: string;     // Routing key (e.g., "order.created")
  timestamp: string;     // ISO 8601
  correlationId: string; // UUID, traces request across services
  payload: T;            // Event-specific data
}
```

## Events

### `order.created`

Published when a new order is placed.

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | `string` | UUID of the created order |
| `userId` | `string` | User who placed the order |
| `totalAmount` | `number` | Order total in USD |
| `items` | `Array<{productId, quantity}>` | Ordered items |

**Producer:** Order Service
**Consumers:**
- Payment Service → creates payment record (PENDING)
- Notification Service → sends order confirmation

---

### `order.cancelled`

Published when an order is cancelled by the user.

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | `string` | UUID of the cancelled order |
| `reason` | `string` | Cancellation reason |
| `items` | `Array<{productId, quantity}>` | Items to restore stock |

**Producer:** Order Service
**Consumers:**
- Product Catalog Service → restores stock for each item

---

### `payment.processing`

Published when a payment record is created and awaiting Stripe checkout.

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | `string` | Associated order ID |
| `amount` | `number` | Payment amount in USD |

**Producer:** Payment Service
**Consumers:** (informational, logged)

---

### `payment.completed`

Published when Stripe confirms successful payment (webhook: `checkout.session.completed`).

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | `string` | Associated order ID |
| `paymentId` | `string` | UUID of the payment record |
| `amount` | `number` | Paid amount in USD |

**Producer:** Payment Service
**Consumers:**
- Order Service → transitions order to PAID
- Product Catalog Service → decrements stock for each ordered item
- Notification Service → sends payment confirmation

---

### `payment.failed`

Published when Stripe checkout expires or payment fails (webhook: `checkout.session.expired`).

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | `string` | Associated order ID |
| `reason` | `string` | Failure reason |

**Producer:** Payment Service
**Consumers:**
- Order Service → transitions order to FAILED
- Notification Service → sends failure notification

---

## Queue Naming Convention

Each consumer has a durable queue named `{service}.{event-type}`:

| Queue | Service | Event |
|-------|---------|-------|
| `payment.order-created` | Payment | order.created |
| `notification.order-created` | Notification | order.created |
| `product-catalog.payment-completed` | Product Catalog | payment.completed |
| `product-catalog.order-cancelled` | Product Catalog | order.cancelled |
| `order.payment-completed` | Order | payment.completed |
| `order.payment-failed` | Order | payment.failed |
| `notification.payment-completed` | Notification | payment.completed |
| `notification.payment-failed` | Notification | payment.failed |

## Dead Letter Queues

Failed messages are routed to `{queue}.dlq` via the `markethub.events.dlx` dead letter exchange for later inspection and retry.
