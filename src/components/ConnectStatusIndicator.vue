<script setup lang="ts">
import { computed } from 'vue'

type ConnectionState = 'connected' | 'offline' | 'connecting'

interface Props {
  connected: boolean
  connecting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  connecting: false
})

// Determine connection state
const state = computed<ConnectionState>(() => {
  if (props.connecting) return 'connecting'
  if (props.connected) return 'connected'
  return 'offline'
})

// Aria label for accessibility
const ariaLabel = computed(() => {
  const labels: Record<ConnectionState, string> = {
    connected: 'Connected',
    offline: 'Offline',
    connecting: 'Connecting'
  }
  return labels[state.value]
})

// CSS class for state
const stateClass = computed(() => {
  return `status-${state.value}`
})
</script>

<template>
  <div
    class="connection-indicator"
    :class="stateClass"
    :aria-label="ariaLabel"
    role="status"
  >
    <span class="indicator-dot"></span>
  </div>
</template>

<style scoped>
.connection-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--touch-min);
  height: var(--touch-min);
  min-width: var(--touch-min);
  min-height: var(--touch-min);
  background: transparent;
  border-radius: var(--radius-md);
  cursor: default;
  flex-shrink: 0;
}

.indicator-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Connected state - Green */
.status-connected .indicator-dot {
  background: var(--status-success);
}

/* Offline state - Red */
.status-offline .indicator-dot {
  background: var(--status-error);
}

/* Connecting state - Yellow with pulse animation */
.status-connecting .indicator-dot {
  background: var(--status-warning);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
</style>
