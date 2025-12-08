# Fix Deployment Script - Web Server Setup

**Created:** 2025-12-07
**Status:** Ready for implementation
**Priority:** High - Blocks automated deployment

## Goal

Update `scripts/deploy-to-pi.sh` to automatically install and configure lighttpd web server on Raspberry Pi, eliminating manual setup steps discovered during initial deployment.

## Context

**Problem discovered:** Initial deployment to `octopi.local.frostbyte.us` succeeded in transferring files but failed to serve the application because:
1. No web server was installed on the Pi
2. Port 80 is occupied by OctoPrint/PrusaLink (Python process)
3. Manual lighttpd installation and configuration was required

**Solution:** Enhance deployment script to detect, install, and configure lighttpd automatically on port 8080 with reverse proxy to PrusaLink API to avoid CORS issues.

## Prerequisites

- Deployment script exists: `scripts/deploy-to-pi.sh`
- SSH access to target Pi configured
- Target Pi running Debian-based OS (Raspberry Pi OS)

## Implementation Plan

### Task 1: Add Web Server Detection and Installation

**Files to modify:**
- M: `scripts/deploy-to-pi.sh:1-120`

**Steps:**

1. Add function to check if lighttpd is installed:

```bash
# Add after the color definitions (around line 10)
check_lighttpd() {
  echo "🔍 Checking for web server..."
  ssh ${PI_USER}@${PI_HOST} "which lighttpd > /dev/null 2>&1" && return 0 || return 1
}
```

2. Add function to install lighttpd:

```bash
install_lighttpd() {
  echo "📦 Installing lighttpd web server..."
  ssh ${PI_USER}@${PI_HOST} "sudo apt-get update && sudo apt-get install -y lighttpd" || {
    echo "❌ Failed to install lighttpd"
    exit 1
  }
  echo -e "${GREEN}✓ lighttpd installed${NC}"
}
```

3. Insert web server check after Step 2 (performance verification):

```bash
# Step 3: Check/Install Web Server
if ! check_lighttpd; then
  echo "lighttpd not found, installing..."
  install_lighttpd
else
  echo -e "${GREEN}✓ lighttpd already installed${NC}"
fi
echo ""
```

4. Renumber subsequent steps (deployment directory becomes Step 4, etc.)

**Verification:**
- Run script on Pi without lighttpd - should install automatically
- Run script on Pi with lighttpd - should skip installation

### Task 2: Add lighttpd Configuration

**Files to modify:**
- M: `scripts/deploy-to-pi.sh:1-150`

**Steps:**

1. Add function to configure lighttpd after the install function:

```bash
configure_lighttpd() {
  echo "⚙️  Configuring lighttpd..."

  # Set port 8080 (avoid conflict with OctoPrint on port 80)
  ssh ${PI_USER}@${PI_HOST} "sudo sed -i 's/server.port.*/server.port = 8080/' /etc/lighttpd/lighttpd.conf"

  # Set document root to PrusaTouch
  ssh ${PI_USER}@${PI_HOST} "sudo sed -i 's|server.document-root.*|server.document-root = \"${DEPLOY_PATH}\"|' /etc/lighttpd/lighttpd.conf"

  echo -e "${GREEN}✓ lighttpd configured for port 8080${NC}"
}
```

2. Add function to enable SPA routing:

```bash
configure_spa_routing() {
  echo "🔀 Configuring SPA routing..."

  # Enable rewrite module
  ssh ${PI_USER}@${PI_HOST} "sudo lighttpd-enable-mod rewrite > /dev/null 2>&1 || true"

  # Create PrusaTouch config for SPA fallback
  ssh ${PI_USER}@${PI_HOST} 'sudo tee /etc/lighttpd/conf-available/10-prusatouch.conf > /dev/null << "EOF"
server.modules += ( "mod_rewrite" )

# SPA fallback - serve index.html for all routes
url.rewrite-once = (
    "^/assets/(.*)$" => "/assets/$1",
    "^/(.*)$" => "/index.html"
)
EOF'

  # Enable PrusaTouch config
  ssh ${PI_USER}@${PI_HOST} "sudo lighttpd-enable-mod prusatouch > /dev/null 2>&1 || true"

  echo -e "${GREEN}✓ SPA routing enabled${NC}"
}
```

3. Call configuration functions after web server check/install:

```bash
# Configure lighttpd
configure_lighttpd
configure_spa_routing
echo ""
```

**Verification:**
- Check `/etc/lighttpd/lighttpd.conf` on Pi shows port 8080
- Check document root points to `/opt/prusatouch` (or custom DEPLOY_PATH)
- Verify `/etc/lighttpd/conf-available/10-prusatouch.conf` exists

### Task 3: Add lighttpd Service Management

**Files to modify:**
- M: `scripts/deploy-to-pi.sh:1-180`

**Steps:**

1. Add function to restart lighttpd after file transfer step:

```bash
restart_lighttpd() {
  echo "🔄 Restarting lighttpd..."
  ssh ${PI_USER}@${PI_HOST} "sudo systemctl restart lighttpd" || {
    echo "❌ Failed to restart lighttpd"
    exit 1
  }

  # Wait for service to start
  sleep 2

  echo -e "${GREEN}✓ lighttpd restarted${NC}"
}
```

2. Insert after file transfer and permissions (becomes new step):

```bash
# Step 6: Restart Web Server
restart_lighttpd
echo ""
```

**Verification:**
- `systemctl status lighttpd` shows active (running)
- No restart failures in output

### Task 4: Add HTTP Response Verification

**Files to modify:**
- M: `scripts/deploy-to-pi.sh:1-200`

**Steps:**

1. Update the existing verification step to check HTTP response:

```bash
# Step 7: Verify deployment
echo "✅ Verifying deployment..."

# Check files exist
ssh ${PI_USER}@${PI_HOST} "ls -lh ${DEPLOY_PATH}/index.html" || {
  echo "❌ index.html not found on Pi"
  exit 1
}

# Check HTTP response
HTTP_CODE=$(ssh ${PI_USER}@${PI_HOST} "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/")
if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ HTTP server responding (200 OK)${NC}"
else
  echo -e "${RED}❌ HTTP server not responding correctly (got $HTTP_CODE)${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Deployment verified${NC}"
```

2. Update final success message to show correct port:

```bash
echo "Access PrusaTouch at: http://${PI_HOST}:8080"
```

**Verification:**
- Script exits with error if HTTP check fails
- Success message shows port 8080

### Task 5: Update Deployment Documentation

**Files to modify:**
- M: `docs/deployment.md:1-100`

**Steps:**

1. Add web server section to prerequisites:

```markdown
## Prerequisites

- Raspberry Pi 4 (1GB+ RAM) with Raspberry Pi OS
- HyperPixel 4 display (800x480) configured
- SSH access to Pi
- Node.js 24.x on development machine
- **Note:** Deployment script will automatically install and configure lighttpd web server
```

2. Add troubleshooting section for web server:

```markdown
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
```

3. Add manual lighttpd configuration section:

```markdown
## Manual lighttpd Setup (if script fails)

If the automated setup fails, configure manually:

\`\`\`bash
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
\`\`\`
```

**Verification:**
- Documentation clearly states web server is auto-installed
- Troubleshooting covers common issues encountered
- Manual fallback instructions provided

### Task 6: Test Updated Script

**Files to test:**
- `scripts/deploy-to-pi.sh`

**Test scenarios:**

1. **Fresh Pi (no lighttpd):**
   ```bash
   # On Pi: Remove lighttpd if installed
   ssh -i ~/.ssh/octopi_key kkolk@octopi.local.frostbyte.us 'sudo apt-get remove -y lighttpd'

   # Run deployment
   ./scripts/deploy-to-pi.sh octopi.local.frostbyte.us

   # Expected: Installs lighttpd, configures, deploys, HTTP 200
   ```

2. **Existing lighttpd:**
   ```bash
   # Run deployment again (lighttpd already installed)
   ./scripts/deploy-to-pi.sh octopi.local.frostbyte.us

   # Expected: Skips install, reconfigures, deploys, HTTP 200
   ```

3. **Verify SPA routing:**
   ```bash
   # Access app at http://octopi.local.frostbyte.us:8080
   # Navigate to /files route
   # Refresh page - should serve index.html, not 404
   ```

**Verification:**
- All test scenarios pass
- No errors in script output
- HTTP 200 response from http://[pi-host]:8080
- SPA routing works (no 404 on refresh)

### Task 7: Commit Changes

**Files to commit:**
- `scripts/deploy-to-pi.sh`
- `docs/deployment.md`
- `docs/plans/2025-12-07-fix-deployment-web-server.md` (this plan)

**Commit message:**

```bash
git add scripts/deploy-to-pi.sh docs/deployment.md docs/plans/2025-12-07-fix-deployment-web-server.md
git commit -m "fix: add automatic web server setup to deployment script

- Auto-detect and install lighttpd if missing
- Configure for port 8080 (avoids OctoPrint conflict on port 80)
- Set document root to PrusaTouch deployment path
- Enable SPA routing with rewrite module
- Verify HTTP 200 response after deployment
- Update docs with troubleshooting and manual fallback

Fixes issue discovered during initial deployment where files were
transferred successfully but no web server was available to serve them.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Verification:**
- Clean commit with descriptive message
- All modified files included
- Conventional commit format followed

## Success Criteria

✅ Deployment script runs without errors on fresh Pi
✅ lighttpd automatically installed and configured
✅ Application accessible at http://[pi-host]:8080
✅ HTTP 200 response verified
✅ SPA routing works (no 404 on route refresh)
✅ Documentation updated with troubleshooting
✅ Changes committed with proper message

## Notes

- Port 8080 chosen to avoid conflict with OctoPrint/PrusaLink on port 80
- Script uses `sudo apt-get` which requires Pi user to have sudo access
- lighttpd chosen over nginx for lower memory footprint (better for 1GB Pi)
- SPA rewrite rules ensure Vue Router works correctly
- Script is idempotent - safe to run multiple times

## Rollback Plan

If issues occur:
1. SSH to Pi: `ssh -i ~/.ssh/octopi_key kkolk@octopi.local.frostbyte.us`
2. Stop lighttpd: `sudo systemctl stop lighttpd`
3. Remove lighttpd: `sudo apt-get remove lighttpd`
4. Revert script: `git checkout HEAD~1 scripts/deploy-to-pi.sh`

### Task 2.5: Add API Reverse Proxy (CORS Fix)

**Context:** Browser CORS policy blocks cross-origin requests. PrusaTouch on port 8080 cannot directly call PrusaLink API on port 80. Solution: Configure lighttpd to proxy `/api/*` requests to PrusaLink, making them same-origin from browser perspective.

**Files to modify:**
- M: `scripts/deploy-to-pi.sh:1-180`

**Steps:**

1. Add function to configure API proxy after `configure_spa_routing()`:

```bash
configure_api_proxy() {
  echo "🔀 Configuring API reverse proxy..."

  # Enable proxy module
  ssh ${PI_USER}@${PI_HOST} "sudo lighttpd-enable-mod proxy > /dev/null 2>&1 || true"

  # Create proxy configuration for PrusaLink API
  ssh ${PI_USER}@${PI_HOST} 'sudo tee /etc/lighttpd/conf-available/11-prusalink-proxy.conf > /dev/null << "PROXYEOF"
server.modules += ( "mod_proxy" )

# Proxy /api requests to PrusaLink on port 80
$HTTP["url"] =~ "^/api/" {
    proxy.server = ( "" => (
        ( 
            "host" => "127.0.0.1",
            "port" => 80
        )
    ))
}
PROXYEOF'

  # Enable proxy configuration
  ssh ${PI_USER}@${PI_HOST} "sudo lighttpd-enable-mod prusalink-proxy > /dev/null 2>&1 || true"

  echo -e "${GREEN}✓ API proxy configured${NC}"
}
```

2. Call `configure_api_proxy` after `configure_spa_routing()`:

```bash
# Configure lighttpd
configure_lighttpd
configure_spa_routing
configure_api_proxy  # Add this line
echo ""
```

**Verification:**
- Check `/etc/lighttpd/conf-available/11-prusalink-proxy.conf` exists
- Verify proxy module enabled: `lighttpd-mods-enabled | grep proxy`
- Test proxy: `curl -I http://localhost:8080/api/v1/version` should return PrusaLink response
- Browser console should show no CORS errors

**Why This Matters:**
- **Before:** Browser at `http://octopi:8080` → API at `http://octopi:80` = CORS error ❌
- **After:** Browser at `http://octopi:8080/api/...` → lighttpd proxies to `localhost:80/api/...` = Same origin ✅
- Works from any device on network (laptop, phone, tablet)


## Security Enhancement Needed

### Issue: Credentials Hardcoded in JavaScript Bundle

**Current Implementation:**
- Credentials stored in `.env.local` (development machine)
- Build process bakes credentials into JavaScript bundle
- Anyone can inspect browser DevTools → Sources → Search for "maker" to find password
- Not secure for production deployment

**Recommended Solution: Add Login Screen**

Create a new implementation plan for:

1. **Remove credentials from build:**
   - Remove `VITE_PRUSALINK_USER` and `VITE_PRUSALINK_PASS` from environment variables
   - Keep only `VITE_PRUSALINK_URL` (or use relative URL)

2. **Add login screen:**
   - Show login form on first load if no credentials in localStorage
   - Store credentials in browser's localStorage after successful auth
   - Add "Logout" option in Settings to clear stored credentials

3. **Implement auth flow:**
   - On app load: Check localStorage for credentials
   - If found: Use them, test connection, proceed if valid
   - If not found or invalid: Show login screen
   - After login: Store in localStorage, initialize stores

4. **Add session management:**
   - Detect 401 responses from API
   - Clear localStorage and show login screen on auth failure
   - Add "Remember me" checkbox (optional)

**Benefits:**
- Secure: Credentials never in source code or JavaScript bundle
- Flexible: Each user/device can have own credentials
- Better UX: One-time login per device
- Multi-user: Different users can log in to same kiosk

**Files to create/modify:**
- `src/views/LoginView.vue` (new)
- `src/composables/useAuth.ts` (new) 
- `src/router/index.ts` (add auth guard)
- `src/api/auth.ts` (update to use localStorage)
- Remove credentials from `.env.local`

**Priority:** High - Current implementation is a security risk


## Critical Issue: HTTP Digest Authentication Required

### Problem Discovered (2025-12-07)

PrusaLink uses **HTTP Digest authentication**, not Basic auth. Current OpenAPI client only supports Basic auth, causing all API calls to fail with 401 Unauthorized.

**Evidence:**
```
WWW-Authenticate: Digest realm="Administrator",qop="auth",algorithm="MD5-sess",nonce="...",opaque="..."
```

**Symptoms:**
- Browser shows 0° temperatures (API calls fail)
- Network tab shows 401 responses
- Console shows no obvious errors (auth silently fails)

### Solution: Implement HTTP Digest Auth

**Implementation Plan:**

1. **Install axios-digest-auth package:**
   ```bash
   npm install axios-digest-auth
   ```

2. **Create Digest auth interceptor** (`src/api/digestAuth.ts`):
   ```typescript
   import axios from 'axios'
   import digestAuth from 'axios-digest-auth'
   
   export function createDigestAuthClient(username: string, password: string) {
     return digestAuth({
       username,
       password,
       async: true
     })
   }
   ```

3. **Update API client configuration** (`src/api/auth.ts`):
   - Remove `OpenAPI.USERNAME` and `OpenAPI.PASSWORD` (doesn't work for Digest)
   - Configure axios instance with Digest auth interceptor
   - Pass credentials to Digest auth handler

4. **Update request.ts to use Digest client:**
   - Replace default axios instance with Digest-enabled one
   - Ensure all API calls go through Digest auth interceptor

5. **Test authentication:**
   ```bash
   # From Pi, test with curl Digest auth:
   curl --digest username:password http://localhost:80/api/v1/status
   ```

**Files to modify:**
- `package.json` - Add axios-digest-auth dependency
- `src/api/digestAuth.ts` (new) - Digest auth setup
- `src/api/auth.ts` - Configure Digest auth instead of Basic
- `src/api/core/request.ts` - Use Digest-enabled axios instance

**Verification:**
- API calls return 200 OK with actual printer data
- Browser console shows successful API responses
- Temperatures display correctly (not 0°)
- Print status updates in real-time

**Priority:** CRITICAL - App non-functional without this

**Estimated effort:** 1-2 hours (library integration + testing)

