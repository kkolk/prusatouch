import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FileInfo } from '../api/models/FileInfo'
import type { Storage } from '../api/models/Storage'

export const useFilesStore = defineStore('files', () => {
  // State
  const storages = ref<Storage[]>([])
  const currentPath = ref('/')
  const currentStorage = ref('local')
  const files = ref<FileInfo[]>([])
  const thumbnailCache = ref(new Map<string, string>())
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
      const response = await DefaultService.getApiV1Files(storage, path, undefined, 'application/json')
      // Response can be FolderInfo which has children property
      files.value = (response as any).children || []
      currentPath.value = path
      currentStorage.value = storage
    } catch (error) {
      console.error('Failed to fetch files:', error)
    } finally {
      loading.value = false
    }
  }

  async function startPrint(storage: string, path: string) {
    try {
      const { DefaultService } = await import('../api')
      await DefaultService.postApiV1Files(storage, path)
    } catch (error) {
      console.error('Failed to start print:', error)
      throw error
    }
  }

  async function deleteFile(storage: string, path: string) {
    try {
      const { DefaultService } = await import('../api')
      await DefaultService.deleteApiV1Files(storage, path)

      // Refresh file list
      await fetchFiles(storage, currentPath.value || '/')
    } catch (error) {
      console.error('Failed to delete file:', error)
      throw error
    }
  }

  function cacheThumbnail(path: string, dataUrl: string) {
    // LRU cache: Remove oldest if at capacity
    if (thumbnailCache.value.size >= 50) {
      const firstKey = thumbnailCache.value.keys().next().value as string
      thumbnailCache.value.delete(firstKey)
    }
    thumbnailCache.value.set(path, dataUrl)
  }

  function getThumbnail(path: string): string | null {
    return thumbnailCache.value.get(path) || null
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
    startPrint,
    deleteFile,
    cacheThumbnail,
    getThumbnail
  }
})
