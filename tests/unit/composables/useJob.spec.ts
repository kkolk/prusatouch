import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'

vi.mock('../../../src/api', () => ({
  DefaultService: {
    getApiV1Job: vi.fn(),
    putApiV1JobPause: vi.fn(),
    putApiV1JobResume: vi.fn(),
    deleteApiV1Job: vi.fn()
  }
}))

describe('useJob', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('provides reactive job progress', async () => {
    const { DefaultService } = await import('../../../src/api')
    vi.mocked(DefaultService.getApiV1Job).mockResolvedValue({
      id: 123,
      state: 'PRINTING',
      progress: 0.45,
      time_remaining: 3600,
      time_printing: 1800,
      file: { name: 'test.gcode', path: '/usb/test.gcode' }
    })

    const { useJob } = await import('../../../src/composables/useJob')
    const { progress, timeRemaining, fileName, fetchJob } = useJob()

    await fetchJob()
    await nextTick()

    expect(progress.value).toBe(45)
    expect(timeRemaining.value).toBe('1h 0m')
    expect(fileName.value).toBe('test.gcode')
  })

  it('provides formatted time under 1 hour', async () => {
    const { DefaultService } = await import('../../../src/api')
    vi.mocked(DefaultService.getApiV1Job).mockResolvedValue({
      id: 123,
      progress: 0.80,
      time_remaining: 1500  // 25 minutes
    })

    const { useJob } = await import('../../../src/composables/useJob')
    const { timeRemaining, fetchJob } = useJob()

    await fetchJob()
    await nextTick()

    expect(timeRemaining.value).toBe('25m')
  })

  it('handles no active job', async () => {
    const { DefaultService } = await import('../../../src/api')
    vi.mocked(DefaultService.getApiV1Job).mockResolvedValue(null)

    const { useJob } = await import('../../../src/composables/useJob')
    const { hasActiveJob, progress, fetchJob } = useJob()

    await fetchJob()
    await nextTick()

    expect(hasActiveJob.value).toBe(false)
    expect(progress.value).toBe(0)
  })

  it('exposes pause action with loading state', async () => {
    const { DefaultService } = await import('../../../src/api')
    vi.mocked(DefaultService.getApiV1Job).mockResolvedValue({ id: 123 })
    vi.mocked(DefaultService.putApiV1JobPause).mockResolvedValue(undefined)

    const { useJob } = await import('../../../src/composables/useJob')
    const { pauseJob, isPausing, fetchJob } = useJob()

    await fetchJob()

    const pausePromise = pauseJob()
    expect(isPausing.value).toBe(true)

    await pausePromise
    expect(isPausing.value).toBe(false)
    expect(DefaultService.putApiV1JobPause).toHaveBeenCalledWith(123)
  })

  it('exposes resume action with loading state', async () => {
    const { DefaultService } = await import('../../../src/api')
    vi.mocked(DefaultService.getApiV1Job).mockResolvedValue({ id: 456 })
    vi.mocked(DefaultService.putApiV1JobResume).mockResolvedValue(undefined)

    const { useJob } = await import('../../../src/composables/useJob')
    const { resumeJob, isPausing, fetchJob } = useJob()

    await fetchJob()

    await resumeJob()
    expect(DefaultService.putApiV1JobResume).toHaveBeenCalledWith(456)
  })

  it('exposes stop action with loading state', async () => {
    const { DefaultService } = await import('../../../src/api')
    vi.mocked(DefaultService.getApiV1Job).mockResolvedValue({ id: 789 })
    vi.mocked(DefaultService.deleteApiV1Job).mockResolvedValue(undefined)

    const { useJob } = await import('../../../src/composables/useJob')
    const { stopJob, isStopping, fetchJob } = useJob()

    await fetchJob()

    const stopPromise = stopJob()
    expect(isStopping.value).toBe(true)

    await stopPromise
    expect(isStopping.value).toBe(false)
    expect(DefaultService.deleteApiV1Job).toHaveBeenCalledWith(789)
  })
})
