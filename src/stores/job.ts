import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { JobResponse } from '../api/models/JobResponse'

export const useJobStore = defineStore('job', () => {
  // State
  const currentJob = ref<JobResponse | null>(null)
  const history = ref<JobResponse[]>([])
  const control = ref({
    pauseInProgress: false,
    stopInProgress: false
  })

  // Getters
  const progressPercent = computed(() => {
    if (!currentJob.value) return 0
    return Math.round(currentJob.value.progress * 100)
  })

  const timeRemainingFormatted = computed(() => {
    if (!currentJob.value || !currentJob.value.time_remaining) return ''

    const seconds = currentJob.value.time_remaining
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  })

  // Actions
  async function fetchJob() {
    try {
      const { DefaultService } = await import('../api')
      const response = await DefaultService.getJob()
      currentJob.value = response
    } catch (error) {
      console.error('Failed to fetch job:', error)
    }
  }

  async function pauseJob(id: string) {
    try {
      control.value.pauseInProgress = true
      const { DefaultService } = await import('../api')
      await DefaultService.pauseJob(id)
      await fetchJob()
    } catch (error) {
      console.error('Failed to pause job:', error)
    } finally {
      control.value.pauseInProgress = false
    }
  }

  async function resumeJob(id: string) {
    try {
      control.value.pauseInProgress = true
      const { DefaultService } = await import('../api')
      await DefaultService.resumeJob(id)
      await fetchJob()
    } catch (error) {
      console.error('Failed to resume job:', error)
    } finally {
      control.value.pauseInProgress = false
    }
  }

  async function stopJob(id: string) {
    try {
      control.value.stopInProgress = true
      const { DefaultService } = await import('../api')
      await DefaultService.stopJob(id)

      // Add to history before clearing
      if (currentJob.value) {
        addToHistory(currentJob.value)
      }

      currentJob.value = null
    } catch (error) {
      console.error('Failed to stop job:', error)
    } finally {
      control.value.stopInProgress = false
    }
  }

  function addToHistory(job: JobResponse) {
    history.value.unshift(job)

    // Keep only last 10
    if (history.value.length > 10) {
      history.value = history.value.slice(0, 10)
    }
  }

  return {
    // State
    currentJob,
    history,
    control,

    // Getters
    progressPercent,
    timeRemainingFormatted,

    // Actions
    fetchJob,
    pauseJob,
    resumeJob,
    stopJob,
    addToHistory
  }
})
