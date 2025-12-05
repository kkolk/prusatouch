import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PrinterStatus } from '../api/models/PrinterStatus'

export const usePrinterStore = defineStore('printer', () => {
  // State
  const status = ref<PrinterStatus | null>(null)
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
      const response = await DefaultService.getStatus()

      status.value = response.printer || null
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
    stopPolling
  }
})
