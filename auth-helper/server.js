const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

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

// Nonce cache: store last successful nonce and nc per path pattern
const nonceCache = {
  nonce: null,
  nc: 0,
  realm: null,
  qop: null,
  algorithm: null,
  opaque: null,
};

/**
 * Parse WWW-Authenticate header to extract digest challenge components
 * @param {string} header - WWW-Authenticate header value
 * @returns {Object} - Parsed challenge with realm, nonce, qop, algorithm, stale
 */
function parseWWWAuthenticate(header) {
  const challenge = {};

  // Extract Digest challenge
  const digestMatch = header.match(/Digest\s+(.+)/i);
  if (!digestMatch) {
    throw new Error('Not a Digest authentication challenge');
  }

  const params = digestMatch[1];

  // Parse key=value pairs (handling quoted values)
  const paramRegex = /(\w+)=(?:"([^"]+)"|([^,\s]+))/g;
  let match;

  while ((match = paramRegex.exec(params)) !== null) {
    const key = match[1];
    const value = match[2] || match[3];
    challenge[key] = value;
  }

  console.log('Parsed WWW-Authenticate challenge:', challenge);

  return challenge;
}

/**
 * Generate a random client nonce
 * @returns {string} - Random hex string
 */
function generateCnonce() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Compute MD5 hash
 * @param {string} data - Data to hash
 * @returns {string} - MD5 hash in hex
 */
function md5(data) {
  return crypto.createHash('md5').update(data).digest('hex');
}

/**
 * Compute digest response hash per RFC 7616
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} uri - Request URI path
 * @param {string} username - Username
 * @param {string} password - Password
 * @param {string} realm - Realm from challenge
 * @param {string} nonce - Nonce from challenge
 * @param {string} cnonce - Client nonce
 * @param {string} nc - Nonce count (hex string, e.g., "00000001")
 * @param {string} qop - Quality of protection (typically "auth")
 * @returns {string} - Computed response hash
 */
function computeDigestResponse(method, uri, username, password, realm, nonce, cnonce, nc, qop, algorithm = 'MD5') {
  // HA1 calculation depends on algorithm
  let ha1;
  if (algorithm === 'MD5-sess') {
    // MD5-sess: HA1 = MD5(MD5(username:realm:password):nonce:cnonce)
    const ha1_base = md5(`${username}:${realm}:${password}`);
    ha1 = md5(`${ha1_base}:${nonce}:${cnonce}`);
    console.log(`HA1 (MD5-sess) = MD5(MD5(${username}:${realm}:****):${nonce}:${cnonce}) = ${ha1}`);
  } else {
    // MD5: HA1 = MD5(username:realm:password)
    ha1 = md5(`${username}:${realm}:${password}`);
    console.log(`HA1 (MD5) = MD5(${username}:${realm}:****) = ${ha1}`);
  }

  // HA2 = MD5(method:uri)
  const ha2 = md5(`${method}:${uri}`);
  console.log(`HA2 = MD5(${method}:${uri}) = ${ha2}`);

  // response = MD5(HA1:nonce:nc:cnonce:qop:HA2)
  const response = md5(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`);
  console.log(`response = MD5(${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}) = ${response}`);

  return response;
}

/**
 * Build Authorization: Digest header
 * @param {string} username - Username
 * @param {string} realm - Realm from challenge
 * @param {string} nonce - Nonce from challenge
 * @param {string} uri - Request URI path
 * @param {string} qop - Quality of protection
 * @param {string} cnonce - Client nonce
 * @param {string} nc - Nonce count (hex string)
 * @param {string} response - Computed response hash
 * @param {string} algorithm - Algorithm (optional, defaults to MD5)
 * @returns {string} - Complete Authorization header value
 */
function buildAuthorizationHeader(username, realm, nonce, uri, qop, cnonce, nc, response, algorithm = 'MD5', opaque = null) {
  const parts = [
    `Digest username="${username}"`,
    `realm="${realm}"`,
    `nonce="${nonce}"`,
    `uri="${uri}"`,
    `qop="${qop}"`,
    `nc=${nc}`,
    `cnonce="${cnonce}"`,
    `response="${response}"`,
    `algorithm="${algorithm}"`,
  ];

  if (opaque) {
    parts.push(`opaque="${opaque}"`);
  }

  const header = parts.join(', ');

  console.log('Built Authorization header:', header);

  return header;
}

/**
 * Make request with digest authentication
 * @param {string} method - HTTP method
 * @param {string} url - Full URL
 * @param {Object} headers - Request headers
 * @param {*} data - Request body
 * @returns {Promise<Object>} - Axios response
 */
async function requestWithDigest(method, url, headers, data) {
  const uri = new URL(url).pathname + new URL(url).search;

  // Try with cached nonce first (if available)
  if (nonceCache.nonce && nonceCache.nc > 0) {
    console.log(`Attempting request with cached nonce (nc=${nonceCache.nc})`);

    try {
      const nc = (++nonceCache.nc).toString(16).padStart(8, '0');
      const cnonce = generateCnonce();
      const response = computeDigestResponse(
        method,
        uri,
        PRUSALINK_USER,
        PRUSALINK_PASS,
        nonceCache.realm,
        nonceCache.nonce,
        cnonce,
        nc,
        nonceCache.qop || 'auth',
        nonceCache.algorithm || 'MD5'
      );

      const authHeader = buildAuthorizationHeader(
        PRUSALINK_USER,
        nonceCache.realm,
        nonceCache.nonce,
        uri,
        nonceCache.qop || 'auth',
        cnonce,
        nc,
        response,
        nonceCache.algorithm || 'MD5',
        nonceCache.opaque
      );

      const cachedResponse = await axios({
        method,
        url,
        headers: {
          ...headers,
          'Authorization': authHeader,
        },
        data,
        validateStatus: () => true,
      });

      if (cachedResponse.status !== 401) {
        console.log(`Cached nonce worked! Status: ${cachedResponse.status}`);
        return cachedResponse;
      }

      console.log('Cached nonce failed (401), will retry with fresh challenge');

      // Check for stale nonce
      const wwwAuth = cachedResponse.headers['www-authenticate'];
      if (wwwAuth && wwwAuth.includes('stale=true')) {
        console.log('Nonce is stale, clearing cache');
      }
    } catch (error) {
      console.log('Cached nonce request failed:', error.message);
    }
  }

  // Make initial request without auth to get challenge
  console.log(`Making initial request to get WWW-Authenticate challenge`);
  const initialResponse = await axios({
    method,
    url,
    headers,
    data,
    validateStatus: () => true,
  });

  if (initialResponse.status !== 401) {
    // No auth required or unexpected response
    console.log(`Initial request succeeded without auth (status ${initialResponse.status})`);
    return initialResponse;
  }

  // Parse WWW-Authenticate challenge
  const wwwAuth = initialResponse.headers['www-authenticate'];
  if (!wwwAuth) {
    throw new Error('401 response missing WWW-Authenticate header');
  }

  console.log('Received 401 with WWW-Authenticate:', wwwAuth);
  const challenge = parseWWWAuthenticate(wwwAuth);

  const { realm, nonce, qop = 'auth', algorithm = 'MD5', opaque = null } = challenge;

  if (!realm || !nonce) {
    throw new Error('WWW-Authenticate challenge missing realm or nonce');
  }

  // Update nonce cache
  nonceCache.nonce = nonce;
  nonceCache.realm = realm;
  nonceCache.qop = qop;
  nonceCache.algorithm = algorithm;
  nonceCache.opaque = opaque;
  nonceCache.nc = 1;

  // Generate digest response
  const nc = '00000001';
  const cnonce = generateCnonce();

  const digestResponse = computeDigestResponse(
    method,
    uri,
    PRUSALINK_USER,
    PRUSALINK_PASS,
    realm,
    nonce,
    cnonce,
    nc,
    qop,
    algorithm
  );

  const authHeader = buildAuthorizationHeader(
    PRUSALINK_USER,
    realm,
    nonce,
    uri,
    qop,
    cnonce,
    nc,
    digestResponse,
    algorithm,
    opaque
  );

  // Retry request with Authorization header
  console.log(`Retrying request with digest authentication`);
  const authResponse = await axios({
    method,
    url,
    headers: {
      ...headers,
      'Authorization': authHeader,
    },
    data,
    validateStatus: () => true,
  });

  if (authResponse.status === 401) {
    console.error('Authentication failed after digest response - check credentials');
    // Clear cache on auth failure
    nonceCache.nonce = null;
    nonceCache.nc = 0;
  }

  return authResponse;
}

// Middleware to parse JSON
app.use(express.json());

// Catch-all route for /api/*
app.all('/api/*', async (req, res) => {
  const path = req.url;
  const url = `${PRUSALINK_HOST}${path}`;

  console.log(`\n=== Forwarding ${req.method} ${path} to ${url} ===`);

  try {
    // Prepare headers (exclude host)
    const forwardHeaders = { ...req.headers };
    delete forwardHeaders.host;
    delete forwardHeaders.connection;
    delete forwardHeaders.authorization; // Remove any existing auth header

    // Forward request with digest auth
    const response = await requestWithDigest(
      req.method,
      url,
      forwardHeaders,
      req.body
    );

    console.log(`Response status: ${response.status}`);

    // Forward response headers (exclude some)
    Object.entries(response.headers).forEach(([key, value]) => {
      if (!['connection', 'transfer-encoding', 'www-authenticate'].includes(key.toLowerCase())) {
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
  console.log(`Proxying to PrusaLink at ${PRUSALINK_HOST}`);
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
