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
      // Legacy API uses nested command structure
      const moveRequest = {
        jog: {
          command: 'jog',
          [axis]: distance
        }
      }
      await DefaultService.postApiPrinterPrinthead(moveRequest)
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
      // Legacy API uses nested command structure
      const homeRequest = {
        home: {
          command: 'home',
          axes: axes.map(a => a.toUpperCase())
        }
      }
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
