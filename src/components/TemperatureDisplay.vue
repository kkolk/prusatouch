<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  current: number
  target: number
  type: 'nozzle' | 'bed'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: []
}>()

// Determine temperature state
const tempState = computed(() => {
  if (props.current < 40) return 'cold'
  // Check if at target first (within 2 degrees)
  if (Math.abs(props.current - props.target) <= 2) return 'at-target'
  if (props.current < props.target) return 'heating'
  if (props.current > props.target + 2) return 'cooling'
  return 'at-target'
})

// Icon for type
const icon = computed(() => {
  return props.type === 'nozzle' ? '🔥' : '🛏️'
})

// CSS class for state
const stateClass = computed(() => {
  return `temp-${tempState.value}`
})
</script>

<template>
  <div class="temperature-display tappable" :class="stateClass" @click="emit('click')">
    <span class="icon">{{ icon }}</span>
    <div class="temps">
      <span class="current">{{ current }}°</span>
      <span class="separator">/</span>
      <span class="target">{{ target }}°</span>
    </div>
  </div>
</template>

<style scoped>
.temperature-display {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 18px;
  font-weight: var(--font-weight-bold);
}

.temperature-display.tappable {
  cursor: pointer;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  min-height: var(--touch-comfortable);
  transition: transform var(--transition-fast);
}

.temperature-display.tappable:hover {
  /* Remove background animation - not GPU accelerated */
}

.temperature-display.tappable:active {
  transform: scale(0.95);
}

.icon {
  font-size: 24px;
}

.temps {
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.separator {
  color: var(--text-tertiary);
}

.target {
  font-size: 14px;
  color: var(--text-secondary);
}

/* Temperature states */
.temp-cold {
  color: var(--text-tertiary);
}

.temp-heating {
  color: var(--prusa-orange);
  animation: pulse 2s ease-in-out infinite;
}

.temp-at-target {
  color: var(--status-success);
}

.temp-cooling {
  color: var(--status-info);
}

/* Pulsing animation for heating state */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
