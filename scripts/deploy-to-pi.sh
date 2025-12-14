#!/bin/bash
set -e

# PrusaTouch Deployment Script for Raspberry Pi
# Usage: ./scripts/deploy-to-pi.sh [pi-hostname]

PI_HOST="${1:-octopi.local.frostbyte.us}"
PI_USER="kkolk"
DEPLOY_PATH="/opt/prusatouch/dist"
SSH_KEY="$HOME/.ssh/octopi_key"
SSH_OPTS="-i ${SSH_KEY}"

echo "🚀 PrusaTouch Deployment to Raspberry Pi"
echo "========================================="
echo "Target: ${PI_USER}@${PI_HOST}"
echo "Path: ${DEPLOY_PATH}"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Build production bundle
echo "📦 Building production bundle..."
npm run build

if [ ! -d "dist" ]; then
  echo "❌ Build failed - dist directory not found"
  exit 1
fi

echo -e "${GREEN}✓ Build complete${NC}"
echo ""

# Step 2: Verify bundle size
echo "🔍 Verifying performance..."
./scripts/verify-performance.sh || {
  echo "❌ Performance verification failed"
  exit 1
}
echo ""

# Step 3: Create deployment directory on Pi
echo "📁 Creating deployment directory on Pi..."
ssh ${SSH_OPTS} ${PI_USER}@${PI_HOST} "sudo mkdir -p ${DEPLOY_PATH} && sudo chown -R ${PI_USER}:${PI_USER} ${DEPLOY_PATH}"
echo -e "${GREEN}✓ Directory ready${NC}"
echo ""

# Step 4: Transfer files
echo "📤 Transferring files to Pi..."
rsync -avz --delete \
  -e "ssh ${SSH_OPTS}" \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.env' \
  dist/ ${PI_USER}@${PI_HOST}:${DEPLOY_PATH}/

echo -e "${GREEN}✓ Files transferred${NC}"
echo ""

# Step 5: Set permissions
echo "🔐 Setting permissions..."
ssh ${SSH_OPTS} ${PI_USER}@${PI_HOST} "sudo chown -R ${PI_USER}:${PI_USER} ${DEPLOY_PATH} && sudo chmod -R 755 ${DEPLOY_PATH}"
echo -e "${GREEN}✓ Permissions set${NC}"
echo ""

# Step 6: Restart auth-helper service
echo "🔄 Restarting auth-helper service..."
ssh ${SSH_OPTS} ${PI_USER}@${PI_HOST} "sudo systemctl restart prusalink-auth" || {
  echo -e "${RED}❌ Failed to restart prusalink-auth${NC}"
  exit 1
}

# Wait for service to start
sleep 2

echo -e "${GREEN}✓ Auth-helper restarted${NC}"
echo ""

# Step 7: Verify deployment
echo "✅ Verifying deployment..."

# Check files exist
ssh ${SSH_OPTS} ${PI_USER}@${PI_HOST} "ls -lh ${DEPLOY_PATH}/index.html" || {
  echo "❌ index.html not found on Pi"
  exit 1
}

# Check HTTP response
HTTP_CODE=$(ssh ${SSH_OPTS} ${PI_USER}@${PI_HOST} "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/")
if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ HTTP server responding (200 OK)${NC}"
else
  echo -e "${RED}❌ HTTP server not responding correctly (got $HTTP_CODE)${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Deployment verified${NC}"
echo ""

echo "=========================================="
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Access PrusaTouch at: http://${PI_HOST}:8080"
echo ""
echo "Architecture:"
echo "  Browser → auth-helper:8080 → PrusaLink:80"
echo ""
echo "Next steps:"
echo "  1. Set up kiosk mode: ./scripts/setup-kiosk.sh ${PI_HOST}"
echo "  2. Configure autostart on boot"
echo ""
