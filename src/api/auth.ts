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
