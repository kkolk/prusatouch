import { describe, it, expect, vi, beforeEach } from 'vitest'
import { configureAuth, getAuthConfig, clearAuth, isAuthConfigured, getDigestClient } from '../../../src/api/auth'

describe('API Auth', () => {
  beforeEach(() => {
    clearAuth()
  })

  it('stores credentials when configured', () => {
    configureAuth('testuser', 'testpass')
    const config = getAuthConfig()
    expect(config.username).toBe('testuser')
    expect(config.password).toBe('testpass')
  })

  it('returns empty config when not configured', () => {
    const config = getAuthConfig()
    expect(config.username).toBe('')
    expect(config.password).toBe('')
  })

  it('clears credentials', () => {
    configureAuth('testuser', 'testpass')
    clearAuth()
    const config = getAuthConfig()
    expect(config.username).toBe('')
  })

  it('loads from environment variables', async () => {
    // Test that initAuthFromEnv reads VITE_PRUSALINK_USER/PASS
    const { initAuthFromEnv } = await import('../../../src/api/auth')
    // This test verifies the function exists and runs without error
    initAuthFromEnv()
    // Actual env loading tested in integration
  })

  it('checks if auth is configured', () => {
    expect(isAuthConfigured()).toBe(false)
    configureAuth('testuser', 'testpass')
    expect(isAuthConfigured()).toBe(true)
  })

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
