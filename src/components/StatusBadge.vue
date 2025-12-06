<script setup lang="ts">
import { computed } from 'vue'

type PrinterState = 'IDLE' | 'PRINTING' | 'PAUSED' | 'ERROR' | 'FINISHED'

interface Props {
  state: PrinterState
}

const props = defineProps<Props>()

// CSS class for state
const stateClass = computed(() => {
  return `status-${props.state.toLowerCase()}`
})
</script>

<template>
  <div class="status-badge" :class="stateClass">
    <span class="status-dot"></span>
    <span class="status-text">{{ state }}</span>
  </div>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: bold;
  text-transform: uppercase;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* IDLE state - Gray */
.status-idle {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.status-idle .status-dot {
  background: var(--text-tertiary);
}

/* PRINTING state - Orange with breathing animation */
.status-printing {
  background: rgba(255, 102, 0, 0.2);
  color: var(--prusa-orange);
  animation: breathe 2s ease-in-out infinite;
}

.status-printing .status-dot {
  background: var(--prusa-orange);
  animation: pulse 1.5s ease-in-out infinite;
}

/* PAUSED state - Yellow with blinking */
.status-paused {
  background: rgba(255, 170, 0, 0.2);
  color: var(--status-warning);
}

.status-paused .status-dot {
  background: var(--status-warning);
  animation: blink 1s step-start infinite;
}

/* ERROR state - Red with shake on mount */
.status-error {
  background: rgba(204, 0, 0, 0.2);
  color: var(--status-error);
  animation: shake 0.5s ease-in-out;
}

.status-error .status-dot {
  background: var(--status-error);
}

/* FINISHED state - Green */
.status-finished {
  background: rgba(0, 255, 0, 0.2);
  color: var(--status-success);
}

.status-finished .status-dot {
  background: var(--status-success);
  animation: fadeIn 0.5s ease-out;
}

/* Animations - GPU-accelerated (opacity only) */
@keyframes breathe {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

@keyframes blink {
  0%, 49% {
    opacity: 1;
  }
  50%, 100% {
    opacity: 0;
  }
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-5px);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(5px);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
