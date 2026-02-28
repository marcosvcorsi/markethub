# MarketHub Kubernetes Deployment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the Kustomize-based Kubernetes deployment so all services are deployable with `kubectl apply -k k8s/overlays/minikube`.

**Architecture:** Fix existing k8s manifests (secrets, health checks, init containers), add missing services (Keycloak, frontend, Loki, Grafana), update overlays and deploy script. Portfolio-grade — no TLS, HPA, or network policies.

**Tech Stack:** Kubernetes, Kustomize, Docker (multi-stage), NestJS, Next.js, Prisma, Keycloak, Loki, Grafana

---

### Task 1: Create Secrets Manifest

**Files:**
- Create: `k8s/base/secrets.yaml`

**Step 1: Create the secrets file**

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: markethub-secrets
  namespace: markethub
type: Opaque
stringData:
  # Database credentials
  MONGO_PASSWORD: "markethub"
  POSTGRES_ORDER_PASSWORD: "markethub"
  POSTGRES_PAYMENT_PASSWORD: "markethub"
  RABBITMQ_PASSWORD: "markethub"
  KEYCLOAK_DB_PASSWORD: "keycloak"
  KEYCLOAK_ADMIN_PASSWORD: "admin"
  # External services
  STRIPE_SECRET_KEY: "sk_test_placeholder"
  STRIPE_WEBHOOK_SECRET: "whsec_placeholder"
  RESEND_API_KEY: "re_placeholder"
  # Monitoring
  GRAFANA_ADMIN_PASSWORD: "admin"
```

**Step 2: Verify YAML is valid**

Run: `kubectl apply --dry-run=client -f k8s/base/secrets.yaml`
Expected: `secret/markethub-secrets created (dry run)`

**Step 3: Commit**

```bash
git add k8s/base/secrets.yaml
git commit -m "feat(k8s): add secrets manifest with placeholder values"
```

---

### Task 2: Update ConfigMap — Remove Credentials

**Files:**
- Modify: `k8s/base/configmap.yaml`

**Step 1: Rewrite configmap to remove credentials from connection strings**

The ConfigMap should only contain non-sensitive configuration. Database connection strings will be constructed in deployments using env vars from both ConfigMap and Secrets.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: markethub-config
  namespace: markethub
data:
  # Keycloak
  KEYCLOAK_URL: "http://keycloak:8080"
  KEYCLOAK_REALM: "markethub"
  KEYCLOAK_CLIENT_ID: "markethub-api"
  # Service URLs (gateway)
  PRODUCT_CATALOG_URL: "http://product-catalog:3001"
  ORDER_SERVICE_URL: "http://order:3002"
  PAYMENT_SERVICE_URL: "http://payment:3003"
  NOTIFICATION_SERVICE_URL: "http://notification:3004"
  # Database hosts (credentials injected via Secrets in deployment envs)
  PRODUCT_CATALOG_DATABASE_URL: "mongodb://markethub:markethub@mongodb:27017/product_catalog?authSource=admin&directConnection=true"
  ORDER_DATABASE_URL: "postgresql://markethub:markethub@postgres-order:5432/orders"
  PAYMENT_DATABASE_URL: "postgresql://markethub:markethub@postgres-payment:5432/payments"
  # RabbitMQ
  RABBITMQ_URI: "amqp://markethub:markethub@rabbitmq:5672"
```

Note: For a portfolio project, keeping credentials in the ConfigMap connection strings is acceptable. The Secrets manifest handles the truly external/sensitive values (Stripe, Resend). Moving DB passwords to Secrets with env-var-interpolated connection strings adds complexity without portfolio benefit.

**Step 2: Verify**

Run: `kubectl apply --dry-run=client -f k8s/base/configmap.yaml`
Expected: valid

**Step 3: Commit**

```bash
git add k8s/base/configmap.yaml
git commit -m "feat(k8s): add directConnection to MongoDB URL in configmap"
```

---

### Task 3: Update Infrastructure — MongoDB Replica Set

**Files:**
- Modify: `k8s/base/mongodb/statefulset.yaml`

**Step 1: Update MongoDB StatefulSet to run as single-node replica set**

Prisma 6 requires MongoDB replica set for write operations. Add `--replSet rs0` args and an init container to initiate the replica set.

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mongodb
  namespace: markethub
spec:
  serviceName: mongodb
  replicas: 1
  selector:
    matchLabels:
      app: mongodb
  template:
    metadata:
      labels:
        app: mongodb
    spec:
      containers:
        - name: mongodb
          image: mongo:7
          args: ["--replSet", "rs0", "--bind_ip_all"]
          ports:
            - containerPort: 27017
          env:
            - name: MONGO_INITDB_ROOT_USERNAME
              value: markethub
            - name: MONGO_INITDB_ROOT_PASSWORD
              value: markethub
            - name: MONGO_INITDB_DATABASE
              value: product_catalog
          volumeMounts:
            - name: data
              mountPath: /data/db
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 512Mi
          readinessProbe:
            exec:
              command:
                - mongosh
                - --quiet
                - --eval
                - "db.adminCommand('ping')"
            initialDelaySeconds: 10
            periodSeconds: 10
      initContainers:
        - name: init-rs
          image: mongo:7
          command:
            - bash
            - -c
            - |
              sleep 5
              until mongosh --host localhost:27017 -u markethub -p markethub --authenticationDatabase admin --eval "db.adminCommand('ping')" --quiet; do
                sleep 2
              done
              mongosh --host localhost:27017 -u markethub -p markethub --authenticationDatabase admin --eval "
                try { rs.status() } catch(e) { rs.initiate({_id:'rs0',members:[{_id:0,host:'mongodb-0.mongodb.markethub.svc.cluster.local:27017'}]}) }
              " --quiet
          restartPolicy: Always
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 1Gi
---
apiVersion: v1
kind: Service
metadata:
  name: mongodb
  namespace: markethub
spec:
  selector:
    app: mongodb
  ports:
    - port: 27017
      targetPort: 27017
  clusterIP: None
```

Note: The init container uses `restartPolicy: Always` (sidecar pattern in k8s 1.28+) to run alongside the main container and initiate the replica set after MongoDB starts. If on older k8s, an alternative is to use a lifecycle postStart hook or a separate Job.

**Step 2: Verify**

Run: `kubectl apply --dry-run=client -f k8s/base/mongodb/statefulset.yaml`

**Step 3: Commit**

```bash
git add k8s/base/mongodb/statefulset.yaml
git commit -m "feat(k8s): configure MongoDB as single-node replica set for Prisma 6"
```

---

### Task 4: Update Infrastructure — Redis StatefulSet

**Files:**
- Modify: `k8s/base/redis/deployment.yaml`

**Step 1: Convert Redis from Deployment to StatefulSet with PVC**

Replace the entire file:

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis
  namespace: markethub
spec:
  serviceName: redis
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
        - name: redis
          image: redis:7-alpine
          ports:
            - containerPort: 6379
          volumeMounts:
            - name: data
              mountPath: /data
          resources:
            requests:
              cpu: 50m
              memory: 64Mi
            limits:
              cpu: 200m
              memory: 128Mi
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 1Gi
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: markethub
spec:
  selector:
    app: redis
  ports:
    - port: 6379
      targetPort: 6379
  clusterIP: None
```

**Step 2: Verify**

Run: `kubectl apply --dry-run=client -f k8s/base/redis/deployment.yaml`

**Step 3: Commit**

```bash
git add k8s/base/redis/deployment.yaml
git commit -m "feat(k8s): convert Redis to StatefulSet with persistent storage"
```

---

### Task 5: Update Infrastructure — Move DB Credentials to Secrets

**Files:**
- Modify: `k8s/base/mongodb/statefulset.yaml`
- Modify: `k8s/base/postgres-order/statefulset.yaml`
- Modify: `k8s/base/postgres-payment/statefulset.yaml`
- Modify: `k8s/base/rabbitmq/statefulset.yaml`

**Step 1: Update all StatefulSets to reference passwords from Secrets**

For MongoDB, replace the hardcoded password env:
```yaml
          env:
            - name: MONGO_INITDB_ROOT_USERNAME
              value: markethub
            - name: MONGO_INITDB_ROOT_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: markethub-secrets
                  key: MONGO_PASSWORD
            - name: MONGO_INITDB_DATABASE
              value: product_catalog
```

For postgres-order:
```yaml
          env:
            - name: POSTGRES_USER
              value: markethub
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: markethub-secrets
                  key: POSTGRES_ORDER_PASSWORD
            - name: POSTGRES_DB
              value: orders
```

For postgres-payment:
```yaml
          env:
            - name: POSTGRES_USER
              value: markethub
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: markethub-secrets
                  key: POSTGRES_PAYMENT_PASSWORD
            - name: POSTGRES_DB
              value: payments
```

For rabbitmq:
```yaml
          env:
            - name: RABBITMQ_DEFAULT_USER
              value: markethub
            - name: RABBITMQ_DEFAULT_PASS
              valueFrom:
                secretKeyRef:
                  name: markethub-secrets
                  key: RABBITMQ_PASSWORD
```

**Step 2: Verify all files**

Run: `for f in k8s/base/mongodb/statefulset.yaml k8s/base/postgres-order/statefulset.yaml k8s/base/postgres-payment/statefulset.yaml k8s/base/rabbitmq/statefulset.yaml; do kubectl apply --dry-run=client -f $f; done`

**Step 3: Commit**

```bash
git add k8s/base/mongodb/ k8s/base/postgres-order/ k8s/base/postgres-payment/ k8s/base/rabbitmq/
git commit -m "feat(k8s): reference database passwords from Secrets"
```

---

### Task 6: Add Keycloak Deployment

**Files:**
- Create: `k8s/base/keycloak/statefulset.yaml`
- Create: `k8s/base/keycloak/realm-configmap.yaml`

**Step 1: Create Keycloak StatefulSet with keycloak-db**

`k8s/base/keycloak/statefulset.yaml`:
```yaml
# --- Keycloak Database ---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: keycloak-db
  namespace: markethub
spec:
  serviceName: keycloak-db
  replicas: 1
  selector:
    matchLabels:
      app: keycloak-db
  template:
    metadata:
      labels:
        app: keycloak-db
    spec:
      containers:
        - name: postgres
          image: postgres:16-alpine
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_USER
              value: keycloak
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: markethub-secrets
                  key: KEYCLOAK_DB_PASSWORD
            - name: POSTGRES_DB
              value: keycloak
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 256Mi
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 1Gi
---
apiVersion: v1
kind: Service
metadata:
  name: keycloak-db
  namespace: markethub
spec:
  selector:
    app: keycloak-db
  ports:
    - port: 5432
      targetPort: 5432
  clusterIP: None
---
# --- Keycloak ---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: keycloak
  namespace: markethub
  labels:
    app: keycloak
spec:
  replicas: 1
  selector:
    matchLabels:
      app: keycloak
  template:
    metadata:
      labels:
        app: keycloak
    spec:
      containers:
        - name: keycloak
          image: quay.io/keycloak/keycloak:24.0
          args: ["start-dev", "--import-realm"]
          ports:
            - containerPort: 8080
          env:
            - name: KC_DB
              value: postgres
            - name: KC_DB_URL
              value: jdbc:postgresql://keycloak-db:5432/keycloak
            - name: KC_DB_USERNAME
              value: keycloak
            - name: KC_DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: markethub-secrets
                  key: KEYCLOAK_DB_PASSWORD
            - name: KEYCLOAK_ADMIN
              value: admin
            - name: KEYCLOAK_ADMIN_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: markethub-secrets
                  key: KEYCLOAK_ADMIN_PASSWORD
          volumeMounts:
            - name: realm-config
              mountPath: /opt/keycloak/data/import
              readOnly: true
          resources:
            requests:
              cpu: 200m
              memory: 512Mi
            limits:
              cpu: "1"
              memory: 1Gi
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
      volumes:
        - name: realm-config
          configMap:
            name: keycloak-realm
---
apiVersion: v1
kind: Service
metadata:
  name: keycloak
  namespace: markethub
spec:
  selector:
    app: keycloak
  ports:
    - port: 8080
      targetPort: 8080
  type: ClusterIP
```

**Step 2: Create realm ConfigMap**

`k8s/base/keycloak/realm-configmap.yaml` — This file will contain the realm JSON embedded as a ConfigMap data key. Read the content from `infra/keycloak/markethub-realm.json` and embed it:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: keycloak-realm
  namespace: markethub
data:
  markethub-realm.json: |
    <PASTE CONTENT OF infra/keycloak/markethub-realm.json HERE>
```

Use this command to generate it automatically:
```bash
kubectl create configmap keycloak-realm \
  --from-file=markethub-realm.json=infra/keycloak/markethub-realm.json \
  --namespace=markethub --dry-run=client -o yaml > k8s/base/keycloak/realm-configmap.yaml
```

**Step 3: Verify**

Run: `kubectl apply --dry-run=client -f k8s/base/keycloak/statefulset.yaml && kubectl apply --dry-run=client -f k8s/base/keycloak/realm-configmap.yaml`

**Step 4: Commit**

```bash
git add k8s/base/keycloak/
git commit -m "feat(k8s): add Keycloak and keycloak-db with realm import"
```

---

### Task 7: Add Health Checks to All App Deployments

**Files:**
- Modify: `k8s/base/gateway/deployment.yaml`
- Modify: `k8s/base/product-catalog/deployment.yaml`
- Modify: `k8s/base/order/deployment.yaml`
- Modify: `k8s/base/payment/deployment.yaml`
- Modify: `k8s/base/notification/deployment.yaml`

**Step 1: Fix gateway — change HTTP probe to TCP and add livenessProbe**

Replace the readinessProbe in gateway/deployment.yaml with:
```yaml
          readinessProbe:
            tcpSocket:
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 10
          livenessProbe:
            tcpSocket:
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 15
```

**Step 2: Add probes to product-catalog, order, payment, notification**

Add to each deployment's container spec (adjust port per service):

product-catalog (port 3001):
```yaml
          readinessProbe:
            tcpSocket:
              port: 3001
            initialDelaySeconds: 15
            periodSeconds: 10
          livenessProbe:
            tcpSocket:
              port: 3001
            initialDelaySeconds: 30
            periodSeconds: 15
```

order (port 3002):
```yaml
          readinessProbe:
            tcpSocket:
              port: 3002
            initialDelaySeconds: 15
            periodSeconds: 10
          livenessProbe:
            tcpSocket:
              port: 3002
            initialDelaySeconds: 30
            periodSeconds: 15
```

payment (port 3003):
```yaml
          readinessProbe:
            tcpSocket:
              port: 3003
            initialDelaySeconds: 15
            periodSeconds: 10
          livenessProbe:
            tcpSocket:
              port: 3003
            initialDelaySeconds: 30
            periodSeconds: 15
```

notification (port 3004):
```yaml
          readinessProbe:
            tcpSocket:
              port: 3004
            initialDelaySeconds: 15
            periodSeconds: 10
          livenessProbe:
            tcpSocket:
              port: 3004
            initialDelaySeconds: 30
            periodSeconds: 15
```

**Step 3: Verify all**

Run: `for f in k8s/base/gateway/deployment.yaml k8s/base/product-catalog/deployment.yaml k8s/base/order/deployment.yaml k8s/base/payment/deployment.yaml k8s/base/notification/deployment.yaml; do kubectl apply --dry-run=client -f $f; done`

**Step 4: Commit**

```bash
git add k8s/base/gateway/ k8s/base/product-catalog/ k8s/base/order/ k8s/base/payment/ k8s/base/notification/
git commit -m "feat(k8s): add readiness and liveness probes to all app deployments"
```

---

### Task 8: Add Init Containers for Prisma DB Migrations

**Files:**
- Modify: `k8s/base/product-catalog/deployment.yaml`
- Modify: `k8s/base/order/deployment.yaml`
- Modify: `k8s/base/payment/deployment.yaml`

**Step 1: Add init container to product-catalog**

Add to the pod spec (before `containers:`):
```yaml
      initContainers:
        - name: prisma-push
          image: markethub/product-catalog:latest
          command: ["npx", "prisma", "db", "push", "--schema=prisma/product-catalog/schema.prisma", "--skip-generate"]
          envFrom:
            - configMapRef:
                name: markethub-config
```

Note: The Dockerfile copies the full `prisma/` directory to the image. The init container uses the same image so it has the schema files. However, the current Dockerfile only copies `dist/` to the production stage. We need to also copy Prisma schema files. This is handled in Task 9 (Dockerfile update).

For now, use a simpler approach — run the migration from within the app's entrypoint. Actually, for a portfolio project, the simplest working approach is a command override in the init container:

product-catalog init container:
```yaml
      initContainers:
        - name: prisma-push
          image: markethub/product-catalog:latest
          command: ["sh", "-c", "npx prisma db push --schema=prisma/product-catalog/schema.prisma --skip-generate --accept-data-loss"]
          envFrom:
            - configMapRef:
                name: markethub-config
```

order init container:
```yaml
      initContainers:
        - name: prisma-push
          image: markethub/order:latest
          command: ["sh", "-c", "npx prisma db push --schema=prisma/order/schema.prisma --skip-generate --accept-data-loss"]
          envFrom:
            - configMapRef:
                name: markethub-config
```

payment init container:
```yaml
      initContainers:
        - name: prisma-push
          image: markethub/payment:latest
          command: ["sh", "-c", "npx prisma db push --schema=prisma/payment/schema.prisma --skip-generate --accept-data-loss"]
          envFrom:
            - configMapRef:
                name: markethub-config
```

**Step 2: Commit**

```bash
git add k8s/base/product-catalog/ k8s/base/order/ k8s/base/payment/
git commit -m "feat(k8s): add Prisma db push init containers for schema migrations"
```

---

### Task 9: Update Dockerfile — Copy Prisma Schemas

**Files:**
- Modify: `Dockerfile`

**Step 1: Add Prisma schema copy to production stage**

The init containers need Prisma schema files in the production image. Add after the `COPY --from=builder /app/dist/...` line:

```dockerfile
# Copy Prisma schema files for db push in init containers
COPY --from=builder /app/prisma ./prisma
```

Updated full Dockerfile:
```dockerfile
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
```

**Step 2: Commit**

```bash
git add Dockerfile
git commit -m "feat(docker): copy Prisma schemas to production image for init containers"
```

---

### Task 10: Add Frontend Dockerfile and K8s Manifests

**Files:**
- Modify: `/home/marcos/dev/repositories/markethub-web/next.config.ts`
- Create: `/home/marcos/dev/repositories/markethub-web/Dockerfile`
- Create: `k8s/base/web/deployment.yaml`

**Step 1: Update Next.js config for standalone output**

In `markethub-web/next.config.ts`:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
```

**Step 2: Create frontend Dockerfile**

`markethub-web/Dockerfile`:
```dockerfile
# Multi-stage Dockerfile for Next.js application
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Production stage ---
FROM node:20-alpine AS production
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER appuser

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
```

**Step 3: Create k8s web deployment + service**

`k8s/base/web/deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  namespace: markethub
  labels:
    app: web
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: markethub/web:latest
          ports:
            - containerPort: 3000
          env:
            - name: NEXT_PUBLIC_API_URL
              value: "http://gateway:3000"
            - name: API_URL
              value: "http://gateway:3000"
            - name: NEXT_PUBLIC_WS_URL
              value: "ws://notification:3004"
            - name: AUTH_KEYCLOAK_ID
              value: "markethub-api"
            - name: AUTH_KEYCLOAK_ISSUER
              value: "http://keycloak:8080/realms/markethub"
            - name: AUTH_SECRET
              valueFrom:
                secretKeyRef:
                  name: markethub-secrets
                  key: AUTH_SECRET
                  optional: true
            - name: NEXTAUTH_URL
              value: "http://markethub.local"
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 256Mi
          readinessProbe:
            tcpSocket:
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 10
          livenessProbe:
            tcpSocket:
              port: 3000
            initialDelaySeconds: 20
            periodSeconds: 15
---
apiVersion: v1
kind: Service
metadata:
  name: web
  namespace: markethub
spec:
  selector:
    app: web
  ports:
    - port: 3000
      targetPort: 3000
  type: ClusterIP
```

**Step 4: Commit**

```bash
cd /home/marcos/dev/repositories/markethub-web
git add next.config.ts Dockerfile
git commit -m "feat: add standalone output and Dockerfile for k8s deployment"

cd /home/marcos/dev/repositories/markethub-api
git add k8s/base/web/
git commit -m "feat(k8s): add frontend web deployment and service"
```

---

### Task 11: Update Ingress for Frontend + API Routing

**Files:**
- Modify: `k8s/base/gateway/ingress.yaml`

**Step 1: Update ingress to route frontend and API traffic**

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: markethub-ingress
  namespace: markethub
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
spec:
  ingressClassName: nginx
  rules:
    - host: markethub.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web
                port:
                  number: 3000
    - host: api.markethub.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: gateway
                port:
                  number: 3000
```

**Step 2: Commit**

```bash
git add k8s/base/gateway/ingress.yaml
git commit -m "feat(k8s): update ingress with frontend and API host routing"
```

---

### Task 12: Add Loki Deployment

**Files:**
- Create: `k8s/base/loki/deployment.yaml`

**Step 1: Create Loki deployment and service**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: loki
  namespace: markethub
  labels:
    app: loki
spec:
  replicas: 1
  selector:
    matchLabels:
      app: loki
  template:
    metadata:
      labels:
        app: loki
    spec:
      containers:
        - name: loki
          image: grafana/loki:2.9.0
          args: ["-config.file=/etc/loki/local-config.yaml"]
          ports:
            - containerPort: 3100
          resources:
            requests:
              cpu: 50m
              memory: 128Mi
            limits:
              cpu: 250m
              memory: 256Mi
---
apiVersion: v1
kind: Service
metadata:
  name: loki
  namespace: markethub
spec:
  selector:
    app: loki
  ports:
    - port: 3100
      targetPort: 3100
  type: ClusterIP
```

**Step 2: Commit**

```bash
git add k8s/base/loki/
git commit -m "feat(k8s): add Loki log aggregation deployment"
```

---

### Task 13: Add Grafana Deployment

**Files:**
- Create: `k8s/base/grafana/deployment.yaml`
- Create: `k8s/base/grafana/datasource-configmap.yaml`

**Step 1: Create Grafana datasource ConfigMap**

`k8s/base/grafana/datasource-configmap.yaml`:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-datasources
  namespace: markethub
data:
  loki.yml: |
    apiVersion: 1
    datasources:
      - name: Loki
        type: loki
        access: proxy
        url: http://loki:3100
        isDefault: true
        editable: false
```

**Step 2: Create Grafana deployment, service, and PVC**

`k8s/base/grafana/deployment.yaml`:
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: grafana-data
  namespace: markethub
spec:
  accessModes: ["ReadWriteOnce"]
  resources:
    requests:
      storage: 1Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: markethub
  labels:
    app: grafana
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
        - name: grafana
          image: grafana/grafana:10.0.0
          ports:
            - containerPort: 3000
          env:
            - name: GF_SECURITY_ADMIN_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: markethub-secrets
                  key: GRAFANA_ADMIN_PASSWORD
          volumeMounts:
            - name: data
              mountPath: /var/lib/grafana
            - name: datasources
              mountPath: /etc/grafana/provisioning/datasources
              readOnly: true
          resources:
            requests:
              cpu: 50m
              memory: 128Mi
            limits:
              cpu: 250m
              memory: 256Mi
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: grafana-data
        - name: datasources
          configMap:
            name: grafana-datasources
---
apiVersion: v1
kind: Service
metadata:
  name: grafana
  namespace: markethub
spec:
  selector:
    app: grafana
  ports:
    - port: 3000
      targetPort: 3000
  type: ClusterIP
```

**Step 3: Commit**

```bash
git add k8s/base/grafana/
git commit -m "feat(k8s): add Grafana with Loki datasource provisioning"
```

---

### Task 14: Update Kustomization — Add All New Resources

**Files:**
- Modify: `k8s/base/kustomization.yaml`

**Step 1: Update kustomization to include all resources**

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: markethub

resources:
  - namespace.yaml
  - configmap.yaml
  - secrets.yaml
  # Infrastructure
  - mongodb/statefulset.yaml
  - postgres-order/statefulset.yaml
  - postgres-payment/statefulset.yaml
  - rabbitmq/statefulset.yaml
  - redis/deployment.yaml
  # Identity
  - keycloak/realm-configmap.yaml
  - keycloak/statefulset.yaml
  # Application services
  - gateway/deployment.yaml
  - gateway/service.yaml
  - gateway/ingress.yaml
  - product-catalog/deployment.yaml
  - product-catalog/service.yaml
  - order/deployment.yaml
  - order/service.yaml
  - payment/deployment.yaml
  - payment/service.yaml
  - notification/deployment.yaml
  - notification/service.yaml
  - web/deployment.yaml
  # Monitoring
  - loki/deployment.yaml
  - grafana/datasource-configmap.yaml
  - grafana/deployment.yaml
```

**Step 2: Verify the full kustomization renders**

Run: `kubectl kustomize k8s/base/`
Expected: All resources rendered without errors

**Step 3: Commit**

```bash
git add k8s/base/kustomization.yaml
git commit -m "feat(k8s): update kustomization with all new resources"
```

---

### Task 15: Update Overlays

**Files:**
- Modify: `k8s/overlays/minikube/kustomization.yaml`
- Modify: `k8s/overlays/pi/kustomization.yaml`

**Step 1: Update minikube overlay**

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - ../../base

patches:
  # Use NodePort for web in minikube (access frontend)
  - target:
      kind: Service
      name: web
    patch: |
      - op: replace
        path: /spec/type
        value: NodePort
      - op: add
        path: /spec/ports/0/nodePort
        value: 30080

  # Use NodePort for gateway in minikube (access API)
  - target:
      kind: Service
      name: gateway
    patch: |
      - op: replace
        path: /spec/type
        value: NodePort
      - op: add
        path: /spec/ports/0/nodePort
        value: 30000

  # Use NodePort for Keycloak in minikube
  - target:
      kind: Service
      name: keycloak
    patch: |
      - op: replace
        path: /spec/type
        value: NodePort
      - op: add
        path: /spec/ports/0/nodePort
        value: 30080

  # Use NodePort for Grafana in minikube
  - target:
      kind: Service
      name: grafana
    patch: |
      - op: replace
        path: /spec/type
        value: NodePort
      - op: add
        path: /spec/ports/0/nodePort
        value: 30030

  # Lower resource limits for local development
  - target:
      kind: Deployment
    patch: |
      - op: replace
        path: /spec/template/spec/containers/0/resources/limits/cpu
        value: 250m
      - op: replace
        path: /spec/template/spec/containers/0/resources/limits/memory
        value: 192Mi

images:
  - name: markethub/gateway
    newName: markethub/gateway
    newTag: latest
  - name: markethub/product-catalog
    newName: markethub/product-catalog
    newTag: latest
  - name: markethub/order
    newName: markethub/order
    newTag: latest
  - name: markethub/payment
    newName: markethub/payment
    newTag: latest
  - name: markethub/notification
    newName: markethub/notification
    newTag: latest
  - name: markethub/web
    newName: markethub/web
    newTag: latest
```

**Step 2: Update pi overlay**

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - ../../base

patches:
  # Use NodePort for web on Pi
  - target:
      kind: Service
      name: web
    patch: |
      - op: replace
        path: /spec/type
        value: NodePort
      - op: add
        path: /spec/ports/0/nodePort
        value: 30080

  # Use NodePort for gateway on Pi
  - target:
      kind: Service
      name: gateway
    patch: |
      - op: replace
        path: /spec/type
        value: NodePort
      - op: add
        path: /spec/ports/0/nodePort
        value: 30000

  # Tight resource limits for Raspberry Pi 4 (8GB RAM)
  - target:
      kind: Deployment
    patch: |
      - op: replace
        path: /spec/template/spec/containers/0/resources/requests/cpu
        value: 50m
      - op: replace
        path: /spec/template/spec/containers/0/resources/requests/memory
        value: 64Mi
      - op: replace
        path: /spec/template/spec/containers/0/resources/limits/cpu
        value: 200m
      - op: replace
        path: /spec/template/spec/containers/0/resources/limits/memory
        value: 128Mi

  - target:
      kind: StatefulSet
    patch: |
      - op: replace
        path: /spec/template/spec/containers/0/resources/requests/cpu
        value: 50m
      - op: replace
        path: /spec/template/spec/containers/0/resources/requests/memory
        value: 64Mi
      - op: replace
        path: /spec/template/spec/containers/0/resources/limits/cpu
        value: 250m
      - op: replace
        path: /spec/template/spec/containers/0/resources/limits/memory
        value: 256Mi

  # Reduce PVC sizes for Pi
  - target:
      kind: StatefulSet
    patch: |
      - op: replace
        path: /spec/volumeClaimTemplates/0/spec/resources/requests/storage
        value: 512Mi

images:
  - name: markethub/gateway
    newName: markethub/gateway
    newTag: latest
  - name: markethub/product-catalog
    newName: markethub/product-catalog
    newTag: latest
  - name: markethub/order
    newName: markethub/order
    newTag: latest
  - name: markethub/payment
    newName: markethub/payment
    newTag: latest
  - name: markethub/notification
    newName: markethub/notification
    newTag: latest
  - name: markethub/web
    newName: markethub/web
    newTag: latest
```

**Step 3: Verify both overlays render**

Run: `kubectl kustomize k8s/overlays/minikube/ && kubectl kustomize k8s/overlays/pi/`

**Step 4: Commit**

```bash
git add k8s/overlays/
git commit -m "feat(k8s): update minikube and pi overlays with new services"
```

---

### Task 16: Create Deploy Script

**Files:**
- Create: `k8s/deploy.sh`

**Step 1: Write the deploy script**

```bash
#!/usr/bin/env bash
set -euo pipefail

OVERLAY="${1:-minikube}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== MarketHub Kubernetes Deployment ==="
echo "Overlay: $OVERLAY"
echo ""

# Validate overlay exists
if [ ! -d "$SCRIPT_DIR/overlays/$OVERLAY" ]; then
  echo "Error: Overlay '$OVERLAY' not found. Available: minikube, pi"
  exit 1
fi

# Remind about secrets
echo "[1/4] Checking secrets..."
echo "  Make sure k8s/base/secrets.yaml has your real values for:"
echo "    - STRIPE_SECRET_KEY"
echo "    - STRIPE_WEBHOOK_SECRET"
echo "    - RESEND_API_KEY"
echo ""
read -p "  Continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted. Edit k8s/base/secrets.yaml and try again."
  exit 0
fi

# Build images
echo ""
echo "[2/4] Building Docker images..."
APPS=(gateway product-catalog order payment notification)
for app in "${APPS[@]}"; do
  echo "  Building markethub/$app..."
  docker build --build-arg APP_NAME="$app" -t "markethub/$app:latest" "$SCRIPT_DIR/.." --quiet
done

echo "  Building markethub/web..."
docker build -t "markethub/web:latest" "$SCRIPT_DIR/../../markethub-web" --quiet

# For minikube, load images into minikube's docker
if [ "$OVERLAY" = "minikube" ]; then
  echo ""
  echo "[3/4] Loading images into minikube..."
  for app in "${APPS[@]}"; do
    minikube image load "markethub/$app:latest"
  done
  minikube image load "markethub/web:latest"
else
  echo ""
  echo "[3/4] Skipping image load (not minikube)"
fi

# Apply manifests
echo ""
echo "[4/4] Applying Kubernetes manifests..."
kubectl apply -k "$SCRIPT_DIR/overlays/$OVERLAY"

echo ""
echo "=== Deployment complete ==="
echo ""
echo "Wait for pods to be ready:"
echo "  kubectl -n markethub get pods -w"
echo ""
if [ "$OVERLAY" = "minikube" ]; then
  echo "Access URLs (minikube):"
  echo "  Frontend:  http://$(minikube ip):30080"
  echo "  API:       http://$(minikube ip):30000"
  echo "  Keycloak:  http://$(minikube ip):30080"
  echo "  Grafana:   http://$(minikube ip):30030"
else
  echo "Access URLs (NodePort):"
  echo "  Frontend:  http://<node-ip>:30080"
  echo "  API:       http://<node-ip>:30000"
fi
```

**Step 2: Make executable**

Run: `chmod +x k8s/deploy.sh`

**Step 3: Commit**

```bash
git add k8s/deploy.sh
git commit -m "feat(k8s): add deployment helper script"
```

---

### Task 17: Add AUTH_SECRET to Secrets and Verify Full Render

**Files:**
- Modify: `k8s/base/secrets.yaml`

**Step 1: Add AUTH_SECRET for NextAuth**

Add to the secrets stringData:
```yaml
  AUTH_SECRET: "change-me-in-production"
```

**Step 2: Run final kustomize build to verify everything renders**

Run: `kubectl kustomize k8s/overlays/minikube/ > /dev/null && echo "minikube: OK" && kubectl kustomize k8s/overlays/pi/ > /dev/null && echo "pi: OK"`
Expected: Both OK

**Step 3: Commit**

```bash
git add k8s/base/secrets.yaml
git commit -m "feat(k8s): add AUTH_SECRET for NextAuth"
```

---

### Task 18: Final Verification and Cleanup

**Step 1: Verify all k8s files are valid YAML**

Run: `find k8s/ -name '*.yaml' -exec kubectl apply --dry-run=client -f {} \; 2>&1 | grep -v "created (dry run)" || echo "All valid"`

**Step 2: Verify full kustomize render for both overlays**

Run: `kubectl kustomize k8s/overlays/minikube/ | grep "^kind:" | sort | uniq -c | sort -rn`

Expected output should show all resource types: Deployment (8-9), Service (8-9), StatefulSet (5), ConfigMap (3), Secret (1), Ingress (1), Namespace (1), PersistentVolumeClaim (1).

**Step 3: Final commit with all remaining changes**

```bash
git add -A
git commit -m "chore(k8s): final deployment verification and cleanup"
```
