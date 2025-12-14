import { computed, readonly } from 'vue'
import { useJobStore } from '../stores/job'

/**
 * Composable for accessing job data with control actions
 *
 * Usage:
 * ```
 * const { progress, timeRemaining, pauseJob, resumeJob, stopJob } = useJob()
 * ```
 */
export function useJob() {
  const store = useJobStore()

  // Job info computed refs
  const hasActiveJob = computed(() => store.currentJob !== null)

  const jobId = computed(() => store.currentJob?.id ?? null)

  const progress = computed(() => store.progressPercent)

  const timeRemaining = computed(() => store.timeRemainingFormatted)

  const timePrinting = computed(() => {
    if (!store.currentJob?.time_printing) return ''
    const seconds = store.currentJob.time_printing
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  })

  const fileName = computed(() => {
    const job = store.currentJob
    // Job can be either JobFilePrint (has file property) or JobSerialPrint (no file property)
    if (job && 'file' in job && job.file) {
      return job.file.name ?? ''
    }
    return ''
  })

  const jobState = computed(() => store.currentJob?.state ?? null)

  const currentLayer = computed(() => store.currentLayer)
  const totalLayers = computed(() => store.totalLayers)
  const printSpeed = computed(() => store.printSpeed)

  // Control action loading states
  const isPausing = computed(() => store.control.pauseInProgress)
  const isStopping = computed(() => store.control.stopInProgress)

  // Control actions
  async function pauseJob() {
    const id = jobId.value
    if (id !== null) {
      await store.pauseJob(id)
    }
  }

  async function resumeJob() {
    const id = jobId.value
    if (id !== null) {
      await store.resumeJob(id)
    }
  }

  async function stopJob() {
    const id = jobId.value
    if (id !== null) {
      await store.stopJob(id)
    }
  }

  async function fetchJob() {
    await store.fetchJob()
  }

  return {
    // Job data
    hasActiveJob: readonly(hasActiveJob),
    jobId: readonly(jobId),
    progress: readonly(progress),
    timeRemaining: readonly(timeRemaining),
    timePrinting: readonly(timePrinting),
    fileName: readonly(fileName),
    jobState: readonly(jobState),
    currentLayer: readonly(currentLayer),
    totalLayers: readonly(totalLayers),
    printSpeed: readonly(printSpeed),

    // Loading states
    isPausing: readonly(isPausing),
    isStopping: readonly(isStopping),

    // Raw access
    currentJob: readonly(computed(() => store.currentJob)),
    history: readonly(computed(() => store.history)),

    // Actions
    pauseJob,
    resumeJob,
    stopJob,
    fetchJob
  }
}
