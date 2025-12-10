const express = require('express');
const axios = require('axios');
const AxiosDigestAuth = require('@mhoc/axios-digest-auth').default;

const app = express();
const PORT = process.env.PORT || 3000;
const PRUSALINK_USER = process.env.PRUSALINK_USER;
const PRUSALINK_PASS = process.env.PRUSALINK_PASS;
const PRUSALINK_HOST = 'http://127.0.0.1:80';

// Validate required environment variables
if (!PRUSALINK_USER || !PRUSALINK_PASS) {
  console.error('Error: PRUSALINK_USER and PRUSALINK_PASS environment variables are required');
  process.exit(1);
}

// Create axios client with digest auth
const digestAuth = new AxiosDigestAuth({
  username: PRUSALINK_USER,
  password: PRUSALINK_PASS,
});

// Middleware to parse JSON
app.use(express.json());

// Catch-all route for /api/*
app.all('/api/*', async (req, res) => {
  const path = req.url;
  const url = `${PRUSALINK_HOST}${path}`;

  console.log(`Forwarding ${req.method} ${path} to ${url}`);

  try {
    // Prepare headers (exclude host)
    const forwardHeaders = { ...req.headers };
    delete forwardHeaders.host;
    delete forwardHeaders.connection;

    // Forward request with digest auth
    const response = await digestAuth.request({
      method: req.method,
      url,
      headers: forwardHeaders,
      data: req.body,
      validateStatus: () => true, // Accept all status codes
    });

    console.log(`Response status: ${response.status}`);

    // Forward response headers (exclude some)
    Object.entries(response.headers).forEach(([key, value]) => {
      if (!['connection', 'transfer-encoding'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    // Send response
    res.status(response.status).send(response.data);
  } catch (error) {
    console.error(`Error forwarding ${req.method} ${path}:`, error.message);
    res.status(503).json({ error: 'PrusaLink unavailable', message: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'prusalink-auth-helper' });
});

// Start server
const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`Auth helper service listening on 127.0.0.1:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down auth helper service...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Shutting down auth helper service...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
