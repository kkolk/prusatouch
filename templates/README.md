# OpenAPI Generator Templates

This directory contains custom templates for the OpenAPI TypeScript code generator.

## Files

### request.ts

Custom request handler template that uses the axios client with debug logging interceptors.

**Why this exists:**
- The auto-generated API files in `src/api/` should never be modified directly
- We need to inject our custom axios client with debug logging interceptors
- This template is used by the generator to create the request handler with our custom logic

**Usage:**
The template is automatically used by the `npm run generate:api` command via the `--request` flag in `package.json`.

**Maintenance:**
- This template must be kept in sync with updates to `openapi-typescript-codegen`
- The only custom logic is the `getDefaultAxiosClient()` function which loads our interceptor-enabled axios client
- All other code is standard OpenAPI generator template code

**Related files:**
- `src/api/client.ts` - Axios client with debug logging interceptors
- `src/stores/debugLog.ts` - Debug log store that captures API calls
