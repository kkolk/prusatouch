import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface Settings {
  // No brightness/screensaver settings - removed
}

const DEFAULT_SETTINGS: Settings = {
}

const STORAGE_KEY = 'prusatouch-settings'

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        ...DEFAULT_SETTINGS,
        ...parsed
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
    clearCache,
    restartInterface,
    resetToDefaults
  }
})
