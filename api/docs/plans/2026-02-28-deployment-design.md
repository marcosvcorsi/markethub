# MarketHub Deployment Design — Kubernetes with Kustomize

**Date:** 2026-02-28
**Target:** Portfolio showcase (minikube / k3s)

## Goal

Complete the existing Kustomize-based Kubernetes deployment so all services (backend, frontend, infrastructure, monitoring) are deployable with a single `kubectl apply -k` command per overlay.

## Current State

The k8s directory has 21 manifests covering 5 app deployments, 4 infrastructure StatefulSets, and 2 overlays (minikube, pi). Key gaps: no Keycloak, no Secrets manifest, no frontend, no monitoring, missing health checks, Redis lacks persistence.

## Design

### 1. Secrets Management

Create `k8s/base/secrets.yaml` with all sensitive values separated from ConfigMap:
- Database passwords (MongoDB, PostgreSQL order/payment, Keycloak DB)
- RabbitMQ credentials
- Stripe keys
- Resend API key
- Grafana admin password

Update ConfigMap to use template-style connection strings referencing Secret-sourced env vars. Update all deployments to reference Secrets for credentials.

### 2. Keycloak

Add `k8s/base/keycloak/statefulset.yaml`:
- `keycloak-db`: postgres:16-alpine StatefulSet with 1Gi PVC
- `keycloak`: quay.io/keycloak/keycloak:24.0 Deployment with `start-dev --import-realm`
- Realm JSON loaded via ConfigMap mounted to `/opt/keycloak/data/import`
- Service exposing port 8080

### 3. Redis Fix

Convert `k8s/base/redis/deployment.yaml` from Deployment to StatefulSet with:
- 1Gi PVC for data persistence
- Headless Service (matching other StatefulSets)

### 4. Health Checks

Add `readinessProbe` and `livenessProbe` to all 5 app deployments. Use TCP socket probes on the app port since no `/health` endpoint exists. Initial delay 15s, period 10s.

Fix gateway probe: change from HTTP `/health` to TCP socket on port 3000.

### 5. Init Containers for DB Migrations

Add init containers to `product-catalog`, `order`, and `payment` deployments that run `npx prisma db push --skip-generate` using the same app image. This ensures database schemas exist before the app starts.

### 6. Frontend (markethub-web)

Create `Dockerfile` in the markethub-web repo:
- Multi-stage build with node:20-alpine
- Next.js standalone output mode (`output: 'standalone'` in next.config.ts)
- Non-root user, port 3000

Add `k8s/base/web/`:
- Deployment (image: markethub/web, port 3000)
- Service (ClusterIP)

Update ingress to use two hosts:
- `markethub.local` → web service (frontend)
- `api.markethub.local` → gateway service (API)

### 7. Monitoring Stack

Add `k8s/base/loki/`:
- Deployment (grafana/loki:2.9.0, port 3100)
- Service (ClusterIP)

Add `k8s/base/grafana/`:
- Deployment (grafana/grafana:10.0.0, port 3000)
- Service (ClusterIP)
- 1Gi PVC for dashboard persistence
- ConfigMap for Loki datasource provisioning
- Admin password from Secrets

### 8. MongoDB Replica Set

Update MongoDB StatefulSet to run as single-node replica set (required by Prisma 6). Add init script via ConfigMap.

### 9. Kustomization & Overlays

Update `k8s/base/kustomization.yaml` to include all new resources.

Update both overlays (minikube, pi) with:
- Image entries for `markethub/web`
- Resource limit patches for new deployments (keycloak, web, grafana, loki)
- NodePort for web service in minikube overlay

### 10. Deploy Script

Create `k8s/deploy.sh` that:
1. Prompts user to review/edit secrets
2. Applies the chosen overlay via `kubectl apply -k`
3. Prints access URLs

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `k8s/base/secrets.yaml` | Secret template with placeholder values |
| `k8s/base/keycloak/statefulset.yaml` | Keycloak + keycloak-db |
| `k8s/base/keycloak/realm-configmap.yaml` | Realm JSON as ConfigMap |
| `k8s/base/web/deployment.yaml` | Frontend deployment + service |
| `k8s/base/loki/deployment.yaml` | Loki deployment + service |
| `k8s/base/grafana/deployment.yaml` | Grafana deployment + service + PVC |
| `k8s/base/grafana/datasource-configmap.yaml` | Loki datasource config |
| `k8s/deploy.sh` | Deployment helper script |
| `markethub-web/Dockerfile` | Frontend Docker build |

### Modified Files
| File | Changes |
|------|---------|
| `k8s/base/configmap.yaml` | Remove credentials, keep only non-sensitive config |
| `k8s/base/kustomization.yaml` | Add all new resources |
| `k8s/base/redis/deployment.yaml` | Convert to StatefulSet with PVC |
| `k8s/base/mongodb/statefulset.yaml` | Add replica set init |
| `k8s/base/gateway/deployment.yaml` | Fix probe to TCP, add livenessProbe |
| `k8s/base/gateway/ingress.yaml` | Add web + api host routing |
| `k8s/base/product-catalog/deployment.yaml` | Add probes, init container, secret refs |
| `k8s/base/order/deployment.yaml` | Add probes, init container, secret refs |
| `k8s/base/payment/deployment.yaml` | Add probes, init container |
| `k8s/base/notification/deployment.yaml` | Add probes |
| `k8s/overlays/minikube/kustomization.yaml` | Add web image, resource patches |
| `k8s/overlays/pi/kustomization.yaml` | Add web image, resource patches |
| `markethub-web/next.config.ts` | Add `output: 'standalone'` |

## Out of Scope

- TLS / cert-manager (portfolio, not production)
- Network policies
- HPA / pod disruption budgets
- Multi-replica deployments
- External secrets management (Vault, etc.)
