#!/bin/bash
# Deploy auth-helper service to Raspberry Pi (idempotent)

set -e

PI_HOST="${1:-octopi.local.frostbyte.us}"
SSH_KEY=~/.ssh/octopi_key
SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no"

echo "Deploying auth-helper to $PI_HOST..."

# Ensure Node.js is installed on Pi
echo "Checking Node.js installation..."
NODE_INSTALLED=$(ssh $SSH_OPTS kkolk@$PI_HOST "export NVM_DIR=\"\$HOME/.nvm\" && [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\" && command -v node >/dev/null 2>&1 && echo 'yes' || echo 'no'")

if [ "$NODE_INSTALLED" = "no" ]; then
  echo "Installing Node.js 24.x on Pi..."
  ssh $SSH_OPTS kkolk@$PI_HOST "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
  ssh $SSH_OPTS kkolk@$PI_HOST "export NVM_DIR=\"\$HOME/.nvm\" && [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\" && nvm install 24 && nvm use 24 && nvm alias default 24"
else
  echo "Node.js already installed"
fi

# Create directory on Pi
ssh $SSH_OPTS kkolk@$PI_HOST "mkdir -p ~/prusalink-auth"

# Copy auth-helper files
rsync -avz --delete -e "ssh $SSH_OPTS" \
  auth-helper/package.json \
  auth-helper/server.js \
  auth-helper/.env.example \
  auth-helper/README.md \
  auth-helper/systemd/ \
  kkolk@$PI_HOST:~/prusalink-auth/

# Install dependencies on Pi (source nvm first)
echo "Installing npm dependencies..."
ssh $SSH_OPTS kkolk@$PI_HOST "export NVM_DIR=\"\$HOME/.nvm\" && [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\" && cd ~/prusalink-auth && npm install --omit=dev"

# Get node path for systemd service
NODE_PATH=$(ssh $SSH_OPTS kkolk@$PI_HOST "export NVM_DIR=\"\$HOME/.nvm\" && [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\" && which node")
echo "Node.js path: $NODE_PATH"

# Update systemd service with correct node path
ssh $SSH_OPTS kkolk@$PI_HOST "sed -i 's|ExecStart=.*node server.js|ExecStart=$NODE_PATH server.js|' ~/prusalink-auth/prusalink-auth.service"

# Copy systemd service (requires sudo)
ssh $SSH_OPTS kkolk@$PI_HOST "sudo cp ~/prusalink-auth/prusalink-auth.service /etc/systemd/system/"

echo ""
echo "✅ Auth helper deployed successfully!"
echo ""
echo "Service status:"
ssh $SSH_OPTS kkolk@$PI_HOST "sudo systemctl is-active prusalink-auth 2>/dev/null || echo 'not running'"
echo ""
echo "To configure credentials and start service:"
echo "  ssh -i $SSH_KEY kkolk@$PI_HOST"
echo "  sudo nano /etc/systemd/system/prusalink-auth.service  # Set PRUSALINK_PASS"
echo "  sudo systemctl daemon-reload"
echo "  sudo systemctl enable prusalink-auth"
echo "  sudo systemctl restart prusalink-auth"
echo "  sudo systemctl status prusalink-auth"
