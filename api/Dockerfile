# Multi-stage Dockerfile for NestJS monorepo applications
# Usage: docker build --build-arg APP_NAME=gateway -t markethub-gateway .

# --- Build stage ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG APP_NAME=gateway

# Generate Prisma clients BEFORE build (code imports from @prisma/client/*)
RUN npx prisma generate --schema=prisma/product-catalog/schema.prisma && \
    npx prisma generate --schema=prisma/order/schema.prisma && \
    npx prisma generate --schema=prisma/payment/schema.prisma

RUN npx nest build ${APP_NAME}

# --- Production stage ---
FROM node:20-alpine AS production
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package*.json ./
RUN npm ci --omit=dev

# Copy full tsc output (includes apps/ and libs/ subdirectories)
ARG APP_NAME=gateway
COPY --from=builder /app/dist/apps/${APP_NAME} ./dist

# Copy Prisma clients from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy Prisma schema files (needed by init containers for db push)
COPY --from=builder /app/prisma ./prisma

USER appuser

EXPOSE 3000

ENV APP_NAME=${APP_NAME}
CMD node dist/apps/${APP_NAME}/src/main.js
