import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'

// Mock the API before importing composable
vi.mock('../../../src/api', () => ({
  DefaultService: {
    getApiV1Status: vi.fn()
  }
}))

describe('useStatus', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('provides reactive printer state', async () => {
    const { DefaultService } = await import('../../../src/api')
    vi.mocked(DefaultService.getApiV1Status).mockResolvedValue({
      printer: {
        state: 'IDLE',
        temp_nozzle: 25,
        temp_bed: 22,
        target_nozzle: 0,
        target_bed: 0
      }
    })

    const { useStatus } = await import('../../../src/composables/useStatus')
    const { printerState, nozzleTemp, bedTemp, isConnected } = useStatus()

    // Wait for initial fetch
    await vi.runAllTimersAsync()
    await nextTick()

    expect(printerState.value).toBe('IDLE')
    expect(nozzleTemp.value).toEqual({ current: 25, target: 0 })
    expect(bedTemp.value).toEqual({ current: 22, target: 0 })
    expect(isConnected.value).toBe(true)
  })

  it('provides formatted state for StatusBadge', async () => {
    const { DefaultService } = await import('../../../src/api')
    vi.mocked(DefaultService.getApiV1Status).mockResolvedValue({
      printer: { state: 'PRINTING' }
    })

    const { useStatus } = await import('../../../src/composables/useStatus')
    const { printerState } = useStatus()

    await vi.runAllTimersAsync()
    await nextTick()

    expect(printerState.value).toBe('PRINTING')
  })

  it('handles connection errors gracefully', async () => {
    const { DefaultService } = await import('../../../src/api')
    vi.mocked(DefaultService.getApiV1Status).mockRejectedValue(new Error('Network error'))

    const { useStatus } = await import('../../../src/composables/useStatus')
    const { isConnected, connectionError } = useStatus()

    await vi.runAllTimersAsync()
    await nextTick()

    expect(isConnected.value).toBe(false)
    expect(connectionError.value).toBeTruthy()
  })

  it('starts polling when startPolling is called', async () => {
    const { DefaultService } = await import('../../../src/api')
    vi.mocked(DefaultService.getApiV1Status).mockResolvedValue({
      printer: { state: 'IDLE' }
    })

    const { useStatus } = await import('../../../src/composables/useStatus')
    const { startPolling, stopPolling } = useStatus()

    startPolling()
    await vi.advanceTimersByTimeAsync(5000)

    expect(DefaultService.getApiV1Status).toHaveBeenCalled()

    stopPolling()
  })

  it('stops polling when stopPolling is called', async () => {
    const { DefaultService } = await import('../../../src/api')
    vi.mocked(DefaultService.getApiV1Status).mockResolvedValue({
      printer: { state: 'IDLE' }
    })

    const { useStatus } = await import('../../../src/composables/useStatus')
    const { startPolling, stopPolling } = useStatus()

    startPolling()
    await vi.advanceTimersByTimeAsync(1000)
    const callCount = vi.mocked(DefaultService.getApiV1Status).mock.calls.length

    stopPolling()
    await vi.advanceTimersByTimeAsync(10000)

    // Should not have made more calls after stopping
    expect(vi.mocked(DefaultService.getApiV1Status).mock.calls.length).toBe(callCount)
  })
})
