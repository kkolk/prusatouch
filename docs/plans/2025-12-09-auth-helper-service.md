# Implementation Plan: Auth Helper Service for Kiosk

**Created:** 2025-12-09
**Goal:** Eliminate browser authentication popups by moving Digest auth to server-side proxy
**Status:** Ready for implementation

## Problem Statement

Current implementation uses digest-fetch in the browser, which triggers native browser password dialogs repeatedly. For a kiosk setup, this is unacceptable as it requires user interaction for every API request.

## Solution Architecture

```
Browser (no auth) → lighttpd:8080 → auth-helper:3000 → PrusaLink:80
                                         ↓
                              Handles Digest auth with
                              nonce caching (transparent)
```

**Key Insight:** Browser never sees 401/WWW-Authenticate headers → **NO POPUPS**

## Implementation Tasks

### Task 1: Create Auth Helper Service

**Directory:** `auth-helper/` (new, at repo root)

**File:** `auth-helper/package.json`
```json
{
  "name": "prusalink-auth-helper",
  "version": "1.0.0",
  "description": "Authentication proxy for PrusaLink - handles HTTP Digest auth transparently",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "digest-fetch": "^3.1.1"
  }
}
```

**File:** `auth-helper/server.js`

Implementation requirements:
- Express server listening on port 3000 (localhost only)
- Accept all requests to `/api/*`
- Forward to `http://127.0.0.1:80` (PrusaLink) with Digest auth
- Use digest-fetch for authentication (credentials from env vars)
- Handle all HTTP methods: GET, POST, PUT, DELETE, PATCH
- Forward request headers (except Host)
- Forward request body for POST/PUT/PATCH
- Return PrusaLink response status, headers, and body
- Log errors to console (not requests - too noisy)
- Graceful shutdown on SIGTERM/SIGINT

Environment variables:
- `PRUSALINK_USER` - Username for PrusaLink
- `PRUSALINK_PASS` - Password for PrusaLink
- `PORT` - Server port (default 3000)

Error handling:
- If credentials missing: log error and exit(1)
- If PrusaLink unreachable: return 503 with error message
- If Digest auth fails: log error and return 401

**File:** `auth-helper/.env.example`
```
PRUSALINK_USER=maker
PRUSALINK_PASS=your-password-here
PORT=3000
```

**File:** `auth-helper/README.md`

Document:
- Purpose: Transparent Digest auth proxy for kiosk deployments
- Requirements: Node.js 18+ (or 24+ as per project standard)
- Installation: `npm install`
- Configuration: Copy `.env.example` to `.env` and set credentials
- Running: `npm start`
- Systemd setup: See `systemd/prusalink-auth.service`

### Task 2: Create Systemd Service

**File:** `auth-helper/systemd/prusalink-auth.service`

```ini
[Unit]
Description=PrusaLink Authentication Helper
After=network.target prusalink.service
Requires=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/prusalink-auth
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
Environment="PRUSALINK_USER=maker"
Environment="PRUSALINK_PASS=<will-be-set-during-deployment>"
Environment="PORT=3000"

# Security hardening
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

**File:** `auth-helper/systemd/README.md`

Document installation:
```bash
# Copy service to Pi
sudo cp systemd/prusalink-auth.service /etc/systemd/system/

# Edit to set actual password
sudo nano /etc/systemd/system/prusalink-auth.service

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable prusalink-auth
sudo systemctl start prusalink-auth

# Check status
sudo systemctl status prusalink-auth
```

### Task 3: Update Lighttpd Configuration

**File:** `deployment/lighttpd/11-prusalink-proxy.conf` (new)

Replace existing `/etc/lighttpd/conf-available/11-prusalink-proxy.conf` on Pi:

```lighttpd
server.modules += ( "mod_proxy" )

# Proxy /api requests to auth-helper (which handles PrusaLink auth)
$HTTP["url"] =~ "^/api/" {
    proxy.server = ( "" => (
        (
            "host" => "127.0.0.1",
            "port" => 3000
        )
    ))
}
```

**Change:** Port 80 → Port 3000 (auth-helper instead of direct PrusaLink)

### Task 4: Simplify Browser Code

**File:** `src/api/digestAuth.ts` - **DELETE THIS FILE**

**File:** `src/api/core/request.ts`

Current code (lines 149-153):
```typescript
function getDefaultAxiosClient(): AxiosInstance {
  const username = import.meta.env.VITE_PRUSALINK_USER || ''
  const password = import.meta.env.VITE_PRUSALINK_PASS || ''
  return createDigestAuthClient(username, password)
}
```

**Replace with:**
```typescript
function getDefaultAxiosClient(): AxiosInstance {
  // Auth is now handled server-side by auth-helper
  // Just return a regular axios instance
  return axios.create()
}
```

**Remove import:**
```typescript
import { createDigestAuthClient } from '../digestAuth'  // DELETE THIS LINE
```

**File:** `vite.config.ts`

Current code (line 31):
```typescript
external: ['node-fetch']
```

**Remove this line** - no longer needed since we're not using digest-fetch in browser

**File:** `package.json`

**Remove dependency:**
```json
"digest-fetch": "^3.1.1"
```

**Run:** `npm install` to update package-lock.json

**File:** `.env.local`

**Remove these (no longer needed in browser):**
```
VITE_PRUSALINK_USER=maker
VITE_PRUSALINK_PASS=...
```

Keep only:
```
VITE_PRUSALINK_API_URL=/api/v1
```

### Task 5: Update Deployment Scripts

**File:** `scripts/deploy-auth-helper.sh` (new)

```bash
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
```

**Make executable:**
```bash
chmod +x scripts/deploy-auth-helper.sh
```

**File:** `scripts/deploy-to-pi.sh`

Add after lighttpd config deployment:
```bash
# Update lighttpd proxy config for auth-helper
scp $SSH_OPTS deployment/lighttpd/11-prusalink-proxy.conf \
  kkolk@$PI_HOST:/tmp/11-prusalink-proxy.conf
ssh $SSH_OPTS kkolk@$PI_HOST "sudo mv /tmp/11-prusalink-proxy.conf /etc/lighttpd/conf-available/11-prusalink-proxy.conf"
ssh $SSH_OPTS kkolk@$PI_HOST "sudo systemctl reload lighttpd"
```

### Task 6: Documentation

**File:** `deployment/lighttpd/README.md` (new)

Document the full architecture:
```markdown
# PrusaTouch Deployment Architecture

## Service Stack

```
Browser → lighttpd:8080 → auth-helper:3000 → PrusaLink:80
           (SPA)           (Digest auth)      (Printer API)
```

## Port Assignments

- 80: PrusaLink (Python service, requires Digest auth)
- 3000: Auth Helper (Node.js proxy, handles auth transparently)
- 8080: Lighttpd (serves SPA, proxies /api/* to auth-helper)

## Authentication Flow

1. Browser makes request: GET /api/v1/status
2. Lighttpd proxies to auth-helper:3000
3. Auth-helper adds Digest auth, forwards to PrusaLink:80
4. PrusaLink returns data (or 401 if nonce stale)
5. Auth-helper handles 401 silently, retries with new nonce
6. Auth-helper returns success to lighttpd
7. Browser receives response (never sees 401)

**Result:** No browser authentication popups!

## Deployment

See scripts:
- `scripts/deploy-auth-helper.sh` - Deploy/update auth helper
- `scripts/deploy-to-pi.sh` - Deploy SPA and configs

## Troubleshooting

Check logs:
```bash
# Auth helper
sudo journalctl -u prusalink-auth -f

# Lighttpd
sudo journalctl -u lighttpd -f

# PrusaLink
sudo journalctl -u prusalink -f
```

Test connectivity:
```bash
# Direct to PrusaLink (should require auth)
curl -i http://localhost:80/api/v1/status

# Through auth-helper (should return data)
curl http://localhost:3000/api/v1/status

# Through lighttpd (should return data)
curl http://localhost:8080/api/v1/status
```
```

**File:** `CLAUDE.md`

Update architecture section to document auth-helper:
```markdown
## Authentication Architecture (Updated 2025-12-09)

**Kiosk Mode:** Authentication handled server-side to prevent browser popups.

**Service Stack:**
```
Browser (no auth) → lighttpd:8080 → auth-helper:3000 → PrusaLink:80
```

**Auth Helper:** Node.js proxy service that transparently handles HTTP Digest authentication with PrusaLink. Credentials stored in systemd service environment variables (not in browser bundle).

**See:** `deployment/lighttpd/README.md` for full architecture documentation.
```

### Task 7: Testing Plan

**Unit Tests:** Not required (simple proxy, integration testing more valuable)

**Integration Testing:**

1. **Local development:**
   - Start auth-helper: `cd auth-helper && npm start`
   - Start dev server: `npm run dev`
   - Browser should load without auth prompts
   - API calls should succeed

2. **On Pi:**
   - Deploy auth-helper: `./scripts/deploy-auth-helper.sh`
   - Configure systemd and start service
   - Deploy SPA: `./scripts/deploy-to-pi.sh`
   - Test in Chromium: Open http://localhost:8080
   - Verify NO password popups
   - Verify printer status loads
   - Verify temperature data visible
   - Check logs: `sudo journalctl -u prusalink-auth -f`

3. **Kiosk mode test:**
   - Start Chromium in kiosk mode: `chromium-browser --kiosk http://localhost:8080`
   - Leave running for 30 minutes
   - Verify no popups appear
   - Verify polling continues working
   - Verify nonce refresh works (PrusaLink expires nonces periodically)

**Success Criteria:**
- ✅ Browser loads without any authentication prompts
- ✅ API calls succeed and return printer data
- ✅ Temperature data visible in UI
- ✅ Polling works continuously for 30+ minutes
- ✅ No password dialogs in kiosk mode
- ✅ Auth-helper logs show successful requests (no auth errors)

## Implementation Order

1. Create auth-helper service (Task 1)
2. Create systemd service config (Task 2)
3. Test auth-helper locally (connect to Pi's PrusaLink remotely)
4. Simplify browser code (Task 4)
5. Test browser + auth-helper locally
6. Create deployment scripts (Task 5)
7. Deploy to Pi and test
8. Update documentation (Task 6)
9. Full kiosk mode test (Task 7)

## Rollback Plan

If auth-helper doesn't work:
1. Revert browser code changes (restore digestAuth.ts)
2. Restore vite.config.ts (add back node-fetch external)
3. Restore request.ts to use createDigestAuthClient
4. Restore .env.local with credentials
5. Stop auth-helper service: `sudo systemctl stop prusalink-auth`
6. Revert lighttpd config to proxy directly to port 80

## Notes

- Auth-helper runs as `pi` user (same as lighttpd)
- Credentials stored in systemd env vars (not committed to git)
- digest-fetch handles nonce caching automatically (tested working in browser context)
- Port 3000 only accessible from localhost (no external access)
- Lighttpd and auth-helper restart automatically on boot (systemd)

## Security Considerations

**Before:** Credentials in .env.local → bundled in browser JS (visible in DevTools)
**After:** Credentials in systemd service file → only accessible with sudo on Pi

**Improvement:** Much better security posture for production kiosk deployment.

**Future:** Add login screen to allow users to enter credentials (not stored in config).
