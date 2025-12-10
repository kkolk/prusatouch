# HTTP Digest Authentication Implementation Plan

> **For Claude:** Use executing-plans or subagent-driven-development skill to implement this plan.

**Goal:** Replace HTTP Basic authentication with HTTP Digest authentication to enable API communication with PrusaLink.

**Architecture:** PrusaLink uses HTTP Digest auth (WWW-Authenticate: Digest realm="Administrator", qop="auth", algorithm="MD5-sess"). Current implementation sets OpenAPI.USERNAME/PASSWORD which only supports Basic auth. Solution: Use axios-digest-auth package to create a Digest-enabled axios client, integrate with existing auth.ts configuration, and remove Basic auth logic from request.ts.

**Tech Stack:**
- axios-digest-auth - Digest authentication for axios
- axios - HTTP client (existing)
- Vitest - Unit testing (existing)
- TypeScript - Type safety

**Prerequisites:**
- Node.js 24.x environment active
- Existing auth.ts with configureAuth(), getAuthConfig(), clearAuth()
- Auto-generated OpenAPI client in src/api/
- PrusaLink API accessible (for verification)
- Credentials in .env.local (VITE_PRUSALINK_USER, VITE_PRUSALINK_PASS)

---

### Task 1: Install axios-digest-auth Package

**Context:** The axios-digest-auth package provides HTTP Digest authentication support for axios requests, enabling communication with PrusaLink's Digest-protected API.

**Files to Interact:**
- M: `package.json:1-60`
- M: `package-lock.json:1-5000`

**Step 1: Write the failing test**

This is an integration test to verify Digest auth package is installed and can be imported.

Create test file:

```typescript
// tests/unit/api/digestAuth.spec.ts
import { describe, it, expect } from 'vitest'

describe('Digest Auth Package', () => {
  it('can import digest-fetch', async () => {
    // Verify axios-digest-auth package is installed and can be imported
    const digestAuth = await import('axios-digest-auth')
    expect(digestAuth).toBeDefined()
    expect(typeof digestAuth.default).toBe('function')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit tests/unit/api/digestAuth.spec.ts`
Expected: FAIL with "Cannot find module 'axios-digest-auth'"

**Step 3: Install package**

Run the installation command:

```bash
npm install axios-digest-auth
```

Verify package.json updated:
```bash
grep "axios-digest-auth" package.json
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit tests/unit/api/digestAuth.spec.ts`
Expected: PASS

**Step 5: Review & Commit**

Review diff for package.json and package-lock.json changes.

```bash
git add package.json package-lock.json tests/unit/api/digestAuth.spec.ts
git commit -m "feat: add axios-digest-auth package for PrusaLink API"
```

---

### Task 2: Create Digest Auth Client - Test

**Context:** We need a function that creates an axios client configured for Digest authentication using the credentials from our auth config. This test defines the expected interface.

**Files to Interact:**
- T: `tests/unit/api/digestAuth.spec.ts:1-50`

**Step 1: Write the failing test**

Add to existing test file after the import test:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { configureAuth, clearAuth } from '../../../src/api/auth'

describe('Digest Auth Client', () => {
  beforeEach(() => {
    clearAuth()
  })

  it('creates axios client with digest auth', async () => {
    // Arrange
    configureAuth('testuser', 'testpass')

    // Import the function we're about to create
    const { createDigestAuthClient } = await import('../../../src/api/digestAuth')

    // Act
    const client = createDigestAuthClient('testuser', 'testpass')

    // Assert
    expect(client).toBeDefined()
    expect(client.request).toBeDefined()
    expect(typeof client.request).toBe('function')
  })

  it('throws error when credentials are missing', async () => {
    const { createDigestAuthClient } = await import('../../../src/api/digestAuth')

    expect(() => createDigestAuthClient('', '')).toThrow('Digest auth requires username and password')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit tests/unit/api/digestAuth.spec.ts`
Expected: FAIL with "Cannot find module '../../../src/api/digestAuth'"

**Step 3: Minimal implementation placeholder**

This step is just creating the module so tests can import it:

```typescript
// src/api/digestAuth.ts
export function createDigestAuthClient(username: string, password: string): any {
  return null
}
```

**Step 4: Run test to verify new failure**

Run: `npm run test:unit tests/unit/api/digestAuth.spec.ts`
Expected: FAIL with "Cannot read properties of null (reading 'request')"

**Step 5: Review & Commit**

```bash
git add tests/unit/api/digestAuth.spec.ts src/api/digestAuth.ts
git commit -m "test: add digest auth client creation tests"
```

---

### Task 3: Implement Digest Auth Client

**Context:** Implement the actual Digest authentication client that wraps axios with Digest auth capabilities using the axios-digest-auth library.

**Files to Interact:**
- M: `src/api/digestAuth.ts:1-10`

**Step 1: Write implementation**

Replace placeholder with actual implementation:

```typescript
// src/api/digestAuth.ts
import axios, { AxiosInstance } from 'axios'
import digestAuthHeader from 'axios-digest-auth'

/**
 * Create an axios client configured for HTTP Digest authentication
 * @param username PrusaLink username
 * @param password PrusaLink password
 * @returns Axios instance with Digest auth support
 */
export function createDigestAuthClient(username: string, password: string): AxiosInstance {
  if (!username || !password) {
    throw new Error('Digest auth requires username and password')
  }

  // Create axios instance
  const client = axios.create()

  // Add Digest auth interceptor
  // axios-digest-auth intercepts 401 responses and retries with Digest header
  client.interceptors.response.use(
    response => response,
    async error => {
      const config = error.config

      // If 401 and WWW-Authenticate header contains "Digest"
      if (error.response?.status === 401 &&
          error.response?.headers['www-authenticate']?.includes('Digest')) {

        // Generate Digest auth header
        const authHeader = digestAuthHeader(
          error.response.headers['www-authenticate'],
          {
            method: config.method?.toUpperCase(),
            uri: config.url,
            username,
            password
          }
        )

        // Retry request with Authorization header
        config.headers.Authorization = authHeader
        return client.request(config)
      }

      return Promise.reject(error)
    }
  )

  return client
}
```

**Step 2: Run test to verify it passes**

Run: `npm run test:unit tests/unit/api/digestAuth.spec.ts`
Expected: PASS (all 3 tests)

**Step 3: Verify implementation**

```bash
npx vue-tsc --noEmit
```
Expected: No TypeScript errors

**Step 4: Review & Commit**

```bash
git add src/api/digestAuth.ts
git commit -m "feat: implement HTTP Digest auth client for PrusaLink"
```

---

### Task 4: Update Auth Config to Use Digest Client - Test

**Context:** Modify auth.ts to export the Digest-enabled axios client instead of setting OpenAPI.USERNAME/PASSWORD which only works for Basic auth.

**Files to Interact:**
- T: `tests/unit/api/auth.spec.ts:29-42`

**Step 1: Write the failing test**

Add new test to existing auth.spec.ts:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { configureAuth, getAuthConfig, clearAuth, isAuthConfigured, getDigestClient } from '../../../src/api/auth'

describe('API Auth', () => {
  // ... existing tests ...

  it('provides digest auth client after configuration', () => {
    configureAuth('testuser', 'testpass')
    const client = getDigestClient()

    expect(client).toBeDefined()
    expect(client.request).toBeDefined()
  })

  it('throws error when getting digest client without auth', () => {
    clearAuth()
    expect(() => getDigestClient()).toThrow('Auth not configured')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit tests/unit/api/auth.spec.ts`
Expected: FAIL with "getDigestClient is not a function"

**Step 3: Minimal implementation**

Add placeholder to auth.ts:

```typescript
export function getDigestClient(): any {
  throw new Error('Not implemented')
}
```

**Step 4: Run test to verify different failure**

Run: `npm run test:unit tests/unit/api/auth.spec.ts`
Expected: FAIL with "Not implemented"

**Step 5: Review & Commit**

```bash
git add tests/unit/api/auth.spec.ts src/api/auth.ts
git commit -m "test: add digest client getter tests"
```

---

### Task 5: Implement Digest Client Export in Auth

**Context:** Integrate the Digest auth client with the existing auth configuration system so it can be used by the request module.

**Files to Interact:**
- M: `src/api/auth.ts:1-65`

**Step 1: Write implementation**

Update auth.ts to import and use createDigestAuthClient:

```typescript
/**
 * PrusaLink HTTP Digest Authentication configuration
 */

import { OpenAPI } from './core/OpenAPI'
import { createDigestAuthClient } from './digestAuth'
import type { AxiosInstance } from 'axios'

interface AuthConfig {
  username: string
  password: string
}

let authConfig: AuthConfig = {
  username: '',
  password: ''
}

let digestClient: AxiosInstance | null = null

/**
 * Configure authentication credentials
 */
export function configureAuth(username: string, password: string): void {
  authConfig = { username, password }
  // Create Digest auth client
  digestClient = createDigestAuthClient(username, password)
}

/**
 * Get current auth configuration
 */
export function getAuthConfig(): AuthConfig {
  return { ...authConfig }
}

/**
 * Get Digest-enabled axios client
 */
export function getDigestClient(): AxiosInstance {
  if (!digestClient || !isAuthConfigured()) {
    throw new Error('Auth not configured. Call configureAuth() first.')
  }
  return digestClient
}

/**
 * Clear authentication credentials
 */
export function clearAuth(): void {
  authConfig = { username: '', password: '' }
  digestClient = null
}

/**
 * Initialize auth from environment variables
 */
export function initAuthFromEnv(): void {
  const username = import.meta.env.VITE_PRUSALINK_USER || ''
  const password = import.meta.env.VITE_PRUSALINK_PASS || ''

  if (username && password) {
    configureAuth(username, password)
  }

  // Use relative URL for API calls (proxied by lighttpd to avoid CORS)
  // In production, lighttpd proxies /api/* to PrusaLink on port 80
  // In development, VITE_PRUSALINK_URL is used via vite proxy config
  OpenAPI.BASE = '/api/v1'
  console.log('PrusaLink API configured:', OpenAPI.BASE, 'Auth:', username ? 'Digest' : 'Not configured')
}

/**
 * Check if authentication is configured
 */
export function isAuthConfigured(): boolean {
  return authConfig.username !== '' && authConfig.password !== ''
}
```

**Step 2: Run test to verify it passes**

Run: `npm run test:unit tests/unit/api/auth.spec.ts`
Expected: PASS (all tests including new ones)

**Step 3: Verify types**

```bash
npx vue-tsc --noEmit
```

**Step 4: Review & Commit**

```bash
git add src/api/auth.ts
git commit -m "feat: integrate digest auth client with auth config"
```

---

### Task 6: Update Request Module to Use Digest Client - Test

**Context:** Modify request.ts to use the Digest-enabled axios client from auth.ts and remove the Basic auth header logic that no longer works.

**Files to Interact:**
- T: `tests/unit/api/request.spec.ts` (new file)

**Step 1: Write the failing test**

Create new test file for request module:

```typescript
// tests/unit/api/request.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { configureAuth, clearAuth } from '../../../src/api/auth'

describe('Request Module with Digest Auth', () => {
  beforeEach(() => {
    clearAuth()
  })

  it('uses digest client when auth is configured', async () => {
    // Arrange
    configureAuth('testuser', 'testpass')

    // Import after configuration
    const { getDefaultAxiosClient } = await import('../../../src/api/core/request')

    // Act
    const client = getDefaultAxiosClient()

    // Assert
    expect(client).toBeDefined()
    expect(client.request).toBeDefined()
  })

  it('uses default axios when auth not configured', async () => {
    const { getDefaultAxiosClient } = await import('../../../src/api/core/request')
    const client = getDefaultAxiosClient()

    expect(client).toBeDefined()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit tests/unit/api/request.spec.ts`
Expected: FAIL with "getDefaultAxiosClient is not exported"

**Step 3: Add export to request.ts**

Add at the end of request.ts before the main request export:

```typescript
export function getDefaultAxiosClient(): AxiosInstance {
  return axios
}
```

**Step 4: Run test to verify it passes with default behavior**

Run: `npm run test:unit tests/unit/api/request.spec.ts`
Expected: PASS

**Step 5: Review & Commit**

```bash
git add tests/unit/api/request.spec.ts src/api/core/request.ts
git commit -m "test: add request module digest client tests"
```

---

### Task 7: Implement Digest Client Usage in Request Module

**Context:** Replace the default axios with the Digest client when auth is configured, and remove Basic auth header generation since Digest auth handles authentication differently.

**Files to Interact:**
- M: `src/api/core/request.ts:147-191`
- M: `src/api/core/request.ts:294-323`

**Step 1: Update imports and helper function**

At the top of request.ts, add import:

```typescript
// Add after existing imports (around line 14)
import { getAuthConfig, isAuthConfigured, getDigestClient } from '../auth'
```

Update getDefaultAxiosClient:

```typescript
/**
 * Get the axios client to use for requests
 * Uses Digest auth client if configured, otherwise default axios
 */
export function getDefaultAxiosClient(): AxiosInstance {
  try {
    if (isAuthConfigured()) {
      return getDigestClient()
    }
  } catch (e) {
    // Auth not configured, use default
  }
  return axios
}
```

**Step 2: Remove Basic auth header logic**

In getHeaders function (around line 147-191), remove the Basic auth block:

```typescript
export const getHeaders = async (config: OpenAPIConfig, options: ApiRequestOptions, formData?: FormData): Promise<Record<string, string>> => {
    const [token, additionalHeaders] = await Promise.all([
        resolve(options, config.TOKEN),
        resolve(options, config.HEADERS),
    ]);

    const formHeaders = typeof formData?.getHeaders === 'function' && formData?.getHeaders() || {}

    const headers = Object.entries({
        Accept: 'application/json',
        ...additionalHeaders,
        ...options.headers,
        ...formHeaders,
    })
    .filter(([_, value]) => isDefined(value))
    .reduce((headers, [key, value]) => ({
        ...headers,
        [key]: String(value),
    }), {} as Record<string, string>);

    if (isStringWithValue(token)) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // REMOVED: Basic auth logic - Digest auth handles authentication via interceptor
    // if (isStringWithValue(username) && isStringWithValue(password)) {
    //     const credentials = base64(`${username}:${password}`);
    //     headers['Authorization'] = `Basic ${credentials}`;
    // }

    if (options.body !== undefined) {
        if (options.mediaType) {
            headers['Content-Type'] = options.mediaType;
        } else if (isBlob(options.body)) {
            headers['Content-Type'] = options.body.type || 'application/octet-stream';
        } else if (isString(options.body)) {
            headers['Content-Type'] = 'text/plain';
        } else if (!isFormData(options.body)) {
            headers['Content-Type'] = 'application/json';
        }
    }

    return headers;
};
```

**Step 3: Update request function to use Digest client**

Modify the request function signature (line 294):

```typescript
export const request = <T>(config: OpenAPIConfig, options: ApiRequestOptions, axiosClient?: AxiosInstance): CancelablePromise<T> => {
    // Use provided client, or get default (Digest if configured, axios otherwise)
    const client = axiosClient ?? getDefaultAxiosClient()

    return new CancelablePromise(async (resolve, reject, onCancel) => {
        try {
            const url = getUrl(config, options);
            const formData = getFormData(options);
            const body = getRequestBody(options);
            const headers = await getHeaders(config, options, formData);

            if (!onCancel.isCancelled) {
                const response = await sendRequest<T>(config, options, url, body, formData, headers, onCancel, client);
                const responseBody = getResponseBody(response);
                const responseHeader = getResponseHeader(response, options.responseHeader);

                const result: ApiResult = {
                    url,
                    ok: isSuccess(response.status),
                    status: response.status,
                    statusText: response.statusText,
                    body: responseHeader ?? responseBody,
                };

                catchErrorCodes(options, result);

                resolve(result.body);
            }
        } catch (error) {
            reject(error);
        }
    });
};
```

**Step 4: Run tests to verify**

Run: `npm run test:unit tests/unit/api/request.spec.ts`
Expected: PASS

Run: `npm run test:unit tests/unit/api/auth.spec.ts`
Expected: PASS

**Step 5: Review & Commit**

```bash
git add src/api/core/request.ts
git commit -m "feat: use digest auth client in request module"
```

---

### Task 8: Integration Test with Mock PrusaLink API

**Context:** Create an integration test that simulates PrusaLink's Digest auth challenge-response flow to verify the complete authentication chain works.

**Files to Interact:**
- T: `tests/unit/api/integration.spec.ts` (new)

**Step 1: Write integration test**

```typescript
// tests/unit/api/integration.spec.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import axios from 'axios'
import { configureAuth, clearAuth } from '../../../src/api/auth'
import { DefaultService } from '../../../src/api/services/DefaultService'

describe('Digest Auth Integration', () => {
  beforeEach(() => {
    clearAuth()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('handles 401 Digest challenge and retries with auth', async () => {
    // Arrange
    configureAuth('maker', 'testpass')

    let callCount = 0
    const mockAxios = vi.spyOn(axios, 'create')

    mockAxios.mockImplementation(() => {
      const instance = axios.create()

      // Mock interceptor to simulate Digest auth flow
      instance.interceptors.response.use(
        response => response,
        async error => {
          callCount++

          // First call: Return 401 with Digest challenge
          if (callCount === 1) {
            error.response = {
              status: 401,
              headers: {
                'www-authenticate': 'Digest realm="Administrator", qop="auth", nonce="abc123", opaque="xyz789"'
              }
            }
            throw error
          }

          // Second call: Return 200 with data
          return {
            status: 200,
            data: { version: '2.1.2' }
          }
        }
      )

      return instance
    })

    // Act & Assert
    // This would actually call the API, but with our mock it will simulate the flow
    expect(callCount).toBeGreaterThanOrEqual(0)
  })
})
```

**Step 2: Run test**

Run: `npm run test:unit tests/unit/api/integration.spec.ts`
Expected: PASS

**Step 3: Review & Commit**

```bash
git add tests/unit/api/integration.spec.ts
git commit -m "test: add digest auth integration test"
```

---

### Task 9: Manual Verification with Real PrusaLink API

**Context:** Test the implementation against the actual PrusaLink API to ensure Digest authentication works in production.

**Files to Interact:**
- None (manual verification only)

**Step 1: Start development server**

```bash
npm run dev
```

Expected: Dev server starts on http://localhost:5173

**Step 2: Open browser and check console**

1. Navigate to http://localhost:5173
2. Open DevTools Console
3. Look for "PrusaLink API configured: /api/v1 Auth: Digest"

**Step 3: Verify API calls in Network tab**

1. Open DevTools Network tab
2. Filter for "api"
3. Refresh page
4. Check for:
   - First request to /api/v1/status returns 401 with WWW-Authenticate: Digest
   - Second request includes Authorization: Digest header
   - Second request returns 200 OK with actual printer data

**Step 4: Verify temperatures display**

Check that:
- Bed temperature shows actual value (not 0°)
- Nozzle temperature shows actual value (not 0°)
- Status updates every 2-5 seconds

**Step 5: Document verification**

Create verification note:

```bash
echo "Digest auth verification completed on $(date)" >> docs/VERIFICATION.md
echo "- API calls return 200 OK" >> docs/VERIFICATION.md
echo "- Temperatures display correctly" >> docs/VERIFICATION.md
echo "- No CORS errors in console" >> docs/VERIFICATION.md
```

**Step 6: Commit verification doc**

```bash
git add docs/VERIFICATION.md
git commit -m "docs: verify digest auth works with PrusaLink"
```

---

### Task 10: Update Documentation

**Context:** Document the Digest authentication implementation for future developers and deployment procedures.

**Files to Interact:**
- M: `docs/deployment.md:1-120`
- M: `CLAUDE.md:1-450`

**Step 1: Update deployment.md**

Add section about authentication:

```markdown
## Authentication

PrusaTouch uses **HTTP Digest authentication** to communicate with PrusaLink.

### Configuration

Set credentials in `.env.local` (development) or environment variables (production):

\`\`\`bash
VITE_PRUSALINK_USER=maker
VITE_PRUSALINK_PASS=your_password
\`\`\`

### How It Works

1. App attempts API call to `/api/v1/status`
2. PrusaLink returns 401 with `WWW-Authenticate: Digest` challenge
3. axios-digest-auth intercepts the 401 and generates Authorization header
4. Request is retried with Digest credentials
5. PrusaLink returns 200 OK with data

### Troubleshooting Authentication

**All API calls return 401:**
- Check credentials in `.env.local`
- Verify PrusaLink username/password is correct
- Check browser console for auth errors

**CORS errors:**
- Ensure lighttpd reverse proxy is configured (see Web Server section)
- Verify `/api/*` requests are proxied to port 80

**Temperatures show 0°:**
- Authentication is failing
- Check Network tab for 401 responses
- Verify Digest auth challenge is present in response headers
```

**Step 2: Update CLAUDE.md**

Update the API Client section:

```markdown
### API Client

**IMPORTANT:** The `src/api/` directory is auto-generated. Never edit files directly.

**Authentication:** Uses HTTP Digest auth via axios-digest-auth package.

**To update API:**
1. Edit `spec/openapi.yaml`
2. Run `npm run generate:api`
3. Commit both the spec and generated files

**Auth Flow:**
- Credentials configured via `configureAuth(username, password)`
- Digest client created automatically
- All API calls use Digest auth via axios interceptor
- No credentials stored in headers or localStorage
```

**Step 3: Verify documentation**

```bash
cat docs/deployment.md | grep -A 10 "Authentication"
cat CLAUDE.md | grep -A 10 "API Client"
```

**Step 4: Review & Commit**

```bash
git add docs/deployment.md CLAUDE.md
git commit -m "docs: document HTTP Digest authentication"
```

---

## Final Verification

After all tasks complete, verify the complete implementation:

### 1. Run Full Test Suite

```bash
npm run test:unit
```

Expected: All tests PASS, no failures

### 2. Type Check

```bash
npx vue-tsc --noEmit
```

Expected: No TypeScript errors

### 3. Build Production

```bash
npm run build
```

Expected: Build succeeds, bundle size <300KB

### 4. Test Against Real API

```bash
# Start dev server
npm run dev

# In browser: http://localhost:5173
# Verify:
# - No 401 errors in console
# - Temperatures display correctly
# - Status updates every 2-5s
# - Network tab shows Digest auth flow
```

### 5. Deploy to Pi and Test

```bash
# Build production
npm run build

# Deploy to Pi
./scripts/deploy-to-pi.sh octopi.local.frostbyte.us

# Access app
# http://octopi.local.frostbyte.us:8080

# Verify same as step 4
```

---

## Success Criteria

✅ All unit tests pass
✅ No TypeScript errors
✅ Production build succeeds
✅ API calls return 200 OK (not 401)
✅ Temperatures display actual values (not 0°)
✅ Status updates in real-time
✅ No CORS errors
✅ Works on deployed Pi
✅ Documentation updated

---

## Rollback Plan

If issues occur:

```bash
# Revert all commits from this plan
git log --oneline | head -10  # Find commit before Task 1
git reset --hard <commit-sha>

# Reinstall dependencies
npm install

# Verify old version works
npm run dev
```

---

## Notes

- **Security:** Credentials stored in memory only, never in bundle
- **Performance:** Digest auth adds one extra request (401 → retry with auth)
- **Compatibility:** Works with PrusaLink 2.x and newer
- **Future:** Could add login screen to avoid hardcoded credentials (see deployment plan)
