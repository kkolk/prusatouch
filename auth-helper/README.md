# PrusaLink Auth Helper

A transparent HTTP Digest authentication proxy for PrusaLink, designed for kiosk deployments where browser-based digest auth is not supported.

## Purpose

This service acts as an intermediary between the PrusaTouch web application and PrusaLink. It handles HTTP Digest authentication transparently, allowing the browser to make simple HTTP requests without implementing digest auth client-side.

## Requirements

- Node.js 18+ (project standard: 24+ LTS)
- Express.js 4.18+
- digest-fetch 3.1+

## Installation

```bash
cd auth-helper
npm install
```

## Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set your PrusaLink credentials:
   ```
   PRUSALINK_USER=maker
   PRUSALINK_PASS=your-password-here
   PORT=3000
   ```

**Note:** Do not commit `.env` to version control. It contains sensitive credentials.

## Running

Start the service:

```bash
npm start
```

The service will listen on `127.0.0.1:3000` and forward all requests to `/api/*` to the local PrusaLink instance at `127.0.0.1:80`.

## Health Check

A health check endpoint is available at `/health` (returns `{"status": "ok"}`).

## Systemd Integration

For production deployments on Raspberry Pi, the service should be run under systemd. See `systemd/prusalink-auth.service` for configuration details.

## Error Handling

- **Missing credentials:** Service logs error and exits with code 1
- **PrusaLink unreachable:** Returns HTTP 503 with error message
- **Authentication failure:** Returns HTTP 401 with error message
- **Other errors:** Logged to console, returns HTTP 503

## Request/Response Flow

```
Browser → PrusaTouch (http://localhost:3000/api/*)
         ↓
Auth Helper (127.0.0.1:3000)
         ↓
PrusaLink (127.0.0.1:80) [with Digest auth]
         ↓
Response back to Browser
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PRUSALINK_USER` | (required) | Username for PrusaLink authentication |
| `PRUSALINK_PASS` | (required) | Password for PrusaLink authentication |
| `PORT` | 3000 | Port to listen on (localhost only) |
