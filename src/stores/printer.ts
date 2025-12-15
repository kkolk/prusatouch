import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { StatusPrinter } from '../api/models/StatusPrinter'

export const usePrinterStore = defineStore('printer', () => {
  // State
  const status = ref<StatusPrinter | null>(null)
  const connection = ref({
    connected: false,
    lastUpdate: null as Date | null,
    retryCount: 0
  })
  const polling = ref({
    interval: 5000,
    enabled: false,
    timerId: null as number | null
  })

  // Getters
  const isConnected = computed(() => connection.value.connected)
  const isPrinting = computed(() => status.value?.state === 'PRINTING')
  const pollingInterval = computed(() => {
    return isPrinting.value ? 2000 : 5000
  })

  // Actions
  async function fetchStatus() {
    try {
      // Import API service
      const { DefaultService } = await import('../api')
      const response = await DefaultService.getApiV1Status()

      status.value = response.printer
      connection.value.connected = true
      connection.value.lastUpdate = new Date()
      connection.value.retryCount = 0
    } catch (error) {
      connection.value.connected = false
      connection.value.retryCount++
      console.error('Failed to fetch status:', error)
    }
  }

  function startPolling() {
    polling.value.enabled = true

    // Start immediate fetch
    fetchStatus()

    // Setup interval
    const poll = () => {
      if (!polling.value.enabled) return

      fetchStatus().finally(() => {
        if (polling.value.enabled) {
          polling.value.timerId = window.setTimeout(poll, pollingInterval.value)
        }
      })
    }

    polling.value.timerId = window.setTimeout(poll, pollingInterval.value)
  }

  function stopPolling() {
    polling.value.enabled = false
    if (polling.value.timerId) {
      clearTimeout(polling.value.timerId)
      polling.value.timerId = null
    }
  }

  // Movement control actions
  async function moveAxis(axis: 'x' | 'y' | 'z', distance: number) {
    try {
      const { DefaultService } = await import('../api')
      // Legacy API uses flat command structure (not nested as OpenAPI spec suggests)
      // Prusa-Link-Web's actual implementation uses flat structure despite spec
      const moveRequest = {
        command: 'jog',
        [axis]: distance
      } as any // Type assertion: spec is wrong, real API expects flat structure

      try {
        await DefaultService.postApiPrinterPrinthead(moveRequest)
      } catch (error: any) {
        // Retry once if 503 (steppers might be disabled, first command wakes them)
        if (error?.status === 503) {
          console.log('Printer busy (503), retrying after 500ms...')
          await new Promise(resolve => setTimeout(resolve, 500))
          await DefaultService.postApiPrinterPrinthead(moveRequest as any)
        } else {
          throw error
        }
      }

      // Refresh status after movement
      await fetchStatus()
    } catch (error) {
      console.error(`Failed to move ${axis} axis:`, error)
      throw error
    }
  }

  async function homeAxes(axes: ('x' | 'y' | 'z')[]) {
    try {
      const { DefaultService } = await import('../api')
      // Legacy API uses flat command structure (not nested as OpenAPI spec suggests)
      // Prusa-Link-Web's actual implementation uses flat structure despite spec
      const homeRequest = {
        command: 'home',
        axes: axes.map(a => a.toLowerCase())
      } as any // Type assertion: spec is wrong, real API expects flat structure
      await DefaultService.postApiPrinterPrinthead(homeRequest)
      // Refresh status after homing
      await fetchStatus()
    } catch (error) {
      console.error('Failed to home axes:', error)
      throw error
    }
  }

  async function disableSteppers() {
    try {
      const { DefaultService } = await import('../api')
      // Legacy API uses nested command structure
      const disableRequest = {
        disable_steppers: {
          command: 'disable_steppers'
        }
      }
      await DefaultService.postApiPrinterPrinthead(disableRequest)
    } catch (error) {
      console.error('Failed to disable steppers:', error)
      throw error
    }
  }

  // Temperature control actions
  async function setNozzleTemp(target: number) {
    try {
      const { DefaultService } = await import('../api')
      await DefaultService.postApiPrinterTool({
        target: {
          command: 'target',
          targets: {
            tool0: target
          }
        }
      })
      // Refresh status to get updated target temp
      await fetchStatus()
    } catch (error) {
      console.error('Failed to set nozzle temperature:', error)
      throw error
    }
  }

  async function setBedTemp(target: number) {
    try {
      const { DefaultService } = await import('../api')
      await DefaultService.postApiPrinterBed({
        command: 'target',
        target
      })
      // Refresh status to get updated target temp
      await fetchStatus()
    } catch (error) {
      console.error('Failed to set bed temperature:', error)
      throw error
    }
  }

  // Extruder control actions
  async function extrudeFilament(amount: number) {
    try {
      const { DefaultService } = await import('../api')
      await DefaultService.postApiPrinterTool({
        extrude: {
          command: 'extrude',
          amount: amount
        }
      })
      // Refresh status after extrusion
      await fetchStatus()
    } catch (error) {
      console.error('Failed to extrude:', error)
      throw error
    }
  }

  async function retractFilament(amount: number) {
    try {
      const { DefaultService } = await import('../api')
      await DefaultService.postApiPrinterTool({
        retract: {
          command: 'retract',
          amount: amount
        }
      })
      // Refresh status after retraction
      await fetchStatus()
    } catch (error) {
      console.error('Failed to retract:', error)
      throw error
    }
  }

  return {
    // State
    status,
    connection,
    polling,

    // Getters
    isConnected,
    isPrinting,
    pollingInterval,

    // Actions
    fetchStatus,
    startPolling,
    stopPolling,
    moveAxis,
    homeAxes,
    disableSteppers,
    setNozzleTemp,
    setBedTemp,
    extrudeFilament,
    retractFilament
  }
})
