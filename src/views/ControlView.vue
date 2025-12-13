<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePrinterStore } from '../stores/printer'
import DirectionalPad from '../components/DirectionalPad.vue'
import TouchButton from '../components/TouchButton.vue'

// Store
const printerStore = usePrinterStore()

// Local state
const selectedStep = ref(1) // Default to 1mm
const stepOptions = [0.1, 1, 10, 100]

// Computed
const position = computed(() => ({
  x: printerStore.status?.axis_x ?? 0,
  y: printerStore.status?.axis_y ?? 0,
  z: printerStore.status?.axis_z ?? 0
}))

// Methods
function selectStep(step: number) {
  selectedStep.value = step
}

async function handleMove(event: { axis: 'x' | 'y' | 'z'; direction: number }) {
  const distance = selectedStep.value * event.direction
  await printerStore.moveAxis(event.axis, distance)
}

async function handleHomeAll() {
  await printerStore.homeAxes(['x', 'y', 'z'])
}

async function handleDisableSteppers() {
  await printerStore.disableSteppers()
}
</script>

<template>
  <div class="control-view">
    <!-- Position Display -->
    <div class="position-display">
      <h2 class="section-title">Position</h2>
      <div class="coordinates">
        <div class="coordinate">
          <span class="axis-label">X:</span>
          <span class="axis-value">{{ position.x.toFixed(2) }}</span>
        </div>
        <div class="coordinate">
          <span class="axis-label">Y:</span>
          <span class="axis-value">{{ position.y.toFixed(2) }}</span>
        </div>
        <div class="coordinate">
          <span class="axis-label">Z:</span>
          <span class="axis-value">{{ position.z.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <!-- Movement Controls -->
    <div class="movement-section">
      <h2 class="section-title">Movement</h2>

      <!-- Step Selector -->
      <div class="step-selector">
        <button
          v-for="step in stepOptions"
          :key="step"
          class="step-button"
          :class="{ active: selectedStep === step }"
          @click="selectStep(step)"
        >
          {{ step }}mm
        </button>
      </div>

      <!-- Directional Pad -->
      <div class="pad-container">
        <DirectionalPad @move="handleMove" />
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <TouchButton variant="secondary" @click="handleHomeAll">
          Home All
        </TouchButton>
        <TouchButton variant="secondary" @click="handleDisableSteppers">
          Disable Steppers
        </TouchButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.control-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--space-md);
  gap: var(--space-lg);
  overflow-y: auto;
}

/* Position Display */
.position-display {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.section-title {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  color: var(--text-primary);
}

.coordinates {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.coordinate {
  display: flex;
  align-items: baseline;
  gap: var(--space-xs);
}

.axis-label {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-secondary);
}

.axis-value {
  font-size: 20px;
  font-weight: bold;
  color: var(--prusa-orange);
  font-family: monospace;
}

/* Movement Section */
.movement-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

/* Step Selector */
.step-selector {
  display: flex;
  gap: var(--space-sm);
  justify-content: center;
}

.step-button {
  min-width: var(--touch-comfortable);
  min-height: var(--touch-min);
  padding: var(--space-sm) var(--space-md);
  border: 2px solid var(--bg-tertiary);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: transform var(--transition-fast);
  font-family: inherit;
}

.step-button:active {
  transform: scale(0.95);
}

.step-button.active {
  border-color: var(--prusa-orange);
  background: var(--bg-tertiary);
  color: var(--prusa-orange);
}

/* Pad Container */
.pad-container {
  display: flex;
  justify-content: center;
  padding: var(--space-md) 0;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: var(--space-md);
  justify-content: center;
  margin-top: var(--space-sm);
}
</style>
