#!/bin/bash
# Deploy auth-helper service to Raspberry Pi (idempotent)

set -e

PI_HOST="${1:-octopi.local.frostbyte.us}"
SSH_KEY=~/.ssh/octopi_key
SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no"
AUTH_HELPER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../auth-helper" && pwd)"

# Load credentials from .env file
if [ -f "$AUTH_HELPER_DIR/.env" ]; then
    echo "Loading credentials from .env..."
    source "$AUTH_HELPER_DIR/.env"
else
    echo "ERROR: .env file not found at $AUTH_HELPER_DIR/.env"
    echo "Please create it with PRUSALINK_USER and PRUSALINK_PASS"
    exit 1
fi

if [ -z "$PRUSALINK_USER" ] || [ -z "$PRUSALINK_PASS" ]; then
    echo "ERROR: PRUSALINK_USER and PRUSALINK_PASS must be set in .env"
    exit 1
fi

echo "Using username: $PRUSALINK_USER"

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

# Copy auth-helper files (excluding .env for security)
rsync -avz --delete -e "ssh $SSH_OPTS" \
  --exclude='.env' \
  "$AUTH_HELPER_DIR/package.json" \
  "$AUTH_HELPER_DIR/server.js" \
  "$AUTH_HELPER_DIR/.env.example" \
  "$AUTH_HELPER_DIR/README.md" \
  "$AUTH_HELPER_DIR/systemd/" \
  kkolk@$PI_HOST:~/prusalink-auth/

# Install dependencies on Pi (source nvm first)
echo "Installing npm dependencies..."
ssh $SSH_OPTS kkolk@$PI_HOST "export NVM_DIR=\"\$HOME/.nvm\" && [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\" && cd ~/prusalink-auth && npm install --omit=dev"

# Get node path for systemd service
NODE_PATH=$(ssh $SSH_OPTS kkolk@$PI_HOST "export NVM_DIR=\"\$HOME/.nvm\" && [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\" && which node")
echo "Node.js path: $NODE_PATH"

# Update systemd service with correct node path and credentials
echo "Configuring systemd service with credentials..."
ssh $SSH_OPTS kkolk@$PI_HOST "sed -i 's|ExecStart=.*node server.js|ExecStart=$NODE_PATH server.js|' ~/prusalink-auth/prusalink-auth.service"
ssh $SSH_OPTS kkolk@$PI_HOST "sed -i 's|Environment=\"PRUSALINK_USER=.*\"|Environment=\"PRUSALINK_USER=$PRUSALINK_USER\"|' ~/prusalink-auth/prusalink-auth.service"
ssh $SSH_OPTS kkolk@$PI_HOST "sed -i 's|Environment=\"PRUSALINK_PASS=.*\"|Environment=\"PRUSALINK_PASS=$PRUSALINK_PASS\"|' ~/prusalink-auth/prusalink-auth.service"

# Copy systemd service (requires sudo)
ssh $SSH_OPTS kkolk@$PI_HOST "sudo cp ~/prusalink-auth/prusalink-auth.service /etc/systemd/system/"

# Enable and restart service
echo "Enabling and starting prusalink-auth service..."
ssh $SSH_OPTS kkolk@$PI_HOST "sudo systemctl daemon-reload"
ssh $SSH_OPTS kkolk@$PI_HOST "sudo systemctl enable prusalink-auth"
ssh $SSH_OPTS kkolk@$PI_HOST "sudo systemctl restart prusalink-auth"

echo ""
echo "✅ Auth helper deployed and configured successfully!"
echo ""
echo "Service status:"
ssh $SSH_OPTS kkolk@$PI_HOST "sudo systemctl status prusalink-auth --no-pager | head -10"
echo ""
echo "✅ Credentials automatically loaded from .env file"
echo "✅ Service is running with PRUSALINK_USER=$PRUSALINK_USER"
