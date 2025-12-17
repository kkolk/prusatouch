import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Toast {
  id: number
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  duration: number
}

export const useNotificationsStore = defineStore('notifications', () => {
  // State
  const toasts = ref<Toast[]>([])
  let nextId = 1

  // Actions
  function showToast(message: string, type: Toast['type'] = 'info', duration = 3000) {
    const id = nextId++
    const toast: Toast = { id, message, type, duration }

    toasts.value.push(toast)

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }

  function removeToast(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  function showError(message: string) {
    return showToast(message, 'error', 5000)
  }

  function showSuccess(message: string) {
    return showToast(message, 'success', 3000)
  }

  function showWarning(message: string) {
    return showToast(message, 'warning', 4000)
  }

  function showInfo(message: string) {
    return showToast(message, 'info', 3000)
  }

  return {
    // State
    toasts,

    // Actions
    showToast,
    removeToast,
    showError,
    showSuccess,
    showWarning,
    showInfo
  }
})
