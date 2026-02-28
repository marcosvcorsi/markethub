#!/usr/bin/env bash
set -euo pipefail

OVERLAY="${1:-minikube}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$SCRIPT_DIR/.."

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
  docker build --build-arg APP_NAME="$app" -t "markethub/$app:latest" "$ROOT_DIR" --quiet
done

if [ -d "$ROOT_DIR/../web" ]; then
  echo "  Building markethub/web..."
  docker build -t "markethub/web:latest" "$ROOT_DIR/../web" --quiet
else
  echo "  Warning: web directory not found, skipping web build"
fi

# For minikube, load images into minikube's docker
if [ "$OVERLAY" = "minikube" ]; then
  echo ""
  echo "[3/4] Loading images into minikube..."
  for app in "${APPS[@]}"; do
    minikube image load "markethub/$app:latest"
  done
  if docker image inspect markethub/web:latest &>/dev/null; then
    minikube image load "markethub/web:latest"
  fi
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
  MINIKUBE_IP=$(minikube ip 2>/dev/null || echo "<minikube-ip>")
  echo "Access URLs (minikube):"
  echo "  Frontend:  http://$MINIKUBE_IP:30080"
  echo "  API:       http://$MINIKUBE_IP:30000"
  echo "  Keycloak:  http://$MINIKUBE_IP:30880"
  echo "  Grafana:   http://$MINIKUBE_IP:30030"
else
  echo "Access URLs (NodePort):"
  echo "  Frontend:  http://<node-ip>:30080"
  echo "  API:       http://<node-ip>:30000"
fi
