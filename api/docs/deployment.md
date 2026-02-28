# Deployment Guide

MarketHub supports three deployment targets, from simplest to most production-like.

## 1. Docker Compose (Development)

The simplest way to run the full stack locally.

### Build and Run

```bash
docker-compose up --build
```

This builds all 5 backend services from the Dockerfile and starts them alongside infrastructure containers.

### Access

| Service | URL | Credentials |
|---------|-----|-------------|
| Gateway (API) | http://localhost:3000 | — |
| Keycloak | http://localhost:8080 | admin / admin |
| RabbitMQ | http://localhost:15672 | markethub / markethub |
| Grafana | http://localhost:3001 | admin / admin |

### Tear Down

```bash
docker-compose down       # Stop containers
docker-compose down -v    # Stop and remove data volumes
```

## 2. Minikube (Local Kubernetes)

For testing Kubernetes deployment locally before deploying to a real cluster.

### Prerequisites

- [Minikube](https://minikube.sigs.k8s.io/docs/start/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- [Docker](https://docs.docker.com/get-docker/)

### Quick Deploy (Recommended)

The `k8s/deploy.sh` script automates the full deployment:

```bash
# Start Minikube
minikube start --memory=4096 --cpus=4
minikube addons enable ingress

# Deploy everything (builds images, loads into minikube, applies manifests)
./k8s/deploy.sh minikube
```

The script will:
1. Prompt you to verify secrets in `k8s/base/secrets.yaml`
2. Build all Docker images (5 backend + 1 frontend)
3. Load images into Minikube
4. Apply Kubernetes manifests via Kustomize

### Manual Deploy

If you prefer manual control:

```bash
# Build images inside Minikube's Docker daemon
eval $(minikube docker-env)
for app in gateway product-catalog order payment notification; do
  docker build --build-arg APP_NAME=$app -t markethub/$app:latest .
done
docker build -t markethub/web:latest ../web

# Apply manifests
kubectl apply -k k8s/overlays/minikube/

# Watch pods come up
kubectl -n markethub get pods -w
```

### Access (NodePort)

| Service | URL |
|---------|-----|
| Frontend | http://\<minikube-ip\>:30080 |
| API Gateway | http://\<minikube-ip\>:30000 |
| Keycloak | http://\<minikube-ip\>:30880 |
| Grafana | http://\<minikube-ip\>:30030 |

Get the Minikube IP: `minikube ip`

Alternatively, use Ingress with `/etc/hosts`:

```bash
minikube tunnel
# Add to /etc/hosts:
# <minikube-ip> markethub.local api.markethub.local
```

Then access: `http://markethub.local` (frontend) and `http://api.markethub.local` (API).

### What Gets Deployed

| Category | Resources |
|----------|-----------|
| **App Services** | gateway, product-catalog, order, payment, notification, web (frontend) |
| **Databases** | MongoDB (replica set), PostgreSQL (order), PostgreSQL (payment) |
| **Messaging** | RabbitMQ |
| **Cache** | Redis |
| **Identity** | Keycloak + keycloak-db |
| **Monitoring** | Loki + Grafana |
| **Networking** | Ingress (nginx), Services (ClusterIP/NodePort) |

Total: 37 Kubernetes resources (9 Deployments, 6 StatefulSets, 15 Services, 3 ConfigMaps, 1 Secret, 1 PVC, 1 Namespace, 1 Ingress).

### Tear Down

```bash
kubectl delete -k k8s/overlays/minikube/
minikube stop
```

## 3. K3s on Raspberry Pi 4

For running on a Raspberry Pi 4 (8GB RAM) with K3s.

### Prerequisites

- Raspberry Pi 4 (8GB) with Raspberry Pi OS 64-bit
- K3s installed: `curl -sfL https://get.k3s.io | sh -`

### Build Multi-Arch Images

On your development machine:

```bash
# Create buildx builder for multi-arch
docker buildx create --name multiarch --use

# Build and push backend services
for app in gateway product-catalog order payment notification; do
  docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --build-arg APP_NAME=$app \
    -t ghcr.io/<username>/markethub-$app:latest \
    --push .
done

# Build and push frontend
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/<username>/markethub-web:latest \
  --push ../web
```

### Deploy

On the Raspberry Pi:

```bash
# Update image references in k8s/overlays/pi/kustomization.yaml
# to point to your registry (ghcr.io/<username>/markethub-*)

# Deploy
sudo kubectl apply -k k8s/overlays/pi/

# Watch pods
sudo kubectl -n markethub get pods -w
```

### Resource Budget (8GB Pi)

The Pi overlay uses tight resource limits:

| Component | Memory Limit | CPU Limit |
|-----------|-------------|-----------|
| Each app service (x6) | 128Mi | 200m |
| Keycloak | 128Mi | 200m |
| MongoDB | 256Mi | 250m |
| PostgreSQL (x3) | 256Mi each | 250m each |
| RabbitMQ | 256Mi | 250m |
| Redis | 128Mi | 200m |
| Loki | 128Mi | 200m |
| Grafana | 128Mi | 200m |
| **Total** | ~3GB | ~3.5 cores |

This leaves headroom for K3s system components and OS.

### Access

K3s includes Traefik as the default ingress controller:

| Service | URL |
|---------|-----|
| Frontend | http://\<pi-ip\>:30080 |
| API Gateway | http://\<pi-ip\>:30000 |

## Kubernetes Architecture

```
k8s/
├── base/                    # Base manifests (all resources)
│   ├── kustomization.yaml   # Resource registry
│   ├── namespace.yaml       # markethub namespace
│   ├── configmap.yaml       # Non-sensitive config
│   ├── secrets.yaml         # Sensitive values (edit before deploy)
│   ├── gateway/             # API Gateway (Deployment + Service + Ingress)
│   ├── product-catalog/     # Product service (Deployment + Service)
│   ├── order/               # Order service (Deployment + Service)
│   ├── payment/             # Payment service (Deployment + Service)
│   ├── notification/        # Notification service (Deployment + Service)
│   ├── web/                 # Frontend (Deployment + Service)
│   ├── keycloak/            # Keycloak + DB (StatefulSet + Deployment)
│   ├── mongodb/             # MongoDB replica set (StatefulSet)
│   ├── postgres-order/      # PostgreSQL for orders (StatefulSet)
│   ├── postgres-payment/    # PostgreSQL for payments (StatefulSet)
│   ├── rabbitmq/            # RabbitMQ (StatefulSet)
│   ├── redis/               # Redis (StatefulSet)
│   ├── loki/                # Loki log aggregation (Deployment)
│   └── grafana/             # Grafana dashboards (Deployment + PVC)
├── overlays/
│   ├── minikube/            # Local dev (NodePort, reduced limits)
│   └── pi/                  # Raspberry Pi (tight limits, smaller PVCs)
└── deploy.sh                # Automated deployment script
```
