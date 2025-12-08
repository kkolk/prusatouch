/**
 * PrusaLink HTTP Digest Authentication configuration
 */

import { OpenAPI } from './core/OpenAPI'

interface AuthConfig {
  username: string
  password: string
}

let authConfig: AuthConfig = {
  username: '',
  password: ''
}

/**
 * Configure authentication credentials
 */
export function configureAuth(username: string, password: string): void {
  authConfig = { username, password }
}

/**
 * Get current auth configuration
 */
export function getAuthConfig(): AuthConfig {
  return { ...authConfig }
}

/**
 * Clear authentication credentials
 */
export function clearAuth(): void {
  authConfig = { username: '', password: '' }
}

/**
 * Initialize auth from environment variables
 */
export function initAuthFromEnv(): void {
  const username = import.meta.env.VITE_PRUSALINK_USER || ''
  const password = import.meta.env.VITE_PRUSALINK_PASS || ''

  if (username && password) {
    configureAuth(username, password)
    // Set credentials on OpenAPI client for HTTP Basic Auth
    OpenAPI.USERNAME = username
    OpenAPI.PASSWORD = password
  }

  // Use relative URL for API calls (proxied by lighttpd to avoid CORS)
  // In production, lighttpd proxies /api/* to PrusaLink on port 80
  // In development, VITE_PRUSALINK_URL is used via vite proxy config
  OpenAPI.BASE = '/api/v1'
  console.log('PrusaLink API configured:', OpenAPI.BASE, 'Auth:', username ? 'Configured' : 'Not configured')
}

/**
 * Check if authentication is configured
 */
export function isAuthConfigured(): boolean {
  return authConfig.username !== '' && authConfig.password !== ''
}
