<template>
  <div class="home-view">
    <!-- Status Header -->
    <div class="status-header">
      <StatusBadge :state="printerState" />
      <div class="temperatures">
        <TemperatureDisplay
          :current="nozzleTemp.current"
          :target="nozzleTemp.target"
          type="nozzle"
        />
        <TemperatureDisplay
          :current="bedTemp.current"
          :target="bedTemp.target"
          type="bed"
        />
      </div>
    </div>

    <!-- Connection Error Banner -->
    <div v-if="connectionError" class="error-banner">
      {{ connectionError }}
    </div>

    <!-- Idle State -->
    <div v-if="!hasActiveJob" class="idle-content">
      <div class="idle-message">
        <p class="idle-text">Printer Ready</p>
        <TouchButton
          variant="primary"
          size="large"
          @click="openFileBrowser"
        >
          Select File to Print
        </TouchButton>
      </div>
    </div>

    <!-- Printing State -->
    <div v-else class="printing-content">
      <div class="progress-container">
        <ProgressRing :progress="progress" :size="280" :stroke-width="12">
          <div class="progress-info">
            <span class="progress-percent">{{ progress }}%</span>
            <span class="progress-time">{{ timeRemaining }}</span>
          </div>
        </ProgressRing>
      </div>

      <div class="job-info">
        <p class="file-name">{{ fileName }}</p>
        <!-- Only show layer info if available (PrusaLink limitation: layer data not exposed via API) -->
        <p v-if="totalLayers > 0 && currentLayer > 0" class="layer-info">
          Layer {{ currentLayer }} / {{ totalLayers }}
        </p>
        <p v-if="printSpeed > 0" class="speed-info">
          Print Speed: {{ printSpeed }}%
        </p>
      </div>

      <div class="job-controls">
        <TouchButton
          v-if="printerState === 'PRINTING'"
          variant="secondary"
          :loading="isPausing"
          @click="handlePause"
        >
          Pause
        </TouchButton>
        <TouchButton
          v-if="printerState === 'PAUSED'"
          variant="primary"
          @click="handleResume"
        >
          Resume
        </TouchButton>
        <TouchButton
          variant="danger"
          :loading="isStopping"
          @click="showStopConfirm = true"
        >
          Stop
        </TouchButton>
      </div>
    </div>

    <!-- Stop Confirmation -->
    <BottomSheet
      :visible="showStopConfirm"
      title="Stop Print?"
      @close="showStopConfirm = false"
    >
      <p>This will cancel the current print job. This action cannot be undone.</p>
      <template #actions>
        <TouchButton
          variant="secondary"
          @click="showStopConfirm = false"
        >
          Cancel
        </TouchButton>
        <TouchButton
          variant="danger"
          :loading="isStopping"
          @click="handleStop"
        >
          Stop Print
        </TouchButton>
      </template>
    </BottomSheet>

    <!-- File Browser -->
    <FileBrowser
      :visible="showFileBrowser"
      @close="closeFileBrowser"
      @file-selected="handleFileSelected"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useStatus, useJob } from '../composables'
import { useFilesStore } from '../stores/files'
import type { FileInfo } from '../api/models/FileInfo'
import StatusBadge from '../components/StatusBadge.vue'
import TemperatureDisplay from '../components/TemperatureDisplay.vue'
import ProgressRing from '../components/ProgressRing.vue'
import TouchButton from '../components/TouchButton.vue'
import BottomSheet from '../components/BottomSheet.vue'
import FileBrowser from '../components/FileBrowser.vue'

const filesStore = useFilesStore()

// Composables
const {
  printerState,
  nozzleTemp,
  bedTemp,
  connectionError,
  startPolling,
  stopPolling
} = useStatus()

const {
  hasActiveJob,
  progress,
  timeRemaining,
  fileName,
  currentLayer,
  totalLayers,
  printSpeed,
  isPausing,
  isStopping,
  pauseJob,
  resumeJob,
  stopJob
} = useJob()

// Local state
const showStopConfirm = ref(false)
const showFileBrowser = ref(false)

// Lifecycle
onMounted(() => {
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})

// Actions
function openFileBrowser() {
  showFileBrowser.value = true
}

function closeFileBrowser() {
  showFileBrowser.value = false
}

async function handleFileSelected(file: FileInfo) {
  try {
    // Construct the full path from current path and file name
    const fullPath = filesStore.currentPath === '/'
      ? file.name
      : `${filesStore.currentPath}/${file.name}`
    await filesStore.startPrint(filesStore.currentStorage, fullPath)
    showFileBrowser.value = false
  } catch (error) {
    console.error('Failed to start print:', error)
  }
}

async function handlePause() {
  await pauseJob()
}

async function handleResume() {
  await resumeJob()
}

async function handleStop() {
  await stopJob()
  showStopConfirm.value = false
}
</script>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--space-md);
  gap: var(--space-md);
}

/* Status Header */
.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.temperatures {
  display: flex;
  gap: var(--space-lg);
}

/* Error Banner */
.error-banner {
  background: rgba(204, 0, 0, 0.2);
  color: var(--status-error);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  text-align: center;
  font-weight: bold;
}

/* Idle Content */
.idle-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.idle-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
}

.idle-text {
  font-size: 24px;
  color: var(--text-secondary);
  margin: 0;
}

/* Printing Content */
.printing-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

.progress-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.progress-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
}

.progress-percent {
  font-size: 48px;
  font-weight: bold;
  color: var(--text-primary);
}

.progress-time {
  font-size: 18px;
  color: var(--text-secondary);
}

.job-info {
  text-align: center;
}

.file-name {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0 0 var(--space-xs) 0;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layer-info,
.speed-info {
  font-size: 14px;
  color: var(--text-tertiary);
  margin: var(--space-xs) 0 0 0;
}

.job-controls {
  display: flex;
  gap: var(--space-md);
  margin-top: var(--space-md);
}
</style>
