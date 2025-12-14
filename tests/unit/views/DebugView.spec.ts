import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import DebugView from '../../../src/views/DebugView.vue'
import { useDebugLogStore } from '../../../src/stores/debugLog'

describe('DebugView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should render', () => {
    const wrapper = mount(DebugView)
    expect(wrapper.exists()).toBe(true)
  })

  it('should display "No logs yet" when there are no logs', () => {
    const wrapper = mount(DebugView)
    expect(wrapper.text()).toContain('No logs yet')
  })

  it('should display log entries', () => {
    const store = useDebugLogStore()

    store.addLog({
      timestamp: new Date('2024-01-01T12:00:00Z'),
      method: 'GET',
      endpoint: '/api/v1/status',
      status: 200,
      error: null
    })

    const wrapper = mount(DebugView)

    expect(wrapper.text()).toContain('GET')
    expect(wrapper.text()).toContain('/api/v1/status')
    expect(wrapper.text()).toContain('200')
  })

  it('should display multiple log entries', () => {
    const store = useDebugLogStore()

    store.addLog({
      timestamp: new Date('2024-01-01T12:00:00Z'),
      method: 'GET',
      endpoint: '/api/v1/status',
      status: 200,
      error: null
    })

    store.addLog({
      timestamp: new Date('2024-01-01T12:00:01Z'),
      method: 'POST',
      endpoint: '/api/v1/printer/printhead',
      status: 204,
      error: null
    })

    const wrapper = mount(DebugView)

    expect(wrapper.text()).toContain('GET')
    expect(wrapper.text()).toContain('POST')
  })

  it('should display error messages', () => {
    const store = useDebugLogStore()

    store.addLog({
      timestamp: new Date('2024-01-01T12:00:00Z'),
      method: 'POST',
      endpoint: '/api/v1/printer/printhead',
      status: 409,
      error: 'Printer busy or not ready'
    })

    const wrapper = mount(DebugView)

    expect(wrapper.text()).toContain('409')
    expect(wrapper.text()).toContain('Printer busy or not ready')
  })

  it('should clear logs when Clear button is clicked', async () => {
    const store = useDebugLogStore()

    store.addLog({
      timestamp: new Date('2024-01-01T12:00:00Z'),
      method: 'GET',
      endpoint: '/api/v1/status',
      status: 200,
      error: null
    })

    const wrapper = mount(DebugView)

    // Should have logs before clearing
    expect(store.logs).toHaveLength(1)

    // Find and click the clear button
    const clearButton = wrapper.find('[data-testid="clear-logs-button"]')
    await clearButton.trigger('click')

    // Logs should be cleared
    expect(store.logs).toHaveLength(0)
  })

  it('should display logs in reverse chronological order (newest first)', () => {
    const store = useDebugLogStore()

    const timestamp1 = new Date('2024-01-01T12:00:00Z')
    const timestamp2 = new Date('2024-01-01T12:00:01Z')
    const timestamp3 = new Date('2024-01-01T12:00:02Z')

    store.addLog({
      timestamp: timestamp1,
      method: 'GET',
      endpoint: '/api/v1/status',
      status: 200,
      error: null
    })

    store.addLog({
      timestamp: timestamp2,
      method: 'POST',
      endpoint: '/api/v1/printer/printhead',
      status: 204,
      error: null
    })

    store.addLog({
      timestamp: timestamp3,
      method: 'GET',
      endpoint: '/api/v1/job',
      status: 200,
      error: null
    })

    const wrapper = mount(DebugView)

    // Get all log entry elements
    const logEntries = wrapper.findAll('.log-entry')

    // Should have 3 entries
    expect(logEntries).toHaveLength(3)

    // Newest should be first (index 0)
    expect(logEntries[0].text()).toContain('/api/v1/job')

    // Oldest should be last (index 2)
    expect(logEntries[2].text()).toContain('/api/v1/status')
  })
})
