<script setup lang="ts">
import { ref, computed } from 'vue'
import BottomSheet from './BottomSheet.vue'
import TouchButton from './TouchButton.vue'

interface Props {
  visible: boolean
  current: number
  target: number
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<{
  close: []
  extrude: [amount: number]
  retract: [amount: number]
  'set-temp': [temp: number]
}>()

// Local state
const selectedAmount = ref(5) // Default to 5mm
const amountOptions = [1, 5, 10, 25]

// Temperature presets
const presets = [
  { label: 'PLA', temp: 215 },
  { label: 'PETG', temp: 240 },
  { label: 'ABS', temp: 255 },
  { label: 'Off', temp: 0 }
]

// Computed
const isHot = computed(() => props.current >= 170)
const isCold = computed(() => props.current < 40)
const isHeating = computed(() => props.current < props.target && props.target > 0)
const isReady = computed(() => isHot.value && Math.abs(props.current - props.target) < 5)

// Can extrude if nozzle is hot AND not disabled
const canExtrude = computed(() => isHot.value && !props.disabled)

const statusClass = computed(() => {
  if (isCold.value) return 'status-cold'
  if (isReady.value) return 'status-ready'
  if (isHeating.value) return 'status-heating'
  return ''
})

// Methods
function selectAmount(amount: number) {
  selectedAmount.value = amount
}

function handleExtrude() {
  if (isHot.value) {
    emit('extrude', selectedAmount.value)
  }
}

function handleRetract() {
  if (isHot.value) {
    emit('retract', selectedAmount.value)
  }
}

function handlePreset(temp: number) {
  emit('set-temp', temp)
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <BottomSheet :visible="visible" title="Extruder Control" @close="handleClose">
    <!-- Current/Target Display -->
    <div class="temp-status">
      <div class="temp-reading">
        <span class="label">Current</span>
        <span class="value">{{ current }}°</span>
      </div>
      <div class="temp-reading">
        <span class="label">Target</span>
        <span class="value">{{ target }}°</span>
      </div>
    </div>

    <!-- Status Indicator -->
    <div class="status-indicator" :class="statusClass">
      <span v-if="isCold" class="status-text">Cold</span>
      <span v-else-if="isHeating" class="status-text">Heating...</span>
      <span v-else-if="isReady" class="status-text">Ready</span>
      <span v-else class="status-text">Standby</span>
    </div>

    <!-- Temperature Presets -->
    <div class="presets">
      <button
        v-for="preset in presets"
        :key="preset.label"
        class="preset-button"
        @click="handlePreset(preset.temp)"
      >
        <span class="preset-label">{{ preset.label }}</span>
        <span class="preset-temp">{{ preset.temp }}°</span>
      </button>
    </div>

    <!-- Warning for cold extruder -->
    <div v-if="!isHot" class="warning">
      Extrusion locked - nozzle must be at least 170°C
    </div>

    <!-- Amount Selector -->
    <div class="amount-selector">
      <span class="section-label">Extrude/Retract Amount:</span>
      <div class="amount-buttons">
        <button
          v-for="amount in amountOptions"
          :key="amount"
          class="amount-button"
          :class="{ active: selectedAmount === amount }"
          @click="selectAmount(amount)"
        >
          {{ amount }}mm
        </button>
      </div>
    </div>

    <!-- Extrude/Retract Controls -->
    <div class="extrude-controls">
      <TouchButton
        variant="primary"
        size="large"
        :disabled="!canExtrude"
        @click="handleExtrude"
      >
        Extrude
      </TouchButton>
      <TouchButton
        variant="secondary"
        size="large"
        :disabled="!canExtrude"
        @click="handleRetract"
      >
        Retract
      </TouchButton>
    </div>

    <template #actions>
      <TouchButton variant="secondary" @click="handleClose">
        Close
      </TouchButton>
    </template>
  </BottomSheet>
</template>

<style scoped>
/* Temperature Status */
.temp-status {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-md);
}

.temp-reading {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.temp-reading .label {
  font-size: var(--font-sm);
  color: var(--text-secondary);
}

.temp-reading .value {
  font-size: var(--font-xl);
  font-weight: var(--font-weight-bold);
  color: var(--prusa-orange);
  font-family: monospace;
}

/* Status Indicator */
.status-indicator {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  text-align: center;
  margin-bottom: var(--space-md);
  transition: opacity var(--transition-normal);
}

.status-text {
  font-size: var(--font-md);
  font-weight: var(--font-weight-bold);
}

.status-cold {
  background: rgba(100, 100, 255, 0.2);
  color: #6666ff;
}

.status-heating {
  background: rgba(255, 170, 0, 0.2);
  color: var(--status-warning);
}

.status-ready {
  background: rgba(0, 255, 0, 0.2);
  color: var(--status-success);
}

/* Temperature Presets */
.presets {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.preset-button {
  min-height: var(--touch-comfortable);
  padding: var(--space-sm);
  border: 2px solid var(--bg-tertiary);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  transition: transform var(--transition-fast);
  font-family: inherit;
}

.preset-button:active {
  transform: scale(0.95);
}

.preset-label {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-bold);
}

.preset-temp {
  font-size: var(--font-xs);
  color: var(--text-secondary);
}

/* Warning */
.warning {
  padding: var(--space-sm) var(--space-md);
  background: rgba(204, 0, 0, 0.2);
  color: var(--status-error);
  border-radius: var(--radius-md);
  text-align: center;
  font-size: var(--font-sm);
  margin-bottom: var(--space-md);
}

/* Amount Selector */
.amount-selector {
  margin-bottom: var(--space-md);
}

.section-label {
  display: block;
  font-size: var(--font-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
}

.amount-buttons {
  display: flex;
  gap: var(--space-sm);
}

.amount-button {
  flex: 1;
  min-height: var(--touch-min);
  padding: var(--space-sm) var(--space-md);
  border: 2px solid var(--bg-tertiary);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: var(--font-md);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: transform var(--transition-fast);
  font-family: inherit;
}

.amount-button:active {
  transform: scale(0.95);
}

.amount-button.active {
  border-color: var(--prusa-orange);
  background: var(--bg-tertiary);
  color: var(--prusa-orange);
}

/* Extrude Controls */
.extrude-controls {
  display: flex;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.extrude-controls button {
  flex: 1;
}
</style>
