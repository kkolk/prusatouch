#!/bin/bash
set -e

# PrusaTouch Kiosk Mode Setup for Raspberry Pi
# Usage: ./scripts/setup-kiosk.sh [pi-hostname]

PI_HOST="${1:-octopi.local.frostbyte.us}"
PI_USER="kkolk"
SSH_KEY=~/.ssh/octopi_key
SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no"

echo "🖥️  PrusaTouch Kiosk Mode Setup"
echo "================================"
echo "Target: ${PI_USER}@${PI_HOST}"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Install dependencies on Pi
echo "📦 Installing dependencies on Pi..."
ssh $SSH_OPTS ${PI_USER}@${PI_HOST} << 'EOF'
  sudo apt-get update
  sudo apt-get install -y \
    chromium \
    unclutter \
    xdotool
EOF

echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 2: Copy startup script
echo "📄 Copying startup script..."
scp $SSH_OPTS scripts/templates/start-prusatouch.sh ${PI_USER}@${PI_HOST}:/home/${PI_USER}/
ssh $SSH_OPTS ${PI_USER}@${PI_HOST} "chmod +x /home/${PI_USER}/start-prusatouch.sh"

echo -e "${GREEN}✓ Startup script installed${NC}"
echo ""

# Step 3: Set up autostart
echo "⚙️  Configuring autostart..."
ssh $SSH_OPTS ${PI_USER}@${PI_HOST} << 'EOF'
  mkdir -p ~/.config/autostart
EOF

scp $SSH_OPTS scripts/templates/kiosk-autostart.desktop ${PI_USER}@${PI_HOST}:~/.config/autostart/

echo -e "${GREEN}✓ Autostart configured${NC}"
echo ""

# Step 4: Disable screen blanking in lightdm
echo "🖥️  Disabling screen blanking..."
ssh $SSH_OPTS ${PI_USER}@${PI_HOST} << 'EOF'
  sudo mkdir -p /etc/lightdm/lightdm.conf.d
  echo "[Seat:*]
xserver-command=X -s 0 -dpms" | sudo tee /etc/lightdm/lightdm.conf.d/01-disable-blanking.conf
EOF

echo -e "${GREEN}✓ Screen blanking disabled${NC}"
echo ""

# Step 5: (Optional) Set up systemd service for better reliability
echo "⚙️  Setting up systemd service (optional but recommended)..."
scp $SSH_OPTS scripts/templates/prusatouch-kiosk.service ${PI_USER}@${PI_HOST}:~/
ssh $SSH_OPTS ${PI_USER}@${PI_HOST} << 'EOF'
  sudo cp ~/prusatouch-kiosk.service /etc/systemd/system/
  sudo systemctl daemon-reload
  sudo systemctl enable prusatouch-kiosk.service
EOF

echo -e "${GREEN}✓ Systemd service installed and enabled${NC}"
echo ""

echo "================================"
echo -e "${GREEN}✅ Kiosk mode setup complete!${NC}"
echo ""
echo "Configuration:"
echo "  - Desktop autostart: ~/.config/autostart/kiosk-autostart.desktop"
echo "  - Systemd service: /etc/systemd/system/prusatouch-kiosk.service (recommended)"
echo ""
echo "Next steps:"
echo "  1. Reboot the Pi: ssh $SSH_OPTS ${PI_USER}@${PI_HOST} 'sudo reboot'"
echo "  2. PrusaTouch will auto-launch in kiosk mode"
echo ""
echo "To check status:"
echo "  ssh $SSH_OPTS ${PI_USER}@${PI_HOST} 'sudo systemctl status prusatouch-kiosk'"
echo ""
echo "To disable kiosk mode:"
echo "  ssh $SSH_OPTS ${PI_USER}@${PI_HOST} 'sudo systemctl disable prusatouch-kiosk && rm ~/.config/autostart/kiosk-autostart.desktop'"
