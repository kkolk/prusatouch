# PrusaTouch Deployment Guide

## Prerequisites

- Raspberry Pi 4 (1GB+ RAM) with Raspberry Pi OS
- HyperPixel 4 display (800x480) configured
- SSH access to Pi
- Node.js 24.x on development machine
- **Note:** Deployment script will automatically install and configure lighttpd web server

## Quick Deployment

### 1. Build and Deploy

From your development machine:

```bash
# Deploy to default hostname (prusa-mk3s.local)
./scripts/deploy-to-pi.sh

# Deploy to custom hostname
./scripts/deploy-to-pi.sh raspberrypi.local
```

This script will:
- Build production bundle
- Verify performance targets
- Install and configure lighttpd web server (if needed)
- Transfer files to Pi
- Set proper permissions
- Restart web server and verify HTTP 200 response

### 2. Set Up Kiosk Mode

```bash
./scripts/setup-kiosk.sh prusa-mk3s.local
```

### 3. Verify

Open Chromium on the Pi and navigate to:
`http://localhost:8080`

Or from another device:
`http://prusa-mk3s.local:8080`

## Manual Deployment

If the script doesn't work, deploy manually:

1. **Build**:
   ```bash
   npm run build
   ```

2. **Transfer**:
   ```bash
   scp -r dist/* pi@prusa-mk3s.local:/var/www/html/prusatouch/
   ```

3. **Set permissions**:
   ```bash
   ssh pi@prusa-mk3s.local "sudo chown -R www-data:www-data /var/www/html/prusatouch && sudo chmod -R 755 /var/www/html/prusatouch"
   ```

## Troubleshooting

### Can't connect to Pi
- Verify hostname: `ping prusa-mk3s.local`
- Try IP address instead
- Check SSH is enabled: `sudo systemctl status ssh`

### Permission denied
- Ensure Pi user has sudo access
- Check directory ownership

### Web server issues

**Port 8080 already in use:**
- Check what's using it: `sudo netstat -tlnp | grep 8080`
- Stop conflicting service or choose different port
- Edit `DEPLOY_PATH` in deploy script

**lighttpd won't start:**
- Check logs: `sudo journalctl -u lighttpd -n 50`
- Common issue: Port 80 conflict (script uses 8080 to avoid this)
- Verify config: `sudo lighttpd -t -f /etc/lighttpd/lighttpd.conf`

**404 errors on navigation:**
- SPA routing may not be configured
- Check `/etc/lighttpd/conf-available/10-prusatouch.conf` exists
- Verify rewrite module enabled: `sudo lighttpd-enable-mod rewrite`

### Page doesn't load
- Verify lighttpd is running: `sudo systemctl status lighttpd`
- Check logs: `sudo journalctl -u lighttpd -f`
- Verify PrusaLink base URL in `.env`

## Authentication

PrusaTouch uses **HTTP Digest authentication** to communicate with PrusaLink.

### Configuration

Set credentials in `.env.local` (development) or environment variables (production):

```bash
VITE_PRUSALINK_USER=maker
VITE_PRUSALINK_PASS=your_password
```

### How It Works

1. App attempts API call to `/api/v1/status`
2. PrusaLink returns 401 with `WWW-Authenticate: Digest` challenge
3. axios-digest-auth intercepts the 401 and generates Authorization header
4. Request is retried with Digest credentials
5. PrusaLink returns 200 OK with data

### Troubleshooting Authentication

**All API calls return 401:**
- Check credentials in `.env.local`
- Verify PrusaLink username/password is correct
- Check browser console for auth errors

**CORS errors:**
- Ensure lighttpd reverse proxy is configured (see Web Server section)
- Verify `/api/*` requests are proxied to port 80

**Temperatures show 0°:**
- Authentication is failing
- Check Network tab for 401 responses
- Verify Digest auth challenge is present in response headers

## Manual lighttpd Setup (if script fails)

If the automated setup fails, configure manually:

```bash
# Install
sudo apt-get update
sudo apt-get install -y lighttpd

# Configure
sudo sed -i 's/server.port.*/server.port = 8080/' /etc/lighttpd/lighttpd.conf
sudo sed -i 's|server.document-root.*|server.document-root = "/opt/prusatouch"|' /etc/lighttpd/lighttpd.conf

# Enable modules
sudo lighttpd-enable-mod rewrite

# Restart
sudo systemctl restart lighttpd
```

## Performance Verification

After deployment, verify on the Pi:

1. Open Chromium DevTools (F12)
2. Check Network tab - initial load should be <500KB
3. Navigate between views - should be <60ms
4. Verify 60fps animations (Performance tab)
