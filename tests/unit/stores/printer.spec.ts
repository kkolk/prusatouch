import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePrinterStore } from '../../../src/stores/printer'

describe('printerStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with null status', () => {
    const store = usePrinterStore()
    expect(store.status).toBeNull()
    expect(store.connection.connected).toBe(false)
  })

  it('starts polling when startPolling is called', () => {
    const store = usePrinterStore()
    store.startPolling()
    expect(store.polling.enabled).toBe(true)
  })

  it('stops polling when stopPolling is called', () => {
    const store = usePrinterStore()
    store.startPolling()
    store.stopPolling()
    expect(store.polling.enabled).toBe(false)
  })

  it('updates status on successful fetch', async () => {
    const store = usePrinterStore()
    const mockStatus = {
      printer: {
        state: 'IDLE',
        temp_nozzle: 25,
        temp_bed: 22,
        target_nozzle: 0,
        target_bed: 0
      }
    }

    // Mock API call using dynamic import mocking
    const { DefaultService } = await import('../../../src/api')
    vi.spyOn(DefaultService, 'getStatus').mockResolvedValue(mockStatus)

    await store.fetchStatus()
    expect(store.status).toEqual(mockStatus.printer)
    expect(store.connection.connected).toBe(true)
  })

  it('returns isPrinting true when state is PRINTING', () => {
    const store = usePrinterStore()
    store.status = { state: 'PRINTING', temp_nozzle: 210, temp_bed: 60, target_nozzle: 215, target_bed: 60 }
    expect(store.isPrinting).toBe(true)
  })

  it('returns isPrinting false when state is IDLE', () => {
    const store = usePrinterStore()
    store.status = { state: 'IDLE', temp_nozzle: 25, temp_bed: 22, target_nozzle: 0, target_bed: 0 }
    expect(store.isPrinting).toBe(false)
  })

  it('adjusts polling interval based on printer state', () => {
    const store = usePrinterStore()

    store.status = { state: 'PRINTING', temp_nozzle: 210, temp_bed: 60, target_nozzle: 215, target_bed: 60 }
    expect(store.pollingInterval).toBe(2000)

    store.status = { state: 'IDLE', temp_nozzle: 25, temp_bed: 22, target_nozzle: 0, target_bed: 0 }
    expect(store.pollingInterval).toBe(5000)
  })

  describe('movement control actions', () => {
    it('moveAxis is defined and callable', () => {
      const store = usePrinterStore()
      expect(store.moveAxis).toBeDefined()
      expect(typeof store.moveAxis).toBe('function')
    })

    it('homeAxes is defined and callable', () => {
      const store = usePrinterStore()
      expect(store.homeAxes).toBeDefined()
      expect(typeof store.homeAxes).toBe('function')
    })

    it('disableSteppers is defined and callable', () => {
      const store = usePrinterStore()
      expect(store.disableSteppers).toBeDefined()
      expect(typeof store.disableSteppers).toBe('function')
    })
  })

  describe('temperature control actions', () => {
    it('setNozzleTemp is defined and callable', () => {
      const store = usePrinterStore()
      expect(store.setNozzleTemp).toBeDefined()
      expect(typeof store.setNozzleTemp).toBe('function')
    })

    it('setBedTemp is defined and callable', () => {
      const store = usePrinterStore()
      expect(store.setBedTemp).toBeDefined()
      expect(typeof store.setBedTemp).toBe('function')
    })
  })
})
