import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '../../../src/stores/settings'

describe('settingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Clear localStorage before each test
    localStorage.clear()
  })

  it('initializes with default settings', () => {
    const store = useSettingsStore()
    expect(store.settings.brightness).toBe(100)
    expect(store.settings.screensaverTimeout).toBe(5)
  })

  it('loads settings from localStorage if available', () => {
    localStorage.setItem('prusatouch-settings', JSON.stringify({
      brightness: 80,
      screensaverTimeout: 10
    }))

    const store = useSettingsStore()
    expect(store.settings.brightness).toBe(80)
    expect(store.settings.screensaverTimeout).toBe(10)
  })

  it('sets brightness within valid range', () => {
    const store = useSettingsStore()

    store.setBrightness(75)
    expect(store.settings.brightness).toBe(75)

    // Test minimum
    store.setBrightness(10)
    expect(store.settings.brightness).toBe(20)

    // Test maximum
    store.setBrightness(120)
    expect(store.settings.brightness).toBe(100)
  })

  it('sets screensaver timeout', () => {
    const store = useSettingsStore()

    store.setScreensaverTimeout(15)
    expect(store.settings.screensaverTimeout).toBe(15)

    // Test minimum
    store.setScreensaverTimeout(-5)
    expect(store.settings.screensaverTimeout).toBe(0)
  })

  it('persists settings to localStorage', () => {
    const store = useSettingsStore()

    store.setBrightness(60)
    store.setScreensaverTimeout(20)

    // Wait for watch to trigger
    return new Promise(resolve => {
      setTimeout(() => {
        const saved = localStorage.getItem('prusatouch-settings')
        expect(saved).toBeDefined()

        const parsed = JSON.parse(saved!)
        expect(parsed.brightness).toBe(60)
        expect(parsed.screensaverTimeout).toBe(20)

        resolve(undefined)
      }, 10)
    })
  })

  it('resets to default settings', () => {
    const store = useSettingsStore()

    store.setBrightness(50)
    store.setScreensaverTimeout(30)

    store.resetToDefaults()

    expect(store.settings.brightness).toBe(100)
    expect(store.settings.screensaverTimeout).toBe(5)
  })

  it('restarts interface by reloading window', () => {
    const store = useSettingsStore()
    const reloadSpy = vi.spyOn(window.location, 'reload')

    store.restartInterface()

    expect(reloadSpy).toHaveBeenCalled()
  })
})
