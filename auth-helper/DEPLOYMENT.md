# Auth-Helper Deployment Guide

## Credentials Setup

The auth-helper service requires PrusaLink credentials to authenticate requests. These are stored in a `.env` file for security.

### 1. Create `.env` File

Create `auth-helper/.env` with the following content:

```bash
PRUSALINK_USER=kkolk
PRUSALINK_PASS=your-actual-password
PORT=8080
```

**Security Notes:**
- The `.env` file has `600` permissions (owner read/write only)
- The `.env` file is in `.gitignore` and will NEVER be committed to git
- The deployment script reads `.env` locally but never transfers it to the Pi

### 2. Deploy

Run the deployment script:

```bash
./scripts/deploy-auth-helper.sh
```

The script will:
1. Load credentials from `auth-helper/.env`
2. Deploy auth-helper code to the Pi
3. Configure the systemd service with the credentials automatically
4. Enable and start the service

### 3. Verify Deployment

After deployment, verify the service is running:

```bash
just pi-status
```

Or check the logs:

```bash
ssh -i ~/.ssh/octopi_key kkolk@octopi.local.frostbyte.us "sudo journalctl -u prusalink-auth -f"
```

## Updating Password

If you change the PrusaLink password:

1. Update `auth-helper/.env` with the new password
2. Run `./scripts/deploy-auth-helper.sh` again

The deployment script will automatically update the service configuration.

## Troubleshooting

### Authentication Failures

If you see "Authentication failed" in logs:

1. Verify the password in `.env` matches PrusaLink's actual password
2. Check PrusaLink is running: `ssh -i ~/.ssh/octopi_key kkolk@octopi.local.frostbyte.us "sudo systemctl status prusalink"`
3. Test PrusaLink directly: `curl --digest -u kkolk:password http://octopi.local.frostbyte.us/api/v1/status`

### Service Not Running

Check service status:

```bash
ssh -i ~/.ssh/octopi_key kkolk@octopi.local.frostbyte.us "sudo systemctl status prusalink-auth"
```

View logs:

```bash
ssh -i ~/.ssh/octopi_key kkolk@octopi.local.frostbyte.us "sudo journalctl -u prusalink-auth -n 50"
```

## How It Works

The auth-helper service:
1. Listens on port 8080 for unauthenticated requests from the browser
2. Automatically adds HTTP Digest authentication headers
3. Proxies requests to PrusaLink on localhost port 80
4. Returns PrusaLink responses to the browser

This allows the SPA to communicate with PrusaLink without the browser needing to handle HTTP Digest auth.
