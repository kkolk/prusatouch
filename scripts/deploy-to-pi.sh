#!/bin/bash
set -e

# PrusaTouch Deployment Script for Raspberry Pi
# Usage: ./scripts/deploy-to-pi.sh [pi-hostname]

PI_HOST="${1:-prusa-mk3s.local}"
PI_USER="kkolk"
DEPLOY_PATH="/opt/prusatouch"

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

# Check if lighttpd is installed
check_lighttpd() {
  ssh ${PI_USER}@${PI_HOST} "which lighttpd > /dev/null 2>&1" && return 0 || return 1
}

# Install lighttpd
install_lighttpd() {
  echo "📦 Installing lighttpd web server..."
  ssh ${PI_USER}@${PI_HOST} "sudo apt-get update && sudo apt-get install -y lighttpd" || {
    echo "❌ Failed to install lighttpd"
    exit 1
  }
  echo -e "${GREEN}✓ lighttpd installed${NC}"
}

# Configure lighttpd
configure_lighttpd() {
  echo "⚙️  Configuring lighttpd..."

  # Set port 8080 (avoid conflict with OctoPrint on port 80)
  ssh ${PI_USER}@${PI_HOST} "sudo sed -i 's/server.port.*/server.port = 8080/' /etc/lighttpd/lighttpd.conf"

  # Set document root to PrusaTouch
  ssh ${PI_USER}@${PI_HOST} "sudo sed -i 's|server.document-root.*|server.document-root = \"${DEPLOY_PATH}\"|' /etc/lighttpd/lighttpd.conf"

  echo -e "${GREEN}✓ lighttpd configured for port 8080${NC}"
}

# Configure SPA routing
configure_spa_routing() {
  echo "🔀 Configuring SPA routing..."

  # Enable rewrite module
  ssh ${PI_USER}@${PI_HOST} "sudo lighttpd-enable-mod rewrite > /dev/null 2>&1 || true"

  # Create PrusaTouch config for SPA fallback
  ssh ${PI_USER}@${PI_HOST} 'sudo tee /etc/lighttpd/conf-available/10-prusatouch.conf > /dev/null << "EOF"
server.modules += ( "mod_rewrite" )

# SPA fallback - serve index.html for all routes
url.rewrite-once = (
    "^/assets/(.*)$" => "/assets/$1",
    "^/(.*)$" => "/index.html"
)
EOF'

  # Enable PrusaTouch config
  ssh ${PI_USER}@${PI_HOST} "sudo lighttpd-enable-mod prusatouch > /dev/null 2>&1 || true"

  echo -e "${GREEN}✓ SPA routing enabled${NC}"
}

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

# Step 3: Check/Install Web Server
echo "🔍 Checking for web server..."
if ! check_lighttpd; then
  echo "lighttpd not found, installing..."
  install_lighttpd
else
  echo -e "${GREEN}✓ lighttpd already installed${NC}"
fi
echo ""

# Configure lighttpd
configure_lighttpd
configure_spa_routing
echo ""

# Step 4: Create deployment directory on Pi
echo "📁 Creating deployment directory on Pi..."
ssh ${PI_USER}@${PI_HOST} "sudo mkdir -p ${DEPLOY_PATH} && sudo chown ${PI_USER}:${PI_USER} ${DEPLOY_PATH}"
echo -e "${GREEN}✓ Directory ready${NC}"
echo ""

# Step 5: Transfer files
echo "📤 Transferring files to Pi..."
rsync -avz --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.env' \
  dist/ ${PI_USER}@${PI_HOST}:${DEPLOY_PATH}/

echo -e "${GREEN}✓ Files transferred${NC}"
echo ""

# Step 6: Set permissions
echo "🔐 Setting permissions..."
ssh ${PI_USER}@${PI_HOST} "sudo chown -R www-data:www-data ${DEPLOY_PATH} && sudo chmod -R 755 ${DEPLOY_PATH}"
echo -e "${GREEN}✓ Permissions set${NC}"
echo ""

# Step 7: Verify deployment
echo "✅ Verifying deployment..."
ssh ${PI_USER}@${PI_HOST} "ls -lh ${DEPLOY_PATH}/index.html" || {
  echo "❌ index.html not found on Pi"
  exit 1
}

echo -e "${GREEN}✓ Deployment verified${NC}"
echo ""

echo "=========================================="
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Access PrusaTouch at: http://${PI_HOST}:8080"
echo ""
echo "Next steps:"
echo "  1. Set up kiosk mode: ./scripts/setup-kiosk.sh ${PI_HOST}"
echo "  2. Configure autostart on boot"
