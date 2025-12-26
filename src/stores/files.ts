import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FileInfo } from '../api/models/FileInfo'
import type { FirmwareFileInfoBasic } from '../api/models/FirmwareFileInfoBasic'
import type { PrintFileInfoBasic } from '../api/models/PrintFileInfoBasic'
import type { FolderInfo } from '../api/models/FolderInfo'
import type { Storage } from '../api/models/Storage'

// Union type for all possible file items
export type FileItem = FileInfo | PrintFileInfoBasic | FirmwareFileInfoBasic | FolderInfo

// Cache interface for thumbnails with blob URL tracking
interface CachedThumbnail {
  url: string
  blobUrl: string
  timestamp: number
}

export const useFilesStore = defineStore('files', () => {
  // State
  const storages = ref<Storage[]>([])
  const currentPath = ref('/')
  const currentStorage = ref('local')
  const files = ref<FileItem[]>([])
  const thumbnailCache = ref(new Map<string, CachedThumbnail>())
  const loading = ref(false)

  // Getters
  const breadcrumbs = computed(() => {
    const parts = currentPath.value.split('/').filter(Boolean)
    const crumbs = [{ name: 'Home', path: '/' }]

    let buildPath = ''
    for (const part of parts) {
      buildPath += '/' + part
      crumbs.push({
        name: part,
        path: buildPath
      })
    }

    return crumbs
  })

  const sortedFiles = computed(() => {
    return [...files.value].sort((a, b) => {
      // Folders first (folders have size 0 or undefined, files have size > 0)
      const aIsFolder = !a.size || a.size === 0
      const bIsFolder = !b.size || b.size === 0

      if (aIsFolder && !bIsFolder) return -1
      if (!aIsFolder && bIsFolder) return 1

      // Then alphabetically
      return (a.name ?? '').localeCompare(b.name ?? '')
    })
  })

  // Actions
  async function fetchStorages() {
    try {
      const { DefaultService } = await import('../api')
      const response = await DefaultService.getApiV1Storage()
      storages.value = response.storage_list || []
    } catch (error) {
      console.error('Failed to fetch storages:', error)
    }
  }

  async function fetchFiles(storage: string, path: string) {
    try {
      loading.value = true
      const { DefaultService } = await import('../api')
      const response = await DefaultService.getApiFiles(storage, path, undefined, 'application/json')
      // Response can be FolderInfo which has children property
      if ('children' in response) {
        files.value = response.children || []
      } else {
        files.value = []
      }
      currentPath.value = path
      currentStorage.value = storage
    } catch (error) {
      console.error('Failed to fetch files:', error)
    } finally {
      loading.value = false
    }
  }

  async function resetFiles() {
    // Clear thumbnail cache when resetting
    clearThumbnailCache()
    files.value = []
    currentPath.value = '/'
    currentStorage.value = 'local'
  }

  async function startPrint(storage: string, path: string) {
    try {
      const { DefaultService } = await import('../api')
      await DefaultService.postApiFiles(storage, path)
    } catch (error) {
      console.error('Failed to start print:', error)
      throw error
    }
  }

  async function deleteFile(storage: string, path: string) {
    try {
      const { DefaultService } = await import('../api')
      await DefaultService.deleteApiFiles(storage, path)

      // Refresh file list
      await fetchFiles(storage, currentPath.value || '/')
    } catch (error) {
      console.error('Failed to delete file:', error)
      throw error
    }
  }

  const MAX_CACHE_SIZE = 50

  function cacheThumbnail(fileId: string, url: string, blobUrl: string) {
    // LRU eviction - remove oldest if at capacity
    if (thumbnailCache.value.size >= MAX_CACHE_SIZE) {
      const oldestKey = thumbnailCache.value.keys().next().value as string
      if (oldestKey) {
        const oldest = thumbnailCache.value.get(oldestKey)
        if (oldest) {
          URL.revokeObjectURL(oldest.blobUrl)
        }
        thumbnailCache.value.delete(oldestKey)
      }
    }

    thumbnailCache.value.set(fileId, {
      url,
      blobUrl,
      timestamp: Date.now()
    })
  }

  function getThumbnail(fileId: string): string | null {
    return thumbnailCache.value.get(fileId)?.blobUrl || null
  }

  function clearThumbnailCache() {
    thumbnailCache.value.forEach(cached => {
      URL.revokeObjectURL(cached.blobUrl)
    })
    thumbnailCache.value.clear()
  }

  return {
    // State
    storages,
    currentPath,
    currentStorage,
    files,
    loading,

    // Getters
    breadcrumbs,
    sortedFiles,

    // Actions
    fetchStorages,
    fetchFiles,
    resetFiles,
    startPrint,
    deleteFile,
    cacheThumbnail,
    getThumbnail,
    clearThumbnailCache
  }
})
