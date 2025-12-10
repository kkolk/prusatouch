# PrusaTouch Deployment Architecture

## Service Stack

```
Browser → lighttpd:8080 → auth-helper:3000 → PrusaLink:80
           (SPA)           (Digest auth)      (Printer API)
```

## Port Assignments

- **80:** PrusaLink (Python service, requires Digest auth)
- **3000:** Auth Helper (Node.js proxy, handles auth transparently)
- **8080:** Lighttpd (serves SPA, proxies /api/* to auth-helper)

## Authentication Flow

1. Browser makes request: `GET /api/v1/status`
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

### Check Logs

Auth helper:
```bash
sudo journalctl -u prusalink-auth -f
```

Lighttpd:
```bash
sudo journalctl -u lighttpd -f
```

PrusaLink:
```bash
sudo journalctl -u prusalink -f
```

### Test Connectivity

Direct to PrusaLink (should require auth):
```bash
curl -i http://localhost:80/api/v1/status
```

Through auth-helper (should return data):
```bash
curl http://localhost:3000/api/v1/status
```

Through lighttpd (should return data):
```bash
curl http://localhost:8080/api/v1/status
```

### Common Issues

**Auth helper not connecting to PrusaLink:**
- Check PrusaLink is running: `sudo systemctl status prusalink`
- Check network: `curl -i http://127.0.0.1:80/api/v1/status` (without auth)
- Check credentials in systemd service: `sudo cat /etc/systemd/system/prusalink-auth.service`

**Lighttpd returning 503 errors:**
- Check auth-helper is running: `sudo systemctl status prusalink-auth`
- Check port 3000 is listening: `sudo netstat -tlnp | grep 3000`
- Check lighttpd logs: `sudo journalctl -u lighttpd -f`

**Stale nonce errors:**
- This should be handled automatically by auth-helper
- If persistent, restart auth-helper: `sudo systemctl restart prusalink-auth`
