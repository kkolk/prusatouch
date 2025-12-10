# Systemd Service Installation

This directory contains the systemd service configuration for running the PrusaLink Auth Helper as a daemon on Raspberry Pi.

## Installation Steps

### 1. Copy service file to systemd directory

```bash
sudo cp systemd/prusalink-auth.service /etc/systemd/system/
```

### 2. Edit the service file to set the actual password

```bash
sudo nano /etc/systemd/system/prusalink-auth.service
```

Replace the placeholder in this line:
```ini
Environment="PRUSALINK_PASS=<will-be-set-during-deployment>"
```

With your actual PrusaLink password:
```ini
Environment="PRUSALINK_PASS=your-actual-password"
```

### 3. Reload systemd and enable the service

```bash
sudo systemctl daemon-reload
sudo systemctl enable prusalink-auth
sudo systemctl start prusalink-auth
```

### 4. Verify the service is running

```bash
sudo systemctl status prusalink-auth
```

You should see output indicating the service is active and running.

## Useful Commands

### Check service logs

```bash
sudo journalctl -u prusalink-auth -f
```

### Restart the service

```bash
sudo systemctl restart prusalink-auth
```

### Disable the service

```bash
sudo systemctl disable prusalink-auth
sudo systemctl stop prusalink-auth
```

## Service Details

- **Type:** Simple (long-running process)
- **User:** pi (unprivileged)
- **Restart Policy:** Always restart on failure with 5-second delay
- **Security:** PrivateTmp enabled, NoNewPrivileges enabled
- **Working Directory:** `/home/pi/prusalink-auth`
- **Port:** 3000 (localhost only)
