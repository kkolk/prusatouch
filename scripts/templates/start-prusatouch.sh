#!/bin/bash

# Disable screen blanking (ignore errors if X server doesn't support extension)
xset s off 2>/dev/null || true
xset -dpms 2>/dev/null || true
xset s noblank 2>/dev/null || true

# Hide cursor after 0.1 seconds of inactivity
unclutter -idle 0.1 -root &

# Wait for network (PrusaLink connection)
sleep 5

# Launch Chromium in kiosk mode
chromium \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-component-update \
  --check-for-update-interval=31536000 \
  --app=http://localhost:8080
