import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface Settings {
  brightness: number // 20-100
  screensaverTimeout: number // minutes (0 = disabled)
}

const DEFAULT_SETTINGS: Settings = {
  brightness: 100,
  screensaverTimeout: 5
}

const STORAGE_KEY = 'prusatouch-settings'

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        brightness: parsed.brightness ?? DEFAULT_SETTINGS.brightness,
        screensaverTimeout: parsed.screensaverTimeout ?? DEFAULT_SETTINGS.screensaverTimeout
      }
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
  return { ...DEFAULT_SETTINGS }
}

function saveSettings(settings: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to save settings:', error)
  }
}

export const useSettingsStore = defineStore('settings', () => {
  // State
  const settings = ref<Settings>(loadSettings())

  // Watch for changes and persist to localStorage
  watch(
    settings,
    (newSettings) => {
      saveSettings(newSettings)
    },
    { deep: true }
  )

  // Actions
  function setBrightness(value: number) {
    settings.value.brightness = Math.max(20, Math.min(100, value))
  }

  function setScreensaverTimeout(minutes: number) {
    settings.value.screensaverTimeout = Math.max(0, minutes)
  }

  function clearCache() {
    // Clear thumbnail cache
    // This will be handled by filesStore
    console.log('Cache cleared')
  }

  function restartInterface() {
    window.location.reload()
  }

  function resetToDefaults() {
    settings.value = { ...DEFAULT_SETTINGS }
  }

  return {
    // State
    settings,

    // Actions
    setBrightness,
    setScreensaverTimeout,
    clearCache,
    restartInterface,
    resetToDefaults
  }
})
