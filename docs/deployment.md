# PrusaTouch Deployment Guide

## Prerequisites

- Raspberry Pi 4 (1GB+ RAM) with Raspberry Pi OS
- HyperPixel 4 display (800x480) configured
- SSH access to Pi with SSH key authentication
- Node.js 24.x on development machine
- Node.js 24.x on Raspberry Pi (automatically installed by deployment scripts)

## Architecture Overview

PrusaTouch uses a simple 2-tier architecture:

```
Browser → auth-helper:8080 → PrusaLink:80
          (serves SPA + proxies API with digest auth)
```

**Key components:**
- `auth-helper` - Node.js service that serves the SPA and proxies API calls to PrusaLink with HTTP Digest authentication
- `prusatouch-kiosk` - Systemd service that launches Chromium in kiosk mode on boot

**Port assignments:**
- **80:** PrusaLink (Python service, requires Digest auth)
- **8080:** Auth-helper (Node.js, serves SPA + proxies API)

## Quick Deployment

### 1. Deploy Auth Helper

From your development machine:

```bash
# Deploy auth-helper to default hostname (octopi.local.frostbyte.us)
./scripts/deploy-auth-helper.sh

# Deploy to custom hostname
./scripts/deploy-auth-helper.sh my-pi.local
```

This script will:
- Install Node.js 24.x on Pi (if needed)
- Transfer auth-helper service files
- Install npm dependencies
- Install systemd service

After deployment, SSH into the Pi and configure credentials:

```bash
ssh -i ~/.ssh/octopi_key kkolk@octopi.local.frostbyte.us
sudo nano /etc/systemd/system/prusalink-auth.service  # Set PRUSALINK_PASS
sudo systemctl daemon-reload
sudo systemctl enable prusalink-auth
sudo systemctl restart prusalink-auth
```

### 2. Deploy SPA Build

Build and deploy the PrusaTouch web application:

```bash
npm run build
./scripts/deploy-to-pi.sh
```

The SPA is deployed to `/opt/prusatouch/dist/` and served by auth-helper.

### 3. Set Up Kiosk Mode

Configure Chromium to auto-launch in kiosk mode on boot:

```bash
./scripts/setup-kiosk.sh
```

This script will:
- Install Chromium, unclutter, and xdotool
- Deploy kiosk launch script
- Configure desktop autostart
- Disable screen blanking
- Install and enable systemd service for automatic restart

### 4. Verify

Check services are running:

```bash
ssh -i ~/.ssh/octopi_key kkolk@octopi.local.frostbyte.us 'sudo systemctl status prusalink-auth && sudo systemctl status prusatouch-kiosk'
```

Access the application:
- From Pi: `http://localhost:8080`
- From network: `http://octopi.local.frostbyte.us:8080`

## Manual Deployment

If the script doesn't work, deploy manually:

1. **Build**:
   ```bash
   npm run build
   ```

2. **Transfer**:
   ```bash
   rsync -avz -e "ssh -i ~/.ssh/octopi_key" dist/ kkolk@octopi.local.frostbyte.us:/opt/prusatouch/dist/
   ```

3. **Set permissions**:
   ```bash
   ssh -i ~/.ssh/octopi_key kkolk@octopi.local.frostbyte.us "sudo chown -R kkolk:kkolk /opt/prusatouch/dist && sudo chmod -R 755 /opt/prusatouch/dist"
   ```

4. **Restart auth-helper**:
   ```bash
   ssh -i ~/.ssh/octopi_key kkolk@octopi.local.frostbyte.us "sudo systemctl restart prusalink-auth"
   ```

## Troubleshooting

### Can't connect to Pi
- Verify hostname: `ping prusa-mk3s.local`
- Try IP address instead
- Check SSH is enabled: `sudo systemctl status ssh`

### Permission denied
- Ensure Pi user has sudo access
- Check directory ownership

### Service issues

**Port 8080 already in use:**
- Check what's using it: `sudo netstat -tlnp | grep 8080`
- Stop conflicting service: `sudo systemctl stop <service-name>`
- Adjust port in `/etc/systemd/system/prusalink-auth.service`

**Auth-helper won't start:**
- Check logs: `sudo journalctl -u prusalink-auth -n 50`
- Verify Node.js is installed: `ssh kkolk@pi 'node --version'`
- Check server.js exists: `ls ~/prusalink-auth/server.js`
- Verify credentials are set in systemd service

**404 errors on API calls:**
- Check auth-helper is proxying correctly
- Verify PrusaLink is running: `curl http://localhost:80/api/v1/status`
- Check logs: `sudo journalctl -u prusalink-auth -f`

### Page doesn't load
- Verify auth-helper is running: `sudo systemctl status prusalink-auth`
- Check logs: `sudo journalctl -u prusalink-auth -f`
- Verify SPA files exist: `ls /opt/prusatouch/dist/`
- Check port 8080 is accessible: `curl http://localhost:8080`

## Authentication

PrusaTouch uses **server-side HTTP Digest authentication** to communicate with PrusaLink in kiosk mode. The auth-helper service handles all authentication transparently - the browser never sees authentication prompts.

### Configuration

Set credentials in the systemd service environment variables:

```bash
sudo nano /etc/systemd/system/prusalink-auth.service
```

Edit the `Environment` variables:

```ini
Environment="PRUSALINK_USER=kkolk"
Environment="PRUSALINK_PASS=your_password_here"
Environment="PRUSALINK_HOST=127.0.0.1"
Environment="PRUSALINK_PORT=80"
Environment="SPA_PATH=/opt/prusatouch/dist"
```

After editing, restart the service:

```bash
sudo systemctl daemon-reload
sudo systemctl restart prusalink-auth
```

### How It Works

1. Browser makes request to `http://localhost:8080/api/v1/status`
2. Auth-helper receives request and proxies to PrusaLink
3. If PrusaLink returns 401, auth-helper generates custom Digest auth header
4. Auth-helper retries request with authentication
5. Response is returned to browser (no auth popups!)

**Why custom implementation?** PrusaLink uses non-standard MD5-sess algorithm with opaque parameter. All standard digest auth libraries fail. See `docs/digest_auth_summary.md` for details.

### Troubleshooting Authentication

**All API calls return 401:**
- Check credentials in `/etc/systemd/system/prusalink-auth.service`
- Verify PrusaLink username/password is correct
- Check logs: `sudo journalctl -u prusalink-auth -n 50`

**Service won't start:**
- Check logs: `sudo journalctl -u prusalink-auth -xe`
- Verify Node.js path is correct in ExecStart
- Ensure `/home/kkolk/prusalink-auth/server.js` exists

**Browser shows auth popup:**
- Auth-helper may not be running
- Check service: `sudo systemctl status prusalink-auth`
- Verify you're accessing `http://localhost:8080` not `http://localhost:80`

## Kiosk Mode

PrusaTouch runs in full-screen kiosk mode using Chromium. The setup script configures everything automatically.

### How Kiosk Mode Works

1. **Auto-login**: Raspberry Pi OS configured to auto-login user `kkolk` on boot
2. **Desktop autostart**: `~/.config/autostart/kiosk-autostart.desktop` launches kiosk script
3. **Systemd service**: `/etc/systemd/system/prusatouch-kiosk.service` (recommended, more robust)
4. **Kiosk script**: `/home/kkolk/start-prusatouch.sh` disables blanking and launches Chromium

### Manual Kiosk Setup

If the automated setup fails:

```bash
# Install dependencies
sudo apt-get install -y chromium unclutter xdotool

# Create startup script
cat > ~/start-prusatouch.sh << 'EOF'
#!/bin/bash
xset s off
xset -dpms
xset s noblank
unclutter -idle 0.1 -root &
sleep 5
chromium --kiosk --noerrdialogs --disable-infobars \
  --disable-session-crashed-bubble --disable-component-update \
  --check-for-update-interval=31536000 \
  --app=http://localhost:8080
EOF
chmod +x ~/start-prusatouch.sh

# Create systemd service
sudo tee /etc/systemd/system/prusatouch-kiosk.service << 'EOF'
[Unit]
Description=PrusaTouch Kiosk Mode (Chromium)
After=graphical.target prusalink-auth.service
Wants=prusalink-auth.service

[Service]
Type=simple
Environment=DISPLAY=:0
Environment=XAUTHORITY=/home/kkolk/.Xauthority
ExecStartPre=/bin/sleep 10
ExecStart=/home/kkolk/start-prusatouch.sh
Restart=always
RestartSec=5
User=kkolk

[Install]
WantedBy=graphical.target
EOF

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable prusatouch-kiosk
```

### Testing Kiosk Mode

After setup, reboot the Pi:

```bash
ssh -i ~/.ssh/octopi_key kkolk@octopi.local.frostbyte.us 'sudo reboot'
```

The system should:
1. Boot to graphical desktop (auto-login)
2. Wait 10 seconds for network
3. Launch Chromium in full-screen kiosk mode
4. Load PrusaTouch at `http://localhost:8080`

### Troubleshooting Kiosk Mode

**Chromium doesn't launch on boot:**
- Check service: `sudo systemctl status prusatouch-kiosk`
- Check logs: `sudo journalctl -u prusatouch-kiosk -n 50`
- Verify auto-login: `cat /etc/lightdm/lightdm.conf | grep autologin-user`

**Kiosk crashes/exits:**
- Check Chromium logs: `journalctl --user -u prusatouch-kiosk`
- Verify auth-helper is running: `sudo systemctl status prusalink-auth`
- Check network connectivity: `ping 127.0.0.1`

**Screen blanking still occurs:**
- Verify lightdm config: `/etc/lightdm/lightdm.conf.d/01-disable-blanking.conf`
- Check xset settings in startup script
- Disable DPMS in Pi configuration

**Chromium shows "Restore session" dialog:**
- Add `--disable-session-crashed-bubble` to chromium flags (already in template)
- Delete Chromium profile: `rm -rf ~/.config/chromium/`

## Performance Verification

After deployment, verify on the Pi:

1. Open Chromium DevTools (F12)
2. Check Network tab - initial load should be <500KB
3. Navigate between views - should be <60ms
4. Verify 60fps animations (Performance tab)
