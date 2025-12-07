/**
 * PrusaLink HTTP Digest Authentication configuration
 */

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
  }
}

/**
 * Check if authentication is configured
 */
export function isAuthConfigured(): boolean {
  return authConfig.username !== '' && authConfig.password !== ''
}
