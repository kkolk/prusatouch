<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { usePrinterStore } from '../stores/printer'
import DirectionalPad from '../components/DirectionalPad.vue'
import TouchButton from '../components/TouchButton.vue'

// Store
const printerStore = usePrinterStore()

// Lifecycle - Start/stop polling when view is mounted/unmounted
onMounted(() => {
  printerStore.startPolling()
})

onUnmounted(() => {
  printerStore.stopPolling()
})

// Local state
const selectedStep = ref(1) // Default to 1mm
const stepOptions = [0.1, 1, 10, 100]
const errorMessage = ref<string>('')
const isLoading = ref(false)

// Methods
function selectStep(step: number) {
  selectedStep.value = step
}

async function handleMove(event: { axis: 'x' | 'y' | 'z'; direction: number }) {
  try {
    errorMessage.value = ''
    isLoading.value = true
    const distance = selectedStep.value * event.direction
    await printerStore.moveAxis(event.axis, distance)
  } catch (error) {
    console.error('Failed to move axis:', error)
    errorMessage.value = `Failed to move ${event.axis.toUpperCase()} axis. Please try again.`
  } finally {
    isLoading.value = false
  }
}

async function handleHomeAll() {
  try {
    errorMessage.value = ''
    isLoading.value = true
    await printerStore.homeAxes(['x', 'y', 'z'])
  } catch (error) {
    console.error('Failed to home axes:', error)
    errorMessage.value = 'Failed to home all axes. Please try again.'
  } finally {
    isLoading.value = false
  }
}

async function handleDisableSteppers() {
  try {
    errorMessage.value = ''
    isLoading.value = true
    await printerStore.disableSteppers()
  } catch (error) {
    console.error('Failed to disable steppers:', error)
    errorMessage.value = 'Failed to disable steppers. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="control-view">
    <!-- Error Message -->
    <div v-if="errorMessage" class="error-banner">
      {{ errorMessage }}
    </div>

    <!-- Movement Controls -->
    <div class="movement-section">

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
        <TouchButton variant="secondary" :loading="isLoading" @click="handleHomeAll">
          Home All
        </TouchButton>
        <TouchButton variant="secondary" :loading="isLoading" @click="handleDisableSteppers">
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

/* Error Banner */
.error-banner {
  padding: var(--space-md);
  background: rgba(255, 0, 0, 0.1);
  border: 2px solid rgba(255, 0, 0, 0.3);
  border-radius: var(--radius-md);
  color: #ff6b6b;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
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
