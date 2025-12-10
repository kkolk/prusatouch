const express = require('express');
const DigestFetch = require('digest-fetch').default;

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

// Create digest fetch client with credentials
const digestFetch = new DigestFetch(PRUSALINK_USER, PRUSALINK_PASS, { algorithm: 'MD5' });

// Middleware to parse JSON and raw bodies
app.use(express.json());
app.use(express.raw({ type: '*/*' }));

// Helper function to forward requests
async function forwardRequest(method, path, headers, body) {
  const url = `${PRUSALINK_HOST}${path}`;

  // Prepare headers (exclude Host header)
  const forwardHeaders = { ...headers };
  delete forwardHeaders['host'];

  try {
    const options = {
      method,
      headers: forwardHeaders,
    };

    // Add body if present (for POST, PUT, PATCH)
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = body;
    }

    const response = await digestFetch.fetch(url, options);
    const contentType = response.headers.get('content-type');

    // Read response body
    let responseBody = await response.text();

    return {
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body: responseBody,
      contentType,
    };
  } catch (error) {
    console.error(`Error forwarding ${method} ${path}:`, error.message);

    // Check if it's a 401 (auth failure)
    if (error.message && error.message.includes('401')) {
      return {
        status: 401,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: 'Digest authentication failed' }),
      };
    }

    // Otherwise return 503 (service unavailable)
    return {
      status: 503,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'PrusaLink is unreachable' }),
    };
  }
}

// Route all /api/* requests
app.all('/api/*', async (req, res) => {
  const path = req.path;
  const method = req.method;
  const headers = req.headers;
  const body = req.body;

  const result = await forwardRequest(method, path, headers, body);

  res.status(result.status);
  Object.entries(result.headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  res.send(result.body);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`Auth helper service listening on 127.0.0.1:${PORT}`);
});

// Graceful shutdown
const shutdown = () => {
  console.log('Shutting down auth helper service...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
