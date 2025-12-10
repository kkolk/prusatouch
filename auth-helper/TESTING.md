# Auth-Helper Testing Plan

This document outlines the testing strategy for the PrusaLink Auth Helper service.

## Unit Tests

**Status:** Not required

The auth-helper is a simple proxy service with minimal logic:
- Express middleware for routing
- digest-fetch for authentication
- HTTP response forwarding

Integration testing provides more value than unit tests for this component.

## Integration Testing

### Local Development

1. **Start auth-helper:**
   ```bash
   cd auth-helper
   npm install
   npm start
   ```

2. **Start dev server:**
   ```bash
   npm run dev
   ```

3. **Verification:**
   - Browser should load without auth prompts
   - API calls should succeed (check Network tab in DevTools)
   - Check auth-helper logs for successful requests

### On Raspberry Pi

#### Prerequisites
- PrusaLink running on port 80
- Auth-helper deployed via `./scripts/deploy-auth-helper.sh`
- Credentials configured in systemd service
- Service started: `sudo systemctl start prusalink-auth`

#### Test Steps

1. **Deploy auth-helper:**
   ```bash
   ./scripts/deploy-auth-helper.sh
   ```

2. **Configure systemd service:**
   ```bash
   sudo nano /etc/systemd/system/prusalink-auth.service
   # Set PRUSALINK_PASS to actual password
   ```

3. **Enable and start:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable prusalink-auth
   sudo systemctl start prusalink-auth
   ```

4. **Deploy SPA:**
   ```bash
   ./scripts/deploy-to-pi.sh
   ```

5. **Test in browser:**
   - Open http://localhost:8080
   - Verify NO password popups appear
   - Verify printer status loads
   - Verify temperature data visible

6. **Check logs:**
   ```bash
   sudo journalctl -u prusalink-auth -f
   ```
   Watch for successful requests (no auth errors)

### Kiosk Mode Testing

This is the critical test for production readiness.

1. **Start Chromium in kiosk mode:**
   ```bash
   chromium-browser --kiosk http://localhost:8080
   ```

2. **Stress test (30 minutes minimum):**
   - Leave running
   - Monitor for any password popups
   - Verify polling continues working
   - Verify printer data updates every 2-5 seconds

3. **Nonce refresh test:**
   - PrusaLink expires digest nonces periodically
   - Auth-helper should silently handle 401 responses
   - Verify no interruption to polling

4. **Check logs:**
   ```bash
   sudo journalctl -u prusalink-auth -f
   ```
   Look for:
   - No persistent errors
   - Successful 200 responses
   - Occasional 401 (expected, auth-helper retries)

## Success Criteria

All of the following must be true:

- ✅ Browser loads without any authentication prompts
- ✅ API calls succeed and return printer data
- ✅ Temperature data visible in UI
- ✅ Polling works continuously for 30+ minutes
- ✅ No password dialogs in kiosk mode
- ✅ Auth-helper logs show successful requests (no persistent auth errors)

## Manual Testing Checklist

### Local (npm start)
- [ ] Auth-helper starts on port 3000
- [ ] Health check works: `curl http://127.0.0.1:3000/health`
- [ ] GET request works: `curl http://127.0.0.1:3000/api/v1/status`
- [ ] Response contains printer status JSON

### On Pi (systemd)
- [ ] Service is enabled: `systemctl is-enabled prusalink-auth`
- [ ] Service is running: `systemctl status prusalink-auth`
- [ ] Port 3000 is listening: `sudo netstat -tlnp | grep 3000`
- [ ] Logs show successful startup: `journalctl -u prusalink-auth -n 5`

### SPA Deployment
- [ ] SPA loads at http://localhost:8080
- [ ] No console errors (F12 → Console)
- [ ] Network tab shows API calls to http://localhost:8080/api/*
- [ ] Printer status visible
- [ ] Temperature graph renders

### Kiosk Mode
- [ ] No auth popups on startup
- [ ] No auth popups during 30-minute run
- [ ] Polling works continuously
- [ ] Temperature data updates every ~2-5 seconds

## Troubleshooting

### Auth-helper won't start
```bash
# Check for port conflicts
sudo netstat -tlnp | grep 3000

# Check environment variables
sudo cat /etc/systemd/system/prusalink-auth.service

# Check logs
sudo journalctl -u prusalink-auth -n 20
```

### 503 Service Unavailable
- Check PrusaLink is running: `curl -i http://127.0.0.1:80/api/v1/status`
- Check credentials are correct in systemd service
- Check auth-helper logs for connection errors

### Authentication failing (401)
- This should be handled automatically by auth-helper
- If persistent, check credentials in systemd service
- Restart auth-helper: `sudo systemctl restart prusalink-auth`

### Nonce stale errors
- Auth-helper should handle these automatically
- If persistent, restart service: `sudo systemctl restart prusalink-auth`
