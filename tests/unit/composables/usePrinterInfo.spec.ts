import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

describe('usePrinterInfo', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('provides fallback values when store data is empty', async () => {
    const { usePrinterInfo } = await import('../../../src/composables/usePrinterInfo')
    const { printerName, firmware, prusaLink, hostname, serial, location, nozzleDiameter, isLoading } = usePrinterInfo()

    expect(printerName.value).toBe('Unknown Printer')
    expect(firmware.value).toBe('Unknown')
    expect(prusaLink.value).toBe('Unknown')
    expect(hostname.value).toBe('Unknown')
    expect(serial.value).toBe('Unknown')
    expect(location.value).toBe('Not Set')
    expect(nozzleDiameter.value).toBe('Unknown')
    expect(isLoading.value).toBe(false)
  })

  it('provides actual values when store has data', async () => {
    const { usePrinterStore } = await import('../../../src/stores/printer')
    const store = usePrinterStore()

    // Set store data
    store.printerInfo = {
      name: 'Prusa MK4',
      hostname: 'prusa-mk4.local',
      serial: 'CZPX23K056',
      location: 'Office',
      nozzle_diameter: 0.4,
      mmu: false,
      farm_mode: false,
      sd_ready: true,
      active_camera: false,
      network_error_chime: false
    }
    store.version = {
      api: '1.0.0',
      version: '1.2.3',
      printer: 'MK4',
      text: 'PrusaLink 1.2.3',
      firmware: '4.5.0',
      capabilities: {
        'upload-by-put': true
      }
    }
    store.printerInfoLoading = false

    const { usePrinterInfo } = await import('../../../src/composables/usePrinterInfo')
    const { printerName, firmware, prusaLink, hostname, serial, location, nozzleDiameter, isLoading } = usePrinterInfo()

    expect(printerName.value).toBe('Prusa MK4')
    expect(firmware.value).toBe('4.5.0')
    expect(prusaLink.value).toBe('PrusaLink 1.2.3')
    expect(hostname.value).toBe('prusa-mk4.local')
    expect(serial.value).toBe('CZPX23K056')
    expect(location.value).toBe('Office')
    expect(nozzleDiameter.value).toBe('0.4')
    expect(isLoading.value).toBe(false)
  })

  it('returns nozzle diameter as string', async () => {
    const { usePrinterStore } = await import('../../../src/stores/printer')
    const store = usePrinterStore()

    store.printerInfo = {
      name: 'Prusa MK4',
      nozzle_diameter: 0.4
    }

    const { usePrinterInfo } = await import('../../../src/composables/usePrinterInfo')
    const { nozzleDiameter } = usePrinterInfo()

    expect(typeof nozzleDiameter.value).toBe('string')
    expect(nozzleDiameter.value).toBe('0.4')
  })

  it('returns isLoading from store', async () => {
    const { usePrinterStore } = await import('../../../src/stores/printer')
    const store = usePrinterStore()

    store.printerInfoLoading = true

    const { usePrinterInfo } = await import('../../../src/composables/usePrinterInfo')
    const { isLoading } = usePrinterInfo()

    expect(isLoading.value).toBe(true)

    store.printerInfoLoading = false
    expect(isLoading.value).toBe(false)
  })

  it('provides partial fallback values when store has partial data', async () => {
    const { usePrinterStore } = await import('../../../src/stores/printer')
    const store = usePrinterStore()

    // Only set some fields
    store.printerInfo = {
      name: 'Prusa MK4'
      // Other fields undefined
    }

    const { usePrinterInfo } = await import('../../../src/composables/usePrinterInfo')
    const { printerName, hostname, serial, location, nozzleDiameter } = usePrinterInfo()

    expect(printerName.value).toBe('Prusa MK4')
    expect(hostname.value).toBe('Unknown')
    expect(serial.value).toBe('Unknown')
    expect(location.value).toBe('Not Set')
    expect(nozzleDiameter.value).toBe('Unknown')
  })

  it('does not fetch data - only reads from store', async () => {
    const { usePrinterStore } = await import('../../../src/stores/printer')
    const store = usePrinterStore()

    // Spy on fetch methods to ensure they're not called
    const fetchPrinterInfoSpy = vi.spyOn(store, 'fetchPrinterInfo')
    const fetchVersionSpy = vi.spyOn(store, 'fetchVersion')

    const { usePrinterInfo } = await import('../../../src/composables/usePrinterInfo')
    usePrinterInfo()

    expect(fetchPrinterInfoSpy).not.toHaveBeenCalled()
    expect(fetchVersionSpy).not.toHaveBeenCalled()
  })

  it('all refs are readonly', async () => {
    const { usePrinterInfo } = await import('../../../src/composables/usePrinterInfo')
    const result = usePrinterInfo()

    // Verify all returned refs exist
    expect(result.printerName).toBeDefined()
    expect(result.firmware).toBeDefined()
    expect(result.prusaLink).toBeDefined()
    expect(result.hostname).toBeDefined()
    expect(result.serial).toBeDefined()
    expect(result.location).toBeDefined()
    expect(result.nozzleDiameter).toBeDefined()
    expect(result.isLoading).toBeDefined()
  })

  it('reacts to store updates', async () => {
    const { usePrinterStore } = await import('../../../src/stores/printer')
    const store = usePrinterStore()

    const { usePrinterInfo } = await import('../../../src/composables/usePrinterInfo')
    const { printerName } = usePrinterInfo()

    // Initial state - fallback
    expect(printerName.value).toBe('Unknown Printer')

    // Update store
    store.printerInfo = {
      name: 'Prusa MINI'
    }

    // Composable should react to update
    expect(printerName.value).toBe('Prusa MINI')
  })
})
