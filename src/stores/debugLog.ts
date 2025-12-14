import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface DebugLogEntry {
  timestamp: Date
  method: string
  endpoint: string
  status: number | null
  error: string | null
}

const MAX_LOGS = 100

export const useDebugLogStore = defineStore('debugLog', () => {
  // State
  const logs = ref<DebugLogEntry[]>([])

  // Actions
  function addLog(entry: DebugLogEntry) {
    logs.value.push(entry)

    // Enforce LRU limit of 100 entries
    if (logs.value.length > MAX_LOGS) {
      logs.value.shift() // Remove oldest entry
    }
  }

  function clearLogs() {
    logs.value = []
  }

  return {
    // State
    logs,

    // Actions
    addLog,
    clearLogs
  }
})
