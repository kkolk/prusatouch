import { computed } from 'vue'
import { usePrinterStore } from '../stores/printer'

/**
 * Composable for accessing printer information.
 *
 * IMPORTANT: This composable does NOT fetch data. Data must be fetched
 * in App.vue onMounted before any components use this composable.
 *
 * Returns computed refs with fallback values for missing data.
 */
export function usePrinterInfo() {
  const store = usePrinterStore()

  // Computed refs with fallbacks for template use
  const printerName = computed(() => store.printerInfo?.name || 'Unknown Printer')
  const firmware = computed(() => store.version?.firmware || 'Unknown')
  const prusaLink = computed(() => store.version?.text || 'Unknown')
  const hostname = computed(() => store.printerInfo?.hostname || 'Unknown')
  const serial = computed(() => store.printerInfo?.serial || 'Unknown')
  const location = computed(() => store.printerInfo?.location || 'Not Set')
  const nozzleDiameter = computed(() => store.printerInfo?.nozzle_diameter?.toString() || 'Unknown')
  const isLoading = computed(() => store.printerInfoLoading)

  return {
    printerName,
    firmware,
    prusaLink,
    hostname,
    serial,
    location,
    nozzleDiameter,
    isLoading,
  }
}
