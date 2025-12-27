<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useFilesStore } from '@/stores/files'
import { useJobStore } from '@/stores/job'
import type { FileItem } from '@/stores/files'
import type { PrintFileInfo } from '@/api/models/PrintFileInfo'

interface Props {
  visible: boolean
  file: FileItem
  storage: string
  path: string
  thumbnailUrl?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  thumbnailUrl: null
})

const emit = defineEmits<{
  close: []
}>()

const filesStore = useFilesStore()
const jobStore = useJobStore()

// State for detailed file info
const detailedInfo = ref<PrintFileInfo | null>(null)
const loading = ref(false)
const imgRef = ref<HTMLImageElement | null>(null)
const cachedBlobUrl = ref<string | null>(null)

// Computed properties for metadata display
const printTime = computed(() => {
  const seconds = detailedInfo.value?.meta?.estimated_print_time || detailedInfo.value?.meta?.print_time
  if (!seconds) return 'Unknown'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours} HOUR ${minutes} MIN`
  }
  return `${minutes} MIN`
})

const filamentLength = computed(() => {
  const mm = detailedInfo.value?.meta?.['filament used [mm]']
  if (!mm) return 'Unknown'
  const meters = (mm / 1000).toFixed(1)
  return `${meters} m`
})

const filamentWeight = computed(() => {
  const g = detailedInfo.value?.meta?.['filament used [g]']
  if (!g) return 'Unknown'
  const grams = g.toFixed(1)
  return `${grams} g`
})

const layerHeight = computed(() => {
  const height = detailedInfo.value?.meta?.layer_height
  if (!height) return 'Unknown'
  const formattedHeight = height.toFixed(1)
  return `${formattedHeight} mm`
})

const nozzleSize = computed(() => {
  const diameter = detailedInfo.value?.meta?.nozzle_diameter
  if (!diameter) return 'Unknown'
  const formattedDiameter = diameter.toFixed(1)
  return `${formattedDiameter} mm`
})

// Load thumbnail
async function loadThumbnail(url: string) {
  try {
    // Check if thumbnail is already cached in store
    const cached = filesStore.getThumbnail(props.file.name)
    if (cached) {
      cachedBlobUrl.value = cached
      return cached
    }

    // Normalize thumbnail URL
    let normalizedUrl = url

    // Ensure URL starts with /api if it's a relative path
    if (url.startsWith('/') && !url.startsWith('/api/')) {
      normalizedUrl = `/api${url}`
    }

    // Remove double slashes
    normalizedUrl = normalizedUrl.replace(/\/+/g, '/')

    // Add cache busting
    const cacheBustUrl = `${normalizedUrl}?ct=${Date.now()}`
    const response = await fetch(cacheBustUrl, {
      headers: { 'Accept': 'image/*' }
    })

    if (!response.ok) throw new Error(`Failed to load thumbnail: ${response.status}`)

    const contentType = response.headers.get('Content-Type')
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error(`Response is not an image: ${contentType}`)
    }

    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)

    // Store in cache
    filesStore.cacheThumbnail(props.file.name, url, objectUrl)
    cachedBlobUrl.value = objectUrl

    return objectUrl
  } catch (error) {
    console.warn('Failed to load thumbnail:', error)
    return null
  }
}

// Fetch detailed file info
async function fetchDetailedInfo() {
  try {
    loading.value = true
    const { DefaultService } = await import('@/api')
    // Strip leading slash from storage and path
    const storageId = props.storage.replace(/^\//, '')
    const filePath = props.path.replace(/^\//, '')
    const response = await DefaultService.getApiV1Files(storageId, filePath, undefined, 'application/json')

    // Check if response is PrintFileInfo (has meta property)
    if (response && 'meta' in response) {
      detailedInfo.value = response as PrintFileInfo
    }
  } catch (error) {
    console.error('Failed to fetch detailed file info:', error)
  } finally {
    loading.value = false
  }
}

async function handlePrint() {
  try {
    await jobStore.startPrint(props.storage, props.path)
    emit('close')
  } catch (error) {
    console.error('Failed to start print:', error)
  }
}

function handleCancel() {
  emit('close')
}

function handleBackdropClick() {
  emit('close')
}

function handleContentClick(event: Event) {
  event.stopPropagation()
}

// Load thumbnail and detailed info when component becomes visible
onMounted(() => {
  if (props.visible) {
    fetchDetailedInfo()
    if (props.thumbnailUrl && !cachedBlobUrl.value) {
      loadThumbnail(props.thumbnailUrl)
    }
  }
})
</script>

<template>
  <Transition name="slide-up">
    <div v-if="visible" class="expanded-file-view" @click="handleBackdropClick">
      <!-- Backdrop -->
      <div class="backdrop"></div>

      <!-- Modal content -->
      <div class="modal-content" @click="handleContentClick">
        <!-- Thumbnail -->
        <div class="thumbnail-container">
          <img
            v-if="cachedBlobUrl"
            :src="cachedBlobUrl"
            :alt="file.name"
            class="thumbnail"
            ref="imgRef"
          />
          <div v-else class="thumbnail-placeholder">
            📄
          </div>
        </div>

        <!-- Filename -->
        <h2 class="filename">{{ file.display_name || file.name }}</h2>

        <!-- Metadata -->
        <div class="metadata">
          <!-- Print Time (largest, orange) -->
          <div class="metadata-item print-time">
            <div class="label">PRINT TIME</div>
            <div class="value">{{ printTime }}</div>
          </div>

          <!-- Filament Used -->
          <div class="metadata-item">
            <div class="label">FILAMENT</div>
            <div class="value">{{ filamentLength }} = {{ filamentWeight }}</div>
          </div>

          <!-- Print Settings -->
          <div class="metadata-item">
            <div class="label">LAYER HEIGHT</div>
            <div class="value">{{ layerHeight }}</div>
          </div>

          <div class="metadata-item">
            <div class="label">NOZZLE SIZE</div>
            <div class="value">{{ nozzleSize }}</div>
          </div>
        </div>

        <!-- Actions -->
        <div class="actions">
          <button class="btn btn-cancel" @click="handleCancel">
            CANCEL
          </button>
          <button class="btn btn-print" @click="handlePrint">
            PRINT NOW
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.expanded-file-view {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  display: flex;
  align-items: flex-end;
}

.backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-overlay);
}

.modal-content {
  position: relative;
  width: 100%;
  max-height: 90vh;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  overflow-y: auto;
  z-index: 2001;
  box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.5);
}

.thumbnail-container {
  width: 100%;
  aspect-ratio: 16 / 9;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-placeholder {
  font-size: 64px;
  opacity: 0.5;
}

.filename {
  margin: 0;
  font-size: var(--font-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  text-align: center;
  word-break: break-word;
}

.metadata {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.metadata-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.metadata-item.print-time {
  background: rgba(255, 102, 0, 0.1);
  border: 2px solid var(--prusa-orange);
}

.label {
  font-size: var(--font-xs);
  font-weight: var(--font-weight-bold);
  color: var(--text-tertiary);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.value {
  font-size: var(--font-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.print-time .value {
  color: var(--prusa-orange);
  font-size: var(--font-xl);
}

.actions {
  display: flex;
  gap: var(--space-md);
  padding-top: var(--space-md);
}

.btn {
  flex: 1;
  min-height: 60px;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-lg);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  font-family: inherit;
  transition: transform var(--transition-fast);
}

.btn:active {
  transform: scale(0.95);
}

.btn-cancel {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-print {
  background: var(--prusa-orange);
  color: white;
}

/* GPU-accelerated slide-up animation */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform var(--transition-normal), opacity var(--transition-normal);
}

.slide-up-enter-active .backdrop,
.slide-up-leave-active .backdrop {
  transition: opacity var(--transition-normal);
}

.slide-up-enter-active .modal-content,
.slide-up-leave-active .modal-content {
  transition: transform var(--transition-normal);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
}

.slide-up-enter-from .backdrop,
.slide-up-leave-to .backdrop {
  opacity: 0;
}

.slide-up-enter-from .modal-content {
  transform: translateY(100%);
}

.slide-up-leave-to .modal-content {
  transform: translateY(100%);
}
</style>
