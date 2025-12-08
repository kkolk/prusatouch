#!/bin/bash
set -e

# PrusaTouch Kiosk Mode Setup for Raspberry Pi
# Usage: ./scripts/setup-kiosk.sh [pi-hostname]

PI_HOST="${1:-prusa-mk3s.local}"
PI_USER="pi"

echo "🖥️  PrusaTouch Kiosk Mode Setup"
echo "================================"
echo "Target: ${PI_USER}@${PI_HOST}"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Install dependencies on Pi
echo "📦 Installing dependencies on Pi..."
ssh ${PI_USER}@${PI_HOST} << 'EOF'
  sudo apt-get update
  sudo apt-get install -y \
    chromium-browser \
    unclutter \
    xdotool
EOF

echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 2: Copy startup script
echo "📄 Copying startup script..."
scp scripts/templates/start-prusatouch.sh ${PI_USER}@${PI_HOST}:/home/pi/
ssh ${PI_USER}@${PI_HOST} "chmod +x /home/pi/start-prusatouch.sh"

echo -e "${GREEN}✓ Startup script installed${NC}"
echo ""

# Step 3: Set up autostart
echo "⚙️  Configuring autostart..."
ssh ${PI_USER}@${PI_HOST} << 'EOF'
  mkdir -p /home/pi/.config/autostart
EOF

scp scripts/templates/kiosk-autostart.desktop ${PI_USER}@${PI_HOST}:/home/pi/.config/autostart/

echo -e "${GREEN}✓ Autostart configured${NC}"
echo ""

# Step 4: Disable screen blanking in lightdm
echo "🖥️  Disabling screen blanking..."
ssh ${PI_USER}@${PI_HOST} << 'EOF'
  sudo mkdir -p /etc/lightdm/lightdm.conf.d
  echo "[Seat:*]
xserver-command=X -s 0 -dpms" | sudo tee /etc/lightdm/lightdm.conf.d/01-disable-blanking.conf
EOF

echo -e "${GREEN}✓ Screen blanking disabled${NC}"
echo ""

echo "================================"
echo -e "${GREEN}✅ Kiosk mode setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Reboot the Pi: ssh ${PI_USER}@${PI_HOST} 'sudo reboot'"
echo "  2. PrusaTouch will auto-launch in kiosk mode"
echo ""
echo "To disable kiosk mode:"
echo "  ssh ${PI_USER}@${PI_HOST} 'rm /home/pi/.config/autostart/kiosk-autostart.desktop'"
