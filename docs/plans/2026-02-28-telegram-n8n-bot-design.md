# MarketHub Telegram Bot via n8n - Design Document

**Date**: 2026-02-28
**Status**: Draft - pending completion of sections 3-5

## Goals

- **Primary**: Portfolio wow-factor + n8n workflow showcase
- **Secondary**: Functional Telegram shopping bot
- **Channel**: Telegram only (free bot API, no verification needed)
- **AI**: OpenAI GPT-4o-mini via n8n AI Agent node for product search + recommendations
- **Scope**: Cart/checkout/notifications remain button-driven; AI handles natural language product discovery

## Section 1: Architecture Overview

```
User (Telegram)
    |
    v
Telegram Bot API  --webhook-->  n8n Instance
                                    |
                        +-----------+---------------+
                        v           v               v
                   AI Agent    Structured       RabbitMQ
                   Workflow    Command           Listener
                   (OpenAI)    Workflows         Workflow
                        |           |               |
                        v           v               v
                   MarketHub Gateway (port 3000)    Telegram
                   +----+-----+                     Send Message
                   v         v
              product-   order/payment
              catalog    services
```

### Message Flow

1. **Telegram -> n8n**: A single webhook workflow receives all Telegram messages
2. **Router**: Detects if the message is a callback query (button press) or text. Text goes to the AI agent for natural language understanding. Button callbacks go to structured command workflows (cart add, cart view, checkout, etc.)
3. **AI Agent**: OpenAI with tools/functions that map to MarketHub API calls - `searchProducts(query, category, minPrice, maxPrice)`, `getProductDetails(id)`, `getRecommendations(category)`. Returns formatted product cards with inline "Add to Cart" buttons.
4. **Structured flows**: Button-driven - add to cart, view cart, remove from cart, checkout (generates Stripe payment link), view orders.
5. **Notifications**: Separate n8n workflow subscribes to RabbitMQ events and sends Telegram messages to linked users.

### State Management

Cart + user linking stored in **Redis** (already in docker-compose, currently unused).

## Section 2: n8n Workflows

There are **5 workflows** total.

### Workflow 1: Telegram Router (entry point)

- **Trigger**: Telegram webhook (all messages + callback queries)
- **Logic**: Switch node checks message type:
  - Text message -> route to AI Agent workflow (via Execute Workflow node)
  - Callback query with `action:cart_add:PRODUCT_ID` -> route to Cart workflow
  - Callback query with `action:cart_view` -> route to Cart workflow
  - Callback query with `action:checkout` -> route to Checkout workflow
  - Callback query with `action:orders` -> route to Orders workflow
  - `/start` command -> send welcome message with menu buttons
  - `/link USER_EMAIL` -> route to User Linking workflow

### Workflow 2: AI Product Agent

- **Trigger**: Called by Router (Execute Workflow)
- **AI Agent node**: OpenAI GPT-4o-mini (cheap, fast) with system prompt:
  > "You are MarketHub's shopping assistant. Help users find products. You have tools to search products and get recommendations. Always respond with product details formatted for Telegram. Be concise."
- **Tools available to the agent**:
  - `searchProducts(q, category, minPrice, maxPrice)` -> HTTP Request to `GET /products/products?q=...`
  - `getProduct(id)` -> HTTP Request to `GET /products/products/:id`
  - `getRecommendations(category)` -> HTTP Request to `GET /products/products?category=...&sortBy=NEWEST&limit=4`
- **Output formatting**: Takes API response, formats as Telegram message with product name, price, stock status, and an inline keyboard button "Add to Cart" per product
- **Conversation memory**: n8n's AI Agent node has built-in window memory (last N messages per chat ID)

### Workflow 3: Cart Management

- **Trigger**: Called by Router (Execute Workflow)
- **Actions** (based on callback data):
  - `cart_add:{productId}` -> Fetch product from API, store `{productId, name, price, quantity}` in Redis hash `cart:{chatId}`, send confirmation
  - `cart_view` -> Read Redis hash `cart:{chatId}`, format as item list with quantity +/- buttons and "Checkout" button
  - `cart_remove:{productId}` -> Remove from Redis hash
  - `cart_qty:{productId}:{delta}` -> Increment/decrement quantity in Redis
- **Redis keys**: `cart:{telegramChatId}` -> hash of `productId -> JSON{name, price, qty}`

### Workflow 4: Checkout & Orders

- **Trigger**: Called by Router (Execute Workflow)
- **Checkout flow**:
  1. Read cart from Redis
  2. Requires linked MarketHub account (check Redis `user:{chatId}`)
  3. Call `POST /orders/orders` with cart items (using linked user's auth token)
  4. Call `POST /payments/payments/checkout` with orderId + success/cancel URLs
  5. Send Stripe payment link as Telegram message
  6. Clear cart in Redis
- **Order status**: `action:orders` -> Call `GET /orders/orders` -> format as list with status badges
- **Auth**: Stored JWT token in Redis `user:{chatId}:token` (from linking flow)

### Workflow 5: Event Notifications

- **Trigger**: RabbitMQ trigger node, subscribes to `markethub.events` exchange
- **Routing keys**: `order.created`, `payment.completed`, `payment.failed`
- **Logic**: Extract userId from event payload -> look up Telegram chatId in Redis `userlink:{userId}` -> format notification message -> send via Telegram node
- **Message templates**:
  - Order created: "Your order #ID has been placed! Total: $X"
  - Payment completed: "Payment confirmed for order #ID"
  - Payment failed: "Payment failed for order #ID. Try again?"

## Section 3: User Linking & Authentication

> TODO: Design how Telegram users link to MarketHub accounts and how auth tokens are managed.

## Section 4: Infrastructure Changes

> TODO: Define n8n service in docker-compose, Redis key schema, Telegram bot setup, environment variables.

## Section 5: Known Gaps to Fix First

> TODO: Before building the bot, these existing MarketHub issues should be addressed:
> - Keycloak Docker networking (browser redirects to `keycloak:8080`)
> - Payment checkout hardcoded empty items
> - Notification userId placeholder
> - Email not wired to listeners

---

## Existing MarketHub Context

### Current Backend Services

| Service | Port | Database | Purpose |
|---------|------|----------|---------|
| gateway | 3000 | none | JWT validation + HTTP proxy |
| product-catalog | 3001 | MongoDB | CRUD for products, stock management |
| order | 3002 | PostgreSQL | Order lifecycle, state machine |
| payment | 3003 | PostgreSQL | Stripe checkout + webhook |
| notification | 3004 | Redis | WebSocket notifications + (unwired) email |

### Current Frontend (Next.js)

Full ecommerce flow: browse, search, filter, product detail, cart (Zustand/localStorage), checkout via Stripe, order history, real-time notifications via Socket.IO.

### Event Bus (RabbitMQ)

Exchange: `markethub.events` (topic)

| Event | Producer | Consumers |
|-------|----------|-----------|
| `order.created` | order | payment, notification, (new: n8n) |
| `order.cancelled` | order | product-catalog |
| `payment.processing` | payment | (none currently) |
| `payment.completed` | payment | order, product-catalog, notification, (new: n8n) |
| `payment.failed` | payment | order, notification, (new: n8n) |

### n8n-builder Workspace

Located at `/home/marcos/dev/repositories/n8n-builder/`. Ready-to-use with MCP tools, CLAUDE.md guidance, but **zero workflows built yet**. Has access to 1,084+ n8n nodes and 2,709 workflow templates.
