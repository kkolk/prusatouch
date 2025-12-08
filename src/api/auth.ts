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
  const baseUrl = import.meta.env.VITE_PRUSALINK_URL || ''

  if (username && password) {
    configureAuth(username, password)
  }

  // Set API base URL from environment
  if (baseUrl) {
    OpenAPI.BASE = `${baseUrl}/api/v1`
    console.log('PrusaLink API configured:', OpenAPI.BASE)
  }
}

/**
 * Check if authentication is configured
 */
export function isAuthConfigured(): boolean {
  return authConfig.username !== '' && authConfig.password !== ''
}
