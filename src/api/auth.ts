/**
 * PrusaLink Authentication configuration
 *
 * Authentication is now handled server-side by the auth-helper service.
 * The browser no longer needs to manage digest auth credentials.
 */

import { OpenAPI } from './core/OpenAPI'

/**
 * Initialize API configuration
 *
 * Sets up the base URL for API calls.
 * In production, lighttpd proxies /api/* to auth-helper (which handles digest auth)
 * In development, Vite dev server proxies /api/* to auth-helper
 */
export function initAuthFromEnv(): void {
  // Use empty base URL - API methods already include full paths (e.g., /api/v1/status)
  OpenAPI.BASE = ''
  console.log('PrusaLink API configured with empty base (paths are absolute)')
}
