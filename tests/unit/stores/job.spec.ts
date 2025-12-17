import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useJobStore } from '../../../src/stores/job'
import { usePrinterStore } from '../../../src/stores/printer'

describe('jobStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with null currentJob', () => {
    const store = useJobStore()
    expect(store.currentJob).toBeNull()
    expect(store.history).toEqual([])
  })

  it('calculates progress percentage correctly', () => {
    const store = useJobStore()
    store.currentJob = {
      id: '123',
      state: 'PRINTING',
      progress: 0.45,
      time_remaining: 1800,
      time_printing: 900,
      file: { name: 'test.gcode', path: '/test.gcode', size: 1024, m_timestamp: Date.now() }
    }
    expect(store.progressPercent).toBe(45)
  })

  it('formats time remaining correctly', () => {
    const store = useJobStore()
    store.currentJob = {
      id: '123',
      state: 'PRINTING',
      progress: 0.45,
      time_remaining: 3665, // 1h 1m 5s
      time_printing: 900,
      file: { name: 'test.gcode', path: '/test.gcode', size: 1024, m_timestamp: Date.now() }
    }
    expect(store.timeRemainingFormatted).toBe('1h 1m')
  })

  it('adds completed job to history', () => {
    const store = useJobStore()
    const job = {
      id: '123',
      state: 'FINISHED',
      progress: 1,
      time_remaining: 0,
      time_printing: 3600,
      file: { name: 'test.gcode', path: '/test.gcode', size: 1024, m_timestamp: Date.now() }
    }

    store.addToHistory(job)
    expect(store.history).toHaveLength(1)
    expect(store.history[0]).toEqual(job)
  })

  it('limits history to 10 items', () => {
    const store = useJobStore()

    for (let i = 0; i < 15; i++) {
      store.addToHistory({
        id: `${i}`,
        state: 'FINISHED',
        progress: 1,
        time_remaining: 0,
        time_printing: 3600,
        file: { name: `test${i}.gcode`, path: `/test${i}.gcode`, size: 1024, m_timestamp: Date.now() }
      })
    }

    expect(store.history).toHaveLength(10)
  })

  describe('printSpeed getter', () => {
    it('returns 0 when no current job', () => {
      const store = useJobStore()
      expect(store.printSpeed).toBe(0)
    })

    it('returns speed from printer status when job is active', () => {
      const store = useJobStore()
      const printerStore = usePrinterStore()

      // Set job first
      store.currentJob = {
        id: 123,
        state: 'PRINTING',
        progress: 0.5,
        time_remaining: 1800,
        time_printing: 900,
        file: { name: 'test.gcode', path: '/test.gcode', size: 1024, m_timestamp: Date.now() }
      }

      // Set up printer status with speed
      printerStore.status = {
        printer: {
          state: 'PRINTING',
          temp_nozzle: 215,
          target_nozzle: 215,
          temp_bed: 60,
          target_bed: 60,
          axis_x: 100,
          axis_y: 100,
          axis_z: 50,
          flow: 100,
          speed: 105,
          fan_hotend: 0,
          fan_print: 255
        }
      } as any

      // PrintSpeed comes from printerStore.status.printer.speed
      expect(store.printSpeed).toBe(105)
    })
  })

  describe('currentLayer and totalLayers getters', () => {
    it('returns 0 for both when no job', () => {
      const store = useJobStore()
      expect(store.currentLayer).toBe(0)
      expect(store.totalLayers).toBe(0)
    })

    it('returns 0 for both when file metadata not available', () => {
      const store = useJobStore()
      store.currentJob = {
        id: 123,
        state: 'PRINTING',
        progress: 0.5,
        time_remaining: 1800,
        time_printing: 900,
        file: { name: 'test.gcode', path: '/test.gcode', size: 1024, m_timestamp: Date.now() }
      }
      expect(store.currentLayer).toBe(0)
      expect(store.totalLayers).toBe(0)
    })
  })

  describe('startPrint action', () => {
    it('is defined and callable', () => {
      const store = useJobStore()
      expect(store.startPrint).toBeDefined()
      expect(typeof store.startPrint).toBe('function')
    })

    // Integration test would verify actual API calls
    // Unit test just verifies the action exists and has correct signature
  })
})
