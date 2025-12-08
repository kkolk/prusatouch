#!/bin/bash

# Disable screen blanking
xset s off
xset -dpms
xset s noblank

# Hide cursor after 0.1 seconds of inactivity
unclutter -idle 0.1 -root &

# Wait for network (PrusaLink connection)
sleep 5

# Launch Chromium in kiosk mode
chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-component-update \
  --check-for-update-interval=31536000 \
  --app=http://localhost:8080
