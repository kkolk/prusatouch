#!/bin/bash
# Deploy auth-helper service to Raspberry Pi

set -e

PI_HOST="${1:-octopi.local.frostbyte.us}"
SSH_KEY=~/.ssh/octopi_key
SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no"

echo "Deploying auth-helper to $PI_HOST..."

# Create directory on Pi
ssh $SSH_OPTS kkolk@$PI_HOST "mkdir -p /home/pi/prusalink-auth"

# Copy auth-helper files
rsync -avz --delete -e "ssh $SSH_OPTS" \
  auth-helper/package.json \
  auth-helper/server.js \
  auth-helper/.env.example \
  auth-helper/README.md \
  kkolk@$PI_HOST:/home/pi/prusalink-auth/

# Install dependencies on Pi
ssh $SSH_OPTS kkolk@$PI_HOST "cd /home/pi/prusalink-auth && npm install --production"

# Copy systemd service (requires sudo)
ssh $SSH_OPTS kkolk@$PI_HOST "sudo cp /home/pi/prusalink-auth/systemd/prusalink-auth.service /etc/systemd/system/" || true

echo "Auth helper deployed. Next steps:"
echo "1. SSH to Pi and set password in /etc/systemd/system/prusalink-auth.service"
echo "2. sudo systemctl daemon-reload"
echo "3. sudo systemctl enable prusalink-auth"
echo "4. sudo systemctl start prusalink-auth"
echo "5. Check status: sudo systemctl status prusalink-auth"
