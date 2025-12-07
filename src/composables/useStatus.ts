import { computed, readonly } from 'vue'
import { usePrinterStore } from '../stores/printer'

/**
 * Composable for accessing printer status with lifecycle management
 *
 * Usage in components:
 * ```
 * const { printerState, nozzleTemp, bedTemp, startPolling, stopPolling } = useStatus()
 *
 * onMounted(() => startPolling())
 * onUnmounted(() => stopPolling())
 * ```
 */
export function useStatus() {
  const store = usePrinterStore()

  // Perform immediate fetch
  store.fetchStatus()

  // Computed refs for template use
  const printerState = computed(() => {
    const state = store.status?.state
    // Normalize to StatusBadge expected values
    if (!state) return 'IDLE'
    // Map PrusaLink states to our StatusBadge states
    switch (state) {
      case 'BUSY':
      case 'ATTENTION':
      case 'READY':
        return 'IDLE'
      case 'STOPPED':
        return 'FINISHED'
      default:
        return state as 'IDLE' | 'PRINTING' | 'PAUSED' | 'ERROR' | 'FINISHED'
    }
  })

  const nozzleTemp = computed(() => ({
    current: store.status?.temp_nozzle ?? 0,
    target: store.status?.target_nozzle ?? 0
  }))

  const bedTemp = computed(() => ({
    current: store.status?.temp_bed ?? 0,
    target: store.status?.target_bed ?? 0
  }))

  const isConnected = computed(() => store.isConnected)

  const connectionError = computed(() => {
    return !store.connection.connected && store.connection.retryCount > 0
      ? `Connection failed (${store.connection.retryCount} retries)`
      : null
  })

  const lastUpdate = computed(() => store.connection.lastUpdate)

  // Lifecycle methods
  function startPolling() {
    store.startPolling()
  }

  function stopPolling() {
    store.stopPolling()
  }

  // Immediate fetch (non-polling)
  async function refresh() {
    await store.fetchStatus()
  }

  return {
    // Status data
    printerState: readonly(printerState),
    nozzleTemp: readonly(nozzleTemp),
    bedTemp: readonly(bedTemp),

    // Connection state
    isConnected: readonly(isConnected),
    connectionError: readonly(connectionError),
    lastUpdate: readonly(lastUpdate),

    // Raw store access (for advanced use)
    status: readonly(computed(() => store.status)),

    // Lifecycle
    startPolling,
    stopPolling,
    refresh
  }
}
