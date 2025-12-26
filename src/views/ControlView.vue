<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { usePrinterStore } from '../stores/printer'
import DirectionalPad from '../components/DirectionalPad.vue'
import TouchButton from '../components/TouchButton.vue'
import ExtruderControl from '../components/ExtruderControl.vue'

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
const showExtruderControl = ref(false)

// Computed
const nozzleTemp = computed(() => ({
  current: printerStore.status?.temp_nozzle || 0,
  target: printerStore.status?.target_nozzle || 0
}))

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

async function handleHomeX() {
  try {
    errorMessage.value = ''
    isLoading.value = true
    await printerStore.homeAxes(['x'])
  } catch (error) {
    console.error('Failed to home X axis:', error)
    errorMessage.value = 'Failed to home X axis. Please try again.'
  } finally {
    isLoading.value = false
  }
}

async function handleHomeY() {
  try {
    errorMessage.value = ''
    isLoading.value = true
    await printerStore.homeAxes(['y'])
  } catch (error) {
    console.error('Failed to home Y axis:', error)
    errorMessage.value = 'Failed to home Y axis. Please try again.'
  } finally {
    isLoading.value = false
  }
}

async function handleHomeZ() {
  try {
    errorMessage.value = ''
    isLoading.value = true
    await printerStore.homeAxes(['z'])
  } catch (error) {
    console.error('Failed to home Z axis:', error)
    errorMessage.value = 'Failed to home Z axis. Please try again.'
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

function openExtruderControl() {
  showExtruderControl.value = true
}

function closeExtruderControl() {
  showExtruderControl.value = false
}

async function handleExtrude(amount: number) {
  try {
    errorMessage.value = ''
    isLoading.value = true
    await printerStore.extrudeFilament(amount)
  } catch (error) {
    console.error('Failed to extrude:', error)
    errorMessage.value = 'Failed to extrude filament. Please try again.'
  } finally {
    isLoading.value = false
  }
}

async function handleRetract(amount: number) {
  try {
    errorMessage.value = ''
    isLoading.value = true
    await printerStore.retractFilament(amount)
  } catch (error) {
    console.error('Failed to retract:', error)
    errorMessage.value = 'Failed to retract filament. Please try again.'
  } finally {
    isLoading.value = false
  }
}

async function handleSetTemp(temp: number) {
  try {
    errorMessage.value = ''
    isLoading.value = true
    await printerStore.setNozzleTemp(temp)
  } catch (error) {
    console.error('Failed to set nozzle temperature:', error)
    errorMessage.value = 'Failed to set nozzle temperature. Please try again.'
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

    <!-- 3-Column Layout -->
    <div class="control-container">
      <!-- LEFT Column: Distance Controls -->
      <div class="column column-left">
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
      </div>

      <!-- CENTER Column: Directional Pad -->
      <div class="column column-center">
        <DirectionalPad @move="handleMove" />
      </div>

      <!-- RIGHT Column: Action Buttons -->
      <div class="column column-right">
        <TouchButton variant="secondary" size="min" :loading="isLoading" @click="handleHomeAll">
          Home All
        </TouchButton>
        <TouchButton variant="secondary" size="min" :loading="isLoading" @click="handleHomeX">
          Home X
        </TouchButton>
        <TouchButton variant="secondary" size="min" :loading="isLoading" @click="handleHomeY">
          Home Y
        </TouchButton>
        <TouchButton variant="secondary" size="min" :loading="isLoading" @click="handleHomeZ">
          Home Z
        </TouchButton>
        <TouchButton variant="primary" size="min" @click="openExtruderControl">
          Extruder Controls
        </TouchButton>
        <TouchButton variant="secondary" size="min" :loading="isLoading" @click="handleDisableSteppers">
          Disable Steppers
        </TouchButton>
      </div>
    </div>

    <!-- Extruder Control Bottom Sheet -->
    <ExtruderControl
      :visible="showExtruderControl"
      :current="nozzleTemp.current"
      :target="nozzleTemp.target"
      @close="closeExtruderControl"
      @extrude="handleExtrude"
      @retract="handleRetract"
      @set-temp="handleSetTemp"
    />
  </div>
</template>

<style scoped>
.control-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--space-xs);
  gap: var(--space-xs);
  overflow: hidden;
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

/* 3-Column Control Container */
.control-container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-md);
  height: 100%;
  align-items: center;
  padding: var(--space-sm);
}

/* Column Base Styles */
.column {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  align-items: center;
  justify-content: center;
  height: 100%;
}

/* Left Column: Step Selector */
.column-left {
  justify-content: center;
}

/* Center Column: Directional Pad */
.column-center {
  justify-content: center;
}

/* Right Column: Action Buttons */
.column-right {
  justify-content: flex-start;
  padding-top: var(--space-md);
}

/* Step Selector */
.step-selector {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  align-items: center;
  justify-content: center;
}

.step-button {
  min-width: var(--touch-comfortable);
  min-height: var(--touch-min);
  padding: var(--space-xs) var(--space-md);
  border: 2px solid var(--bg-tertiary);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: transform var(--transition-fast);
  font-family: inherit;
  width: 70px;
  text-align: center;
}

.step-button:active {
  transform: scale(0.95);
}

.step-button.active {
  border-color: var(--prusa-orange);
  background: var(--bg-tertiary);
  color: var(--prusa-orange);
}
</style>
