<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useFilesStore } from '../stores/files'
import type { FileInfo } from '../api/models/FileInfo'
import BottomSheet from './BottomSheet.vue'
import FileListItem from './FileListItem.vue'
import TouchButton from './TouchButton.vue'

// Props
interface Props {
  visible: boolean
}

defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  'file-selected': [file: FileInfo]
}>()

// Store
const filesStore = useFilesStore()

// Local state
const selectedStorage = ref('local')
const errorMessage = ref<string>('')

// Computed
const hasFiles = computed(() => filesStore.sortedFiles.length > 0)

// Methods
function handleClose() {
  emit('close')
}

async function handleItemClick(file: FileInfo) {
  const isFolder = file.size === 0 || file.size === undefined

  if (isFolder) {
    // Navigate into folder
    try {
      await filesStore.fetchFiles(selectedStorage.value, file.path || '/')
    } catch (error) {
      console.error('Failed to navigate to folder:', error)
      errorMessage.value = 'Failed to open folder. Please try again.'
    }
  } else {
    // Emit file selection event
    emit('file-selected', file)
  }
}

async function navigateToBreadcrumb(index: number) {
  try {
    const breadcrumb = filesStore.breadcrumbs[index]
    if (breadcrumb) {
      await filesStore.fetchFiles(selectedStorage.value, breadcrumb.path)
    }
  } catch (error) {
    console.error('Failed to navigate to breadcrumb:', error)
    errorMessage.value = 'Failed to navigate. Please try again.'
  }
}

async function handleStorageChange() {
  try {
    errorMessage.value = ''
    await filesStore.fetchFiles(selectedStorage.value, '/')
  } catch (error) {
    console.error('Failed to fetch files for storage:', error)
    errorMessage.value = 'Failed to load files. Please try again.'
  }
}

async function handleRefresh() {
  try {
    errorMessage.value = ''
    await filesStore.fetchFiles(selectedStorage.value, filesStore.currentPath)
  } catch (error) {
    console.error('Failed to refresh files:', error)
    errorMessage.value = 'Failed to refresh files. Please try again.'
  }
}

// Lifecycle
onMounted(async () => {
  try {
    errorMessage.value = ''
    await filesStore.fetchStorages()
    await filesStore.fetchFiles(selectedStorage.value, '/')
  } catch (error) {
    console.error('Failed to initialize file browser:', error)
    errorMessage.value = 'Failed to load file browser. Please close and try again.'
  }
})
</script>

<template>
  <BottomSheet
    :visible="visible"
    title="Select File to Print"
    @close="handleClose"
  >
    <div class="file-browser">
      <!-- Error Message -->
      <div v-if="errorMessage" class="error-banner">
        {{ errorMessage }}
      </div>

      <!-- Storage Selector -->
      <div class="storage-selector-container">
        <select
          v-model="selectedStorage"
          class="storage-selector"
          @change="handleStorageChange"
        >
          <option
            v-for="storage in filesStore.storages"
            :key="storage.path"
            :value="storage.name"
          >
            {{ storage.name }}
          </option>
        </select>
      </div>

      <!-- Loading State -->
      <div v-if="filesStore.loading" class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading files...</p>
      </div>

      <!-- Breadcrumb Navigation -->
      <div v-if="hasFiles" class="breadcrumb-nav">
        <button
          v-for="(segment, index) in filesStore.breadcrumbs"
          :key="index"
          @click="navigateToBreadcrumb(index)"
          class="breadcrumb-item"
        >
          {{ segment.name }}
          <span v-if="index < filesStore.breadcrumbs.length - 1">/</span>
        </button>
      </div>

    <!-- File List -->
      <div v-if="hasFiles" class="file-list">
        <FileListItem
          v-for="file in filesStore.sortedFiles"
          :key="file.name"
          :file="file"
          :thumbnail-url="file.refs?.thumbnail"
          @click="handleItemClick"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <p>No files found</p>
        <TouchButton variant="secondary" @click="handleRefresh">
          Refresh
        </TouchButton>
      </div>
    </div>

    <template #actions>
      <TouchButton variant="secondary" @click="handleClose">
        Close
      </TouchButton>
    </template>
  </BottomSheet>
</template>

<style scoped>
.file-browser {
  min-height: calc(3 * var(--touch-comfortable) + 2 * var(--space-md));
  max-height: 60vh;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* Error Banner */
.error-banner {
  padding: var(--space-md);
  margin: var(--space-md);
  background: rgba(255, 0, 0, 0.1);
  border: 2px solid rgba(255, 0, 0, 0.3);
  border-radius: var(--radius-md);
  color: #ff6b6b;
  font-size: var(--font-sm);
  font-weight: 500;
  text-align: center;
}

/* Storage Selector */
.storage-selector-container {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  border-bottom: 1px solid var(--border-color);
}

.storage-selector {
  flex: 1;
  min-height: var(--touch-comfortable);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--bg-tertiary);
  border-radius: var(--radius-md);
  font-size: var(--font-md);
  font-family: inherit;
  cursor: pointer;
}

.storage-selector:focus {
  outline: 2px solid var(--prusa-orange);
  outline-offset: 2px;
}

/* Loading State */
.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  padding: var(--space-lg);
  color: var(--text-secondary);
}

.spinner {
  width: var(--space-lg);
  height: var(--space-lg);
  border: 4px solid var(--bg-tertiary);
  border-top-color: var(--prusa-orange);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Breadcrumb Navigation */
.breadcrumb-nav {
  display: flex;
  gap: var(--space-xs);
  padding: var(--space-sm);
  border-bottom: 1px solid var(--border-color);
  overflow-x: auto;
  flex-wrap: wrap;
}

.breadcrumb-item {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: var(--space-xs);
  cursor: pointer;
  white-space: nowrap;
  font-size: var(--font-md);
  font-family: inherit;
}

.breadcrumb-item:last-child {
  color: var(--text-primary);
  font-weight: 500;
}

.breadcrumb-item:hover {
  color: var(--prusa-orange);
}

/* File List */
.file-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  overflow-y: auto;
  flex: 1;
  padding: var(--space-sm);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  padding: var(--space-lg);
  color: var(--text-secondary);
  text-align: center;
}

.empty-state p {
  margin: 0;
  font-size: var(--font-lg);
}

/* Close Button */
.close-button {
  min-width: var(--touch-comfortable);
  min-height: var(--touch-comfortable);
}
</style>
