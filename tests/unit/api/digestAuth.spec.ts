import { describe, it, expect } from 'vitest'

describe('Digest Auth Package', () => {
  it('can import @mhoc/axios-digest-auth', async () => {
    // Verify axios-digest-auth package is installed and can be imported
    const digestAuth = await import('@mhoc/axios-digest-auth')
    expect(digestAuth).toBeDefined()
    expect(typeof digestAuth.default).toBe('function')
  })
})
