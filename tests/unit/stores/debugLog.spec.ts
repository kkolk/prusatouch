import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDebugLogStore } from '../../../src/stores/debugLog'

describe('debugLog Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('addLog', () => {
    it('should add a log entry', () => {
      const store = useDebugLogStore()

      store.addLog({
        timestamp: new Date('2024-01-01T12:00:00Z'),
        method: 'GET',
        endpoint: '/api/v1/status',
        status: 200,
        error: null
      })

      expect(store.logs).toHaveLength(1)
      expect(store.logs[0].method).toBe('GET')
      expect(store.logs[0].endpoint).toBe('/api/v1/status')
      expect(store.logs[0].status).toBe(200)
    })

    it('should add multiple log entries', () => {
      const store = useDebugLogStore()

      store.addLog({
        timestamp: new Date('2024-01-01T12:00:00Z'),
        method: 'GET',
        endpoint: '/api/v1/status',
        status: 200,
        error: null
      })

      store.addLog({
        timestamp: new Date('2024-01-01T12:00:01Z'),
        method: 'POST',
        endpoint: '/api/v1/printer/printhead',
        status: 204,
        error: null
      })

      expect(store.logs).toHaveLength(2)
    })

    it('should add error log entry', () => {
      const store = useDebugLogStore()

      store.addLog({
        timestamp: new Date('2024-01-01T12:00:00Z'),
        method: 'POST',
        endpoint: '/api/v1/printer/printhead',
        status: 409,
        error: 'Printer busy or not ready'
      })

      expect(store.logs).toHaveLength(1)
      expect(store.logs[0].status).toBe(409)
      expect(store.logs[0].error).toBe('Printer busy or not ready')
    })
  })

  describe('LRU limit', () => {
    it('should limit to 100 entries', () => {
      const store = useDebugLogStore()

      // Add 105 entries
      for (let i = 0; i < 105; i++) {
        store.addLog({
          timestamp: new Date(`2024-01-01T12:00:${i.toString().padStart(2, '0')}Z`),
          method: 'GET',
          endpoint: `/api/v1/status/${i}`,
          status: 200,
          error: null
        })
      }

      // Should only have 100 entries
      expect(store.logs).toHaveLength(100)

      // First entry should be the 6th one added (index 5)
      expect(store.logs[0].endpoint).toBe('/api/v1/status/5')

      // Last entry should be the 105th one added (index 104)
      expect(store.logs[99].endpoint).toBe('/api/v1/status/104')
    })
  })

  describe('clearLogs', () => {
    it('should clear all logs', () => {
      const store = useDebugLogStore()

      // Add some logs
      store.addLog({
        timestamp: new Date('2024-01-01T12:00:00Z'),
        method: 'GET',
        endpoint: '/api/v1/status',
        status: 200,
        error: null
      })

      store.addLog({
        timestamp: new Date('2024-01-01T12:00:01Z'),
        method: 'POST',
        endpoint: '/api/v1/printer/printhead',
        status: 204,
        error: null
      })

      expect(store.logs).toHaveLength(2)

      // Clear logs
      store.clearLogs()

      expect(store.logs).toHaveLength(0)
    })
  })

  describe('log ordering', () => {
    it('should maintain chronological order (oldest first)', () => {
      const store = useDebugLogStore()

      const timestamp1 = new Date('2024-01-01T12:00:00Z')
      const timestamp2 = new Date('2024-01-01T12:00:01Z')
      const timestamp3 = new Date('2024-01-01T12:00:02Z')

      store.addLog({
        timestamp: timestamp1,
        method: 'GET',
        endpoint: '/api/v1/status',
        status: 200,
        error: null
      })

      store.addLog({
        timestamp: timestamp2,
        method: 'POST',
        endpoint: '/api/v1/printer/printhead',
        status: 204,
        error: null
      })

      store.addLog({
        timestamp: timestamp3,
        method: 'GET',
        endpoint: '/api/v1/job',
        status: 200,
        error: null
      })

      expect(store.logs[0].timestamp).toEqual(timestamp1)
      expect(store.logs[1].timestamp).toEqual(timestamp2)
      expect(store.logs[2].timestamp).toEqual(timestamp3)
    })
  })
})
