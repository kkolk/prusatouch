# PrusaTouch Deployment Guide

## Prerequisites

- Raspberry Pi 4 (1GB+ RAM) with Raspberry Pi OS
- HyperPixel 4 display (800x480) configured
- SSH access to Pi
- Node.js 24.x on development machine

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
- Transfer files to Pi
- Set proper permissions

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

### Page doesn't load
- Verify nginx/lighttpd is running
- Check logs: `sudo journalctl -u nginx -f`
- Verify PrusaLink base URL in `.env`

## Performance Verification

After deployment, verify on the Pi:

1. Open Chromium DevTools (F12)
2. Check Network tab - initial load should be <500KB
3. Navigate between views - should be <60ms
4. Verify 60fps animations (Performance tab)
