<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { useFilesStore } from '../stores/files'
import { usePrinterStore } from '../stores/printer'
import TouchButton from '../components/TouchButton.vue'

const settingsStore = useSettingsStore()
const filesStore = useFilesStore()
const printerStore = usePrinterStore()

// Computed properties for printer info (with fallbacks)
const printerName = computed(() => printerStore.printerInfo?.name || 'Unknown Printer')
const firmware = computed(() => printerStore.version?.firmware || 'Unknown')
const prusaLink = computed(() => printerStore.version?.text || 'Unknown')
const hostname = computed(() => printerStore.printerInfo?.hostname || 'Unknown')
const serial = computed(() => printerStore.printerInfo?.serial || 'Unknown')
const location = computed(() => printerStore.printerInfo?.location || 'Not Set')
const nozzleDiameter = computed(() => printerStore.printerInfo?.nozzle_diameter?.toString() || 'Unknown')

// Methods
async function handleRefreshInfo() {
  await Promise.all([
    printerStore.fetchPrinterInfo(),
    printerStore.fetchVersion()
  ])
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

    <!-- Printer Information -->
    <section class="settings-section">
      <div class="section-header">
        <h2 class="section-title">Printer</h2>
        <TouchButton
          variant="secondary"
          size="small"
          @click="handleRefreshInfo"
          :disabled="printerStore.printerInfoLoading"
        >
          {{ printerStore.printerInfoLoading ? 'Refreshing...' : 'Refresh' }}
        </TouchButton>
      </div>

      <div v-if="printerStore.printerInfoLoading" class="loading-state">
        Loading printer information...
      </div>
      <div v-else class="info-grid">
        <div class="info-item">
          <span class="info-label">Name:</span>
          <span class="info-value">{{ printerName }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Serial:</span>
          <span class="info-value">{{ serial }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Firmware:</span>
          <span class="info-value">{{ firmware }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">PrusaLink:</span>
          <span class="info-value">{{ prusaLink }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Nozzle:</span>
          <span class="info-value">{{ nozzleDiameter }}mm</span>
        </div>
      </div>
    </section>

    <!-- Network Information -->
    <section class="settings-section">
      <h2 class="section-title">Network</h2>

      <div v-if="printerStore.printerInfoLoading" class="loading-state">
        Loading network information...
      </div>
      <div v-else class="info-grid">
        <div class="info-item">
          <span class="info-label">Hostname:</span>
          <span class="info-value">{{ hostname }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Location:</span>
          <span class="info-value">{{ location }}</span>
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

/* Section Header (for refresh button) */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.section-header .section-title {
  margin: 0;
}

/* Loading State */
.loading-state {
  padding: var(--space-md);
  text-align: center;
  color: var(--text-secondary);
  font-style: italic;
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
