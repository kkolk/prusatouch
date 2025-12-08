import { describe, it, expect, beforeEach } from 'vitest'
import { configureAuth, clearAuth } from '../../../src/api/auth'

describe('Digest Auth Package', () => {
  it('can import @mhoc/axios-digest-auth', async () => {
    // Verify axios-digest-auth package is installed and can be imported
    const digestAuth = await import('@mhoc/axios-digest-auth')
    expect(digestAuth).toBeDefined()
    expect(typeof digestAuth.default).toBe('function')
  })
})

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
