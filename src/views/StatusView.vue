<template>
  <div class="status-view">
    <!-- Status Header -->
    <div class="status-header">
      <StatusBadge :state="printerState" />
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

    <!-- Printing State - Status Screen (tap-anywhere to open controls) -->
    <div
      v-if="isStatusScreenVisible"
      class="status-screen"
      @click="openControlSheet"
    >
      <div class="status-content">
        <div class="progress-column">
          <ProgressRing :progress="progress" :size="250" :stroke-width="14" :frozen="isFrozen">
            <div class="progress-text">{{ progress }}%</div>
          </ProgressRing>
        </div>

        <div class="metadata-column">
          <!-- Thumbnail Preview -->
          <div class="thumbnail-preview">
            <!-- Real thumbnail if available from job data -->
            <img
              v-if="thumbnailUrl"
              :src="thumbnailUrl"
              alt="Print preview"
              class="thumbnail-image"
            />

            <!-- Fallback: Prusa logo watermark -->
            <div v-else class="thumbnail-fallback">
              <img
                src="@/assets/prusa-logo.svg"
                alt="Prusa"
                class="prusa-watermark"
              />
            </div>
          </div>

          <!-- File name -->
          <div class="file-name">
            {{ getFileName() }}
          </div>

          <!-- Time remaining -->
          <div class="time-remaining">
            ⏱ {{ timeRemainingFormatted || 'Calculating...' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Fallback: Printing State (used when status-screen not visible) -->
    <div v-if="!isStatusScreenVisible && hasActiveJob" class="printing-content">
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

      <!-- Temperature Graph -->
      <div v-if="printerStore.temperatureHistory.length > 0" class="temperature-graph-container">
        <TemperatureGraph
          :data="printerStore.temperatureHistory"
          :width="760"
          :height="180"
        />
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

    <!-- Control Bottom Sheet -->
    <BottomSheet
      :visible="showControlSheet"
      title="Print Controls"
      @close="closeControlSheet"
    >
      <div class="control-sheet-content">
        <!-- Section 1: Print Controls -->
        <div class="print-controls">
          <!-- Pause/Resume Button -->
          <TouchButton
            :label="isPrinting ? 'Pause Print' : 'Resume Print'"
            :variant="isPrinting ? 'secondary' : 'primary'"
            size="large"
            :loading="pauseResumeLoading"
            :disabled="pauseResumeLoading"
            @click="handlePauseResume"
          />

          <!-- Cancel Print Button -->
          <TouchButton
            label="Cancel Print"
            variant="danger"
            size="large"
            :loading="cancelLoading"
            :disabled="cancelLoading"
            @click="showCancelConfirm = true"
          />
        </div>

        <!-- Section 2: Temperature Controls -->
        <div class="temperature-controls">
          <h3>Temperature Adjustments</h3>

          <!-- Nozzle Temperature -->
          <div class="temp-control-row">
            <span class="temp-label">Nozzle</span>
            <TouchButton
              label="−5"
              variant="secondary"
              size="min"
              :disabled="!canDecreaseNozzle || nozzleTempLoading"
              :loading="nozzleTempLoading"
              @click="adjustNozzleTemp(-5)"
            />
            <div class="temp-display">
              {{ nozzleTemp }}° / {{ nozzleTarget }}°
            </div>
            <TouchButton
              label="+5"
              variant="secondary"
              size="min"
              :disabled="!canIncreaseNozzle || nozzleTempLoading"
              :loading="nozzleTempLoading"
              @click="adjustNozzleTemp(5)"
            />
          </div>

          <!-- Bed Temperature -->
          <div class="temp-control-row">
            <span class="temp-label">Bed</span>
            <TouchButton
              label="−5"
              variant="secondary"
              size="min"
              :disabled="!canDecreaseBed || bedTempLoading"
              :loading="bedTempLoading"
              @click="adjustBedTemp(-5)"
            />
            <div class="temp-display">
              {{ bedTemp }}° / {{ bedTarget }}°
            </div>
            <TouchButton
              label="+5"
              variant="secondary"
              size="min"
              :disabled="!canIncreaseBed || bedTempLoading"
              :loading="bedTempLoading"
              @click="adjustBedTemp(5)"
            />
          </div>
        </div>
      </div>
    </BottomSheet>

    <!-- Cancel Confirmation Dialog -->
    <ConfirmDialog
      :visible="showCancelConfirm"
      title="Cancel Print?"
      message="This will cancel the current print job. This action cannot be undone."
      confirm-text="Cancel Print"
      cancel-text="Keep Printing"
      variant="danger"
      @confirm="handleCancelPrint"
      @cancel="showCancelConfirm = false"
    />

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

    <!-- Start Print Confirmation -->
    <ConfirmDialog
      :visible="showStartPrintConfirm"
      title="Start Print"
      :message="confirmMessage"
      confirm-text="Start Print"
      cancel-text="Cancel"
      @confirm="handleConfirmStartPrint"
      @cancel="handleCancelStartPrint"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStatus, useJob } from '../composables'
import { useFilesStore } from '../stores/files'
import { useJobStore } from '../stores/job'
import { usePrinterStore } from '../stores/printer'
import { useNotificationsStore } from '../stores/notifications'
import type { FileInfo } from '../api/models/FileInfo'
import StatusBadge from '../components/StatusBadge.vue'
import ProgressRing from '../components/ProgressRing.vue'
import TouchButton from '../components/TouchButton.vue'
import BottomSheet from '../components/BottomSheet.vue'
import FileBrowser from '../components/FileBrowser.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import TemperatureGraph from '../components/TemperatureGraph.vue'

const filesStore = useFilesStore()
const jobStore = useJobStore()
const printerStore = usePrinterStore()
const notificationsStore = useNotificationsStore()

// Composables
const {
  printerState,
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
const showStartPrintConfirm = ref(false)
const showControlSheet = ref(false)
const showCancelConfirm = ref(false)
const pauseResumeLoading = ref(false)
const cancelLoading = ref(false)
const nozzleTempLoading = ref(false)
const bedTempLoading = ref(false)
const selectedFile = ref<FileInfo | null>(null)

// Computed
const isStatusScreenVisible = computed(() => {
  // Show status screen when printing, paused, or error
  const state = printerState.value
  return hasActiveJob.value && (state === 'PRINTING' || state === 'PAUSED' || state === 'ERROR')
})

const thumbnailUrl = computed(() => {
  // Try to get thumbnail from current job
  const job = jobStore.currentJob
  if (!job) return null

  // Type guard: Check if job has file property (JobFilePrint)
  if (!('file' in job) || !job.file) return null

  // Check if job has file with thumbnail reference
  // PrusaLink provides thumbnail URLs in file metadata
  const file = job.file
  if (!file.refs || !('thumbnail' in file.refs)) return null

  const url = file.refs.thumbnail

  // Normalize thumbnail URL to handle double slashes and missing /api prefix
  if (!url) return null

  // Ensure URL starts with /api if it's a relative path
  let normalizedUrl = url
  if (url.startsWith('/') && !url.startsWith('/api/')) {
    normalizedUrl = `/api${url}`
  }

  // Remove double slashes (can happen if PrusaLink returns paths with leading slashes)
  normalizedUrl = normalizedUrl.replace(/\/+/g, '/')

  return normalizedUrl
})

const timeRemainingFormatted = computed(() => {
  const tr = timeRemaining.value
  if (!tr || tr === 'Calculating...') return tr

  // Parse the time string and format it
  // timeRemaining is already formatted, so return it as-is
  return tr
})

const isFrozen = computed(() => {
  // Freeze ring when paused or in error state
  const state = printerState.value
  return state === 'PAUSED' || state === 'ERROR'
})

const confirmMessage = computed(() => {
  if (!selectedFile.value) return ''

  const file = selectedFile.value
  const fileName = file.display_name || file.name
  const fileSize = formatFileSize(file.size)

  return `File: ${fileName}\nSize: ${fileSize}\n\nStart printing this file?`
})

// Print controls
const isPrinting = computed(() => printerState.value === 'PRINTING')

// Temperature controls - Current temperatures
const nozzleTemp = computed(() => printerStore.status?.temp_nozzle || 0)
const nozzleTarget = computed(() => printerStore.status?.target_nozzle || 0)
const bedTemp = computed(() => printerStore.status?.temp_bed || 0)
const bedTarget = computed(() => printerStore.status?.target_bed || 0)

// Temperature constraints
const MIN_NOZZLE_TEMP = 0
const MAX_NOZZLE_TEMP = 300
const MIN_BED_TEMP = 0
const MAX_BED_TEMP = 120

// Can adjust checks
const canIncreaseNozzle = computed(() => nozzleTarget.value + 5 <= MAX_NOZZLE_TEMP)
const canDecreaseNozzle = computed(() => nozzleTarget.value - 5 >= MIN_NOZZLE_TEMP)
const canIncreaseBed = computed(() => bedTarget.value + 5 <= MAX_BED_TEMP)
const canDecreaseBed = computed(() => bedTarget.value - 5 >= MIN_BED_TEMP)

// Helper functions
function getFileName(): string {
  const job = jobStore.currentJob
  if (!job) return 'Unknown'

  // Type guard: Check if job has file property (JobFilePrint)
  if (!('file' in job) || !job.file) return 'Unknown'

  return job.file.display_name || job.file.name || 'Unknown'
}

// Lifecycle
onMounted(() => {
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})

// Helpers
function formatFileSize(size: number | undefined): string {
  if (!size) return 'Unknown'

  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) {
    const kb = size / 1024
    return kb % 1 === 0 ? `${kb} KB` : `${kb.toFixed(1)} KB`
  }
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

// Actions
function openFileBrowser() {
  showFileBrowser.value = true
}

function closeFileBrowser() {
  showFileBrowser.value = false
}

function handleFileSelected(file: FileInfo) {
  selectedFile.value = file
  showStartPrintConfirm.value = true
}

function handleCancelStartPrint() {
  showStartPrintConfirm.value = false
  selectedFile.value = null
}

async function handleConfirmStartPrint() {
  if (!selectedFile.value) return

  try {
    // Construct the full path from current path and file name
    const fullPath = filesStore.currentPath === '/'
      ? selectedFile.value.name
      : `${filesStore.currentPath}/${selectedFile.value.name}`

    // Use jobStore.startPrint instead of filesStore.startPrint
    await jobStore.startPrint(filesStore.currentStorage, fullPath)

    // Close dialogs
    showStartPrintConfirm.value = false
    showFileBrowser.value = false
    selectedFile.value = null
  } catch (error) {
    console.error('Failed to start print:', error)
    // Keep dialogs open so user can retry
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

// Control sheet handlers
function openControlSheet() {
  showControlSheet.value = true
}

function closeControlSheet() {
  showControlSheet.value = false
}

async function handlePauseResume() {
  pauseResumeLoading.value = true

  try {
    if (isPrinting.value) {
      await pauseJob()
      notificationsStore.showSuccess('Print paused')
    } else {
      await resumeJob()
      notificationsStore.showSuccess('Print resumed')
    }
  } catch (error) {
    console.error('Failed to pause/resume print:', error)
    notificationsStore.showError('Failed to pause/resume print')
  } finally {
    pauseResumeLoading.value = false
  }
}

async function handleCancelPrint() {
  showCancelConfirm.value = false
  cancelLoading.value = true

  try {
    await stopJob()
    notificationsStore.showSuccess('Print cancelled')
    closeControlSheet()
  } catch (error) {
    console.error('Failed to cancel print:', error)
    notificationsStore.showError('Failed to cancel print')
  } finally {
    cancelLoading.value = false
  }
}

// Temperature adjustment methods
async function adjustNozzleTemp(delta: number) {
  const newTarget = nozzleTarget.value + delta

  // Bounds check
  if (newTarget < MIN_NOZZLE_TEMP || newTarget > MAX_NOZZLE_TEMP) {
    return
  }

  nozzleTempLoading.value = true

  try {
    await printerStore.setNozzleTemp(newTarget)
    notificationsStore.showSuccess(`Nozzle temperature set to ${newTarget}°`)
  } catch (error) {
    console.error('Failed to set nozzle temperature:', error)
    notificationsStore.showError('Failed to adjust nozzle temperature')
  } finally {
    nozzleTempLoading.value = false
  }
}

async function adjustBedTemp(delta: number) {
  const newTarget = bedTarget.value + delta

  // Bounds check
  if (newTarget < MIN_BED_TEMP || newTarget > MAX_BED_TEMP) {
    return
  }

  bedTempLoading.value = true

  try {
    await printerStore.setBedTemp(newTarget)
    notificationsStore.showSuccess(`Bed temperature set to ${newTarget}°`)
  } catch (error) {
    console.error('Failed to set bed temperature:', error)
    notificationsStore.showError('Failed to adjust bed temperature')
  } finally {
    bedTempLoading.value = false
  }
}
</script>

<style scoped>
.status-view {
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

.temperature-graph-container {
  width: 100%;
  max-width: 760px;
  overflow-x: auto;
  margin-top: var(--space-md);
}

.job-controls {
  display: flex;
  gap: var(--space-md);
  margin-top: var(--space-md);
}

/* Status Screen (tap-anywhere interaction) */
.status-screen {
  cursor: pointer;
  user-select: none;
  padding: var(--space-md);
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.status-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-lg);
  align-items: center;
}

.progress-column {
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 280px; /* Accommodate 250px ring + padding */
}

.progress-text {
  font-size: 52px; /* 48-56px range, use middle value */
  font-weight: bold;
  color: var(--text-primary);
}

.metadata-column {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.thumbnail-preview {
  width: 220px;
  height: 220px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: var(--bg-tertiary);
  overflow: hidden;
  flex-shrink: 0; /* Prevent size changes */
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
}

.prusa-watermark {
  opacity: 0.25; /* 25% opacity per spec */
  width: 80px;
  height: auto;
}

.file-name {
  font-size: var(--font-size-lg);
  font-weight: 500;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.time-remaining {
  font-size: var(--font-size-md);
  color: var(--text-secondary);
}

/* Control Sheet Content */
.control-sheet-content {
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.print-controls {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.placeholder-text {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  margin: 0;
}

/* Temperature Controls */
.temperature-controls {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.temperature-controls h3 {
  margin: 0;
  font-size: var(--font-size-md);
  color: var(--text-primary);
  font-weight: 500;
}

.temp-control-row {
  display: grid;
  grid-template-columns: 80px 60px 1fr 60px;
  gap: var(--space-sm);
  align-items: center;
}

.temp-label {
  font-size: var(--font-size-md);
  color: var(--text-secondary);
}

.temp-display {
  text-align: center;
  font-size: var(--font-size-md);
  color: var(--text-primary);
  font-weight: 500;
}
</style>
