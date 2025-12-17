<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { useFilesStore } from '../stores/files'
import TouchButton from '../components/TouchButton.vue'

const settingsStore = useSettingsStore()
const filesStore = useFilesStore()

// Local state
const networkInfo = ref({
  ip: 'Loading...',
  hostname: window.location.hostname || 'Unknown'
})

const systemInfo = ref({
  appVersion: '1.0.0',
  userAgent: navigator.userAgent,
  platform: navigator.platform,
  memory: (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : 'Unknown'
})

const screensaverOptions = [
  { value: 0, label: 'Disabled' },
  { value: 1, label: '1 minute' },
  { value: 5, label: '5 minutes' },
  { value: 10, label: '10 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' }
]

// Lifecycle
onMounted(() => {
  // Try to get IP from network APIs (not always available in browser)
  // For now, just show hostname
  networkInfo.value.ip = 'See network settings'
})

// Methods
function handleBrightnessChange(event: Event) {
  const target = event.target as HTMLInputElement
  settingsStore.setBrightness(Number(target.value))
}

function handleScreensaverChange(event: Event) {
  const target = event.target as HTMLSelectElement
  settingsStore.setScreensaverTimeout(Number(target.value))
}

function handleClearCache() {
  if (confirm('Clear all cached thumbnails?')) {
    filesStore.clearThumbnailCache()
    settingsStore.clearCache()
    alert('Cache cleared successfully')
  }
}

function handleRestartInterface() {
  if (confirm('Restart the interface? This will reload the page.')) {
    settingsStore.restartInterface()
  }
}

function handleResetDefaults() {
  if (confirm('Reset all settings to default values?')) {
    settingsStore.resetToDefaults()
  }
}
</script>

<template>
  <div class="settings-view">
    <h1 class="settings-title">Settings</h1>

    <!-- Display Settings -->
    <section class="settings-section">
      <h2 class="section-title">Display</h2>

      <!-- Brightness Slider -->
      <div class="setting-item">
        <label class="setting-label">
          Brightness: {{ settingsStore.settings.brightness }}%
        </label>
        <input
          type="range"
          min="20"
          max="100"
          step="5"
          :value="settingsStore.settings.brightness"
          class="brightness-slider"
          @input="handleBrightnessChange"
        />
      </div>

      <!-- Screensaver Timeout -->
      <div class="setting-item">
        <label class="setting-label">Screensaver Timeout</label>
        <select
          :value="settingsStore.settings.screensaverTimeout"
          class="screensaver-select"
          @change="handleScreensaverChange"
        >
          <option
            v-for="option in screensaverOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>
    </section>

    <!-- Network Information -->
    <section class="settings-section">
      <h2 class="section-title">Network</h2>

      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Hostname:</span>
          <span class="info-value">{{ networkInfo.hostname }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">IP Address:</span>
          <span class="info-value">{{ networkInfo.ip }}</span>
        </div>
      </div>
    </section>

    <!-- System Information -->
    <section class="settings-section">
      <h2 class="section-title">System</h2>

      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">App Version:</span>
          <span class="info-value">{{ systemInfo.appVersion }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Platform:</span>
          <span class="info-value">{{ systemInfo.platform }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Memory:</span>
          <span class="info-value">{{ systemInfo.memory }}</span>
        </div>
      </div>
    </section>

    <!-- Actions -->
    <section class="settings-section">
      <h2 class="section-title">Actions</h2>

      <div class="action-buttons">
        <TouchButton variant="secondary" @click="handleClearCache">
          Clear Cache
        </TouchButton>
        <TouchButton variant="secondary" @click="handleRestartInterface">
          Restart Interface
        </TouchButton>
        <TouchButton variant="danger" @click="handleResetDefaults">
          Reset to Defaults
        </TouchButton>
      </div>
    </section>
  </div>
</template>

<style scoped>
.settings-view {
  padding: var(--space-md);
  overflow-y: auto;
  height: 100%;
}

.settings-title {
  font-size: 28px;
  font-weight: bold;
  color: var(--text-primary);
  margin: 0 0 var(--space-lg) 0;
}

/* Sections */
.settings-section {
  margin-bottom: var(--space-lg);
  padding: var(--space-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.section-title {
  font-size: 20px;
  font-weight: bold;
  color: var(--prusa-orange);
  margin: 0 0 var(--space-md) 0;
}

/* Setting Items */
.setting-item {
  margin-bottom: var(--space-md);
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-label {
  display: block;
  font-size: 16px;
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
  font-weight: 500;
}

/* Brightness Slider */
.brightness-slider {
  width: 100%;
  height: var(--touch-min);
  -webkit-appearance: none;
  appearance: none;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  outline: none;
  cursor: pointer;
}

.brightness-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  background: var(--prusa-orange);
  border-radius: 50%;
  cursor: pointer;
}

.brightness-slider::-moz-range-thumb {
  width: 24px;
  height: 24px;
  background: var(--prusa-orange);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

/* Screensaver Select */
.screensaver-select {
  width: 100%;
  min-height: var(--touch-comfortable);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--bg-tertiary);
  border-radius: var(--radius-md);
  font-size: 16px;
  font-family: inherit;
  cursor: pointer;
}

.screensaver-select:focus {
  outline: 2px solid var(--prusa-orange);
  outline-offset: 2px;
}

/* Info Grid */
.info-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm);
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
}

.info-label {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: var(--text-primary);
  font-family: monospace;
  text-align: right;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}
</style>
