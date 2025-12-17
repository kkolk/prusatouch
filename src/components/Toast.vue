<script setup lang="ts">
interface Props {
  visible: boolean
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  duration: 3000
})

const emit = defineEmits<{
  close: []
}>()

// Auto-close after duration
let timeout: number | null = null

function startAutoClose() {
  if (timeout) clearTimeout(timeout)

  if (props.visible && props.duration > 0) {
    timeout = window.setTimeout(() => {
      emit('close')
    }, props.duration)
  }
}

// Watch for visibility changes
import { watch } from 'vue'
watch(() => props.visible, (newValue) => {
  if (newValue) {
    startAutoClose()
  }
})
</script>

<template>
  <Transition name="toast">
    <div v-if="visible" class="toast" :class="`toast-${type}`">
      <span class="toast-message">{{ message }}</span>
      <button class="toast-close" @click="emit('close')">×</button>
    </div>
  </Transition>
</template>

<style scoped>
.toast {
  position: fixed;
  bottom: var(--space-lg);
  left: 50%;
  transform: translateX(-50%);
  min-width: 300px;
  max-width: 90%;
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  z-index: 3000;
  font-size: 16px;
}

.toast-info {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 2px solid var(--prusa-orange);
}

.toast-success {
  background: rgba(0, 200, 0, 0.2);
  color: var(--status-success);
  border: 2px solid var(--status-success);
}

.toast-warning {
  background: rgba(255, 170, 0, 0.2);
  color: var(--status-warning);
  border: 2px solid var(--status-warning);
}

.toast-error {
  background: rgba(204, 0, 0, 0.2);
  color: var(--status-error);
  border: 2px solid var(--status-error);
}

.toast-message {
  flex: 1;
  font-weight: 500;
}

.toast-close {
  background: transparent;
  border: none;
  color: inherit;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  min-width: var(--touch-min);
  min-height: var(--touch-min);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: opacity var(--transition-fast);
}

.toast-close:hover {
  opacity: 1;
}

/* Transition animations - GPU-accelerated */
.toast-enter-active,
.toast-leave-active {
  transition: transform var(--transition-normal), opacity var(--transition-normal);
}

.toast-enter-from,
.toast-leave-to {
  transform: translateX(-50%) translateY(20px);
  opacity: 0;
}
</style>
