<script setup lang="ts">
import { ref, computed } from 'vue'
import BottomSheet from './BottomSheet.vue'
import TouchButton from './TouchButton.vue'
import { usePrinterStore } from '../stores/printer'

interface Props {
  visible: boolean
  type: 'nozzle' | 'bed'
  current: number
  target: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const printerStore = usePrinterStore()

// Local state
const customTemp = ref<number>(0)
const loading = ref(false)

// Presets based on type
const presets = computed(() => {
  if (props.type === 'nozzle') {
    return [
      { label: 'PLA', temp: 215 },
      { label: 'PETG', temp: 240 },
      { label: 'ABS', temp: 255 },
      { label: 'Off', temp: 0 }
    ]
  } else {
    return [
      { label: 'PLA', temp: 60 },
      { label: 'PETG', temp: 85 },
      { label: 'ABS', temp: 100 },
      { label: 'Off', temp: 0 }
    ]
  }
})

// Title based on type
const title = computed(() => {
  return props.type === 'nozzle' ? 'Nozzle Temperature' : 'Bed Temperature'
})

// Handle preset click
function selectPreset(temp: number) {
  customTemp.value = temp
}

// Handle Set button click
async function handleSet() {
  loading.value = true
  try {
    if (props.type === 'nozzle') {
      await printerStore.setNozzleTemp(customTemp.value)
    } else {
      await printerStore.setBedTemp(customTemp.value)
    }
    emit('close')
  } catch (error) {
    console.error('Failed to set temperature:', error)
  } finally {
    loading.value = false
  }
}

// Handle Cancel button click
function handleCancel() {
  emit('close')
}
</script>

<template>
  <BottomSheet :visible="visible" :title="title" @close="handleCancel">
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

    <!-- Quick Presets -->
    <div class="presets">
      <button
        v-for="preset in presets"
        :key="preset.label"
        class="preset-button"
        @click="selectPreset(preset.temp)"
      >
        <span class="preset-label">{{ preset.label }}</span>
        <span class="preset-temp">{{ preset.temp }}°</span>
      </button>
    </div>

    <!-- Custom Temperature Input -->
    <div class="custom-input">
      <label for="custom-temp">Custom Temperature</label>
      <input
        id="custom-temp"
        v-model.number="customTemp"
        type="number"
        min="0"
        :max="type === 'nozzle' ? 300 : 120"
        step="5"
      />
    </div>

    <!-- Actions -->
    <template #actions>
      <TouchButton variant="secondary" size="large" @click="handleCancel">
        Cancel
      </TouchButton>
      <TouchButton
        variant="primary"
        size="large"
        :loading="loading"
        @click="handleSet"
      >
        Set
      </TouchButton>
    </template>
  </BottomSheet>
</template>

<style scoped>
.temp-status {
  display: flex;
  justify-content: space-around;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.temp-reading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
}

.temp-reading .label {
  font-size: 14px;
  color: var(--text-tertiary);
  text-transform: uppercase;
}

.temp-reading .value {
  font-size: 32px;
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.presets {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.preset-button {
  min-height: var(--touch-comfortable);
  padding: var(--space-md);
  background: var(--bg-tertiary);
  border: 2px solid var(--bg-tertiary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: transform var(--transition-fast);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  font-family: inherit;
}

.preset-button:hover {
  /* Remove border-color animation - not GPU accelerated */
}

.preset-button:active {
  transform: scale(0.95);
}

.preset-label {
  font-size: 16px;
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.preset-temp {
  font-size: 14px;
  color: var(--text-secondary);
}

.custom-input {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.custom-input label {
  font-size: 14px;
  color: var(--text-tertiary);
  text-transform: uppercase;
}

.custom-input input {
  min-height: var(--touch-comfortable);
  padding: var(--space-md);
  background: var(--bg-tertiary);
  border: 2px solid var(--bg-tertiary);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 18px;
  font-weight: var(--font-weight-bold);
  font-family: inherit;
}

.custom-input input:focus {
  outline: none;
  border-color: var(--prusa-orange);
}
</style>
