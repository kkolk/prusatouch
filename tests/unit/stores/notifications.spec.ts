import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotificationsStore } from '../../../src/stores/notifications'

describe('notificationsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  it('shows toast notification', () => {
    const store = useNotificationsStore()

    store.showToast('Test message', 'info')

    expect(store.toasts.length).toBe(1)
    expect(store.toasts[0].message).toBe('Test message')
    expect(store.toasts[0].type).toBe('info')
  })

  it('generates unique IDs for toasts', () => {
    const store = useNotificationsStore()

    const id1 = store.showToast('Message 1')
    const id2 = store.showToast('Message 2')

    expect(id1).not.toBe(id2)
    expect(store.toasts.length).toBe(2)
  })

  it('removes toast by ID', () => {
    const store = useNotificationsStore()

    const id1 = store.showToast('Message 1')
    const id2 = store.showToast('Message 2')

    store.removeToast(id1)

    expect(store.toasts.length).toBe(1)
    expect(store.toasts[0].id).toBe(id2)
  })

  it('auto-removes toast after duration', () => {
    const store = useNotificationsStore()

    store.showToast('Test', 'info', 3000)
    expect(store.toasts.length).toBe(1)

    vi.advanceTimersByTime(3000)
    expect(store.toasts.length).toBe(0)
  })

  it('provides convenience methods for different types', () => {
    const store = useNotificationsStore()

    store.showError('Error message')
    store.showSuccess('Success message')
    store.showWarning('Warning message')
    store.showInfo('Info message')

    expect(store.toasts.length).toBe(4)
    expect(store.toasts.some(t => t.type === 'error')).toBe(true)
    expect(store.toasts.some(t => t.type === 'success')).toBe(true)
    expect(store.toasts.some(t => t.type === 'warning')).toBe(true)
    expect(store.toasts.some(t => t.type === 'info')).toBe(true)
  })

  it('uses default duration when not specified', () => {
    const store = useNotificationsStore()

    store.showToast('Test message')

    expect(store.toasts[0].duration).toBe(3000)
  })
})
