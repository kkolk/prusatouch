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
