#!/usr/bin/env node

const http = require('http');
const crypto = require('crypto');

const HOST = 'octopi.local.frostbyte.us';
const PORT = 80;
const PATH = '/api/printer/printhead';
const USERNAME = 'kkolk';
const PASSWORD = 'Beer404Prusa';

// SAFE TEST: Move Z axis UP by 0.5mm only
const TEST_BODY = JSON.stringify({
  jog: {
    command: 'jog',
    z: 0.5  // Safe: UP only, small amount
  }
});

function md5(data) {
  return crypto.createHash('md5').update(data).digest('hex');
}

function makeRequest(method, path, headers, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: method,
      headers: headers
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function testDigestAuth() {
  console.log('Testing legacy API with digest auth');
  console.log('SAFE TEST: Z-axis UP 0.5mm only\n');

  // Step 1: Get challenge
  console.log('Step 1: Getting 401 challenge...');
  const initialRes = await makeRequest('POST', PATH, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(TEST_BODY)
  }, TEST_BODY);

  if (initialRes.status !== 401) {
    console.log('Unexpected status:', initialRes.status);
    return;
  }

  const wwwAuth = initialRes.headers['www-authenticate'];
  console.log('WWW-Authenticate:', wwwAuth);

  // Parse challenge
  const realmMatch = wwwAuth.match(/realm="([^"]+)"/);
  const nonceMatch = wwwAuth.match(/nonce="([^"]+)"/);
  const qopMatch = wwwAuth.match(/qop="([^"]+)"/);
  const algorithmMatch = wwwAuth.match(/algorithm="?([^",\s]+)"?/);
  const opaqueMatch = wwwAuth.match(/opaque="([^"]+)"/);

  const realm = realmMatch ? realmMatch[1] : null;
  const nonce = nonceMatch ? nonceMatch[1] : null;
  const qop = qopMatch ? qopMatch[1] : 'auth';
  const algorithm = algorithmMatch ? algorithmMatch[1] : 'MD5';
  const opaque = opaqueMatch ? opaqueMatch[1] : null;

  console.log('\nParsed challenge:');
  console.log('  Realm:', realm);
  console.log('  Algorithm:', algorithm);
  console.log('  QOP:', qop);

  // Step 2: Compute response
  console.log('\nStep 2: Computing digest response...');
  const cnonce = crypto.randomBytes(16).toString('hex');
  const nc = '00000001';

  let ha1;
  if (algorithm === 'MD5-sess') {
    const ha1_base = md5(`${USERNAME}:${realm}:${PASSWORD}`);
    ha1 = md5(`${ha1_base}:${nonce}:${cnonce}`);
  } else {
    ha1 = md5(`${USERNAME}:${realm}:${PASSWORD}`);
  }

  const ha2 = md5(`POST:${PATH}`);
  const response = md5(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`);

  const authHeader = `Digest username="${USERNAME}", realm="${realm}", nonce="${nonce}", uri="${PATH}", qop=${qop}, nc=${nc}, cnonce="${cnonce}", response="${response}", algorithm="${algorithm}"${opaque ? `, opaque="${opaque}"` : ''}`;

  console.log('\nStep 3: Making authenticated request...');
  const authRes = await makeRequest('POST', PATH, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(TEST_BODY),
    'Authorization': authHeader
  }, TEST_BODY);

  console.log('\n=== RESPONSE ===');
  console.log('Status:', authRes.status);
  console.log('Headers:', JSON.stringify(authRes.headers, null, 2));
  console.log('Body length:', authRes.data.length);
  console.log('Body:', authRes.data || '(empty)');

  if (authRes.status === 204) {
    console.log('\n✅ SUCCESS! Legacy API accepted command (204 No Content)');
  } else if (authRes.status === 401) {
    console.log('\n❌ AUTH FAILED! Check credentials');
  } else {
    console.log('\n⚠️ Unexpected status:', authRes.status);
  }
}

testDigestAuth().catch(console.error);
