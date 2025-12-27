<template>
  <div class="files-view">
    <!-- Top bar with title -->
    <div class="files-header">
      <h1>Files</h1>
    </div>

    <!-- Full-screen file browser content -->
    <div class="files-content">
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
            :value="storage.path"
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
      <VirtualScroller
        v-if="hasFiles"
        :items="filesStore.sortedFiles"
        :item-height="80"
        :get-thumbnail-url="getThumbnailUrl"
        @item-click="handleFileClick"
      />

      <!-- Empty State -->
      <div v-else class="empty-state">
        <p>No files found</p>
        <TouchButton variant="secondary" @click="handleRefresh">
          Refresh
        </TouchButton>
      </div>
    </div>

    <!-- Expanded File View Modal -->
    <ExpandedFileView
      v-if="selectedFile"
      :visible="showExpandedView"
      :file="selectedFile"
      :storage="selectedStorage"
      :path="filesStore.currentPath === '/' ? `/${selectedFile.name}` : `${filesStore.currentPath}/${selectedFile.name}`"
      :thumbnail-url="hasThumbnailRef(selectedFile) ? selectedFile.refs.thumbnail : undefined"
      @close="handleCloseExpandedView"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import TouchButton from '@/components/TouchButton.vue'
import ExpandedFileView from '@/components/ExpandedFileView.vue'
import VirtualScroller from '@/components/VirtualScroller.vue'
import { useFilesStore, type FileItem } from '@/stores/files'

const filesStore = useFilesStore()
const selectedStorage = ref('/local')
const errorMessage = ref<string>('')

// State for expanded file view
const selectedFile = ref<FileItem | null>(null)
const showExpandedView = ref(false)

const hasFiles = computed(() => filesStore.sortedFiles.length > 0)

// Get thumbnail URL for a file item
function getThumbnailUrl(file: FileItem): string | null | undefined {
  return hasThumbnailRef(file) ? file.refs.thumbnail : undefined
}

// Type guard for checking if file has refs with thumbnail
function hasThumbnailRef(file: FileItem): file is FileItem & { refs: { thumbnail: string } } {
  return 'refs' in file && file.refs !== undefined && 'thumbnail' in file.refs
}

onMounted(async () => {
  try {
    await filesStore.fetchStorages()
    await filesStore.fetchFiles(selectedStorage.value, '/')
  } catch (error) {
    console.error('Failed to load files:', error)
    errorMessage.value = 'Failed to load files. Please try again.'
  }
})

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

async function handleFileClick(file: FileItem) {
  const isFolder = file.size === 0 || file.size === undefined

  if (isFolder) {
    try {
      const newPath = filesStore.currentPath === '/'
        ? `/${file.name}`
        : `${filesStore.currentPath}/${file.name}`
      await filesStore.fetchFiles(selectedStorage.value, newPath)
    } catch (error) {
      console.error('Failed to navigate to folder:', error)
      errorMessage.value = 'Failed to open folder. Please try again.'
    }
  } else {
    // Show expanded file view modal
    selectedFile.value = file
    showExpandedView.value = true
  }
}

function handleCloseExpandedView() {
  showExpandedView.value = false
  selectedFile.value = null
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
</script>

<style scoped>
.files-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--background-primary);
}

.files-header {
  padding: var(--space-md);
  border-bottom: 1px solid var(--border-color);
}

.files-header h1 {
  margin: 0;
  font-size: var(--font-size-xl);
  color: var(--text-primary);
}

.files-content {
  flex: 1;
  overflow: hidden;
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
  color: var(--status-error);
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
  flex: 1;
}

.empty-state p {
  margin: 0;
  font-size: var(--font-lg);
}
</style>
