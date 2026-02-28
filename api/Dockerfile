# Multi-stage Dockerfile for NestJS monorepo applications
# Usage: docker build --build-arg APP_NAME=gateway -t markethub-gateway .

# --- Build stage ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG APP_NAME=gateway
RUN npx nest build ${APP_NAME}

# Generate Prisma clients if schema files exist
RUN if [ -d "prisma/product-catalog" ]; then npx prisma generate --schema=prisma/product-catalog/schema.prisma; fi
RUN if [ -d "prisma/order" ]; then npx prisma generate --schema=prisma/order/schema.prisma; fi
RUN if [ -d "prisma/payment" ]; then npx prisma generate --schema=prisma/payment/schema.prisma; fi

# --- Production stage ---
FROM node:20-alpine AS production
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package*.json ./
RUN npm ci --omit=dev

# Copy built application
ARG APP_NAME=gateway
COPY --from=builder /app/dist/apps/${APP_NAME} ./dist

# Copy Prisma clients from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy Prisma schema files (needed by init containers for db push)
COPY --from=builder /app/prisma ./prisma

USER appuser

EXPOSE 3000

CMD ["node", "dist/main.js"]
