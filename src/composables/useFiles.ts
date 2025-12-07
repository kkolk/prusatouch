import { computed, readonly } from 'vue'
import { useFilesStore } from '../stores/files'

/**
 * Composable for file browser functionality
 *
 * Usage:
 * ```
 * const { files, breadcrumbs, navigate, startPrint, deleteFile } = useFiles()
 *
 * await navigate('local', '/models')
 * await startPrint('/models/benchy.gcode')
 * ```
 */
export function useFiles() {
  const store = useFilesStore()

  // Reactive file list (sorted: folders first, then alphabetical)
  const files = computed(() => store.sortedFiles)

  // Navigation state
  const currentPath = computed(() => store.currentPath)
  const currentStorage = computed(() => store.currentStorage)
  const breadcrumbs = computed(() => store.breadcrumbs)

  // Loading state
  const isLoading = computed(() => store.loading)

  // Available storages
  const storages = computed(() => store.storages)

  // Navigation action
  async function navigate(storage: string, path: string) {
    await store.fetchFiles(storage, path)
  }

  // Go up one directory
  async function navigateUp() {
    const path = store.currentPath
    if (path === '/') return

    const parentPath = path.split('/').slice(0, -1).join('/') || '/'
    await navigate(store.currentStorage, parentPath)
  }

  // File actions
  async function startPrint(path: string) {
    await store.startPrint(store.currentStorage, path)
  }

  async function deleteFile(path: string) {
    await store.deleteFile(store.currentStorage, path)
  }

  // Thumbnail cache
  function getThumbnail(path: string): string | null {
    return store.getThumbnail(path)
  }

  function cacheThumbnail(path: string, dataUrl: string) {
    store.cacheThumbnail(path, dataUrl)
  }

  // Fetch storages
  async function fetchStorages() {
    await store.fetchStorages()
  }

  return {
    // File data
    files: readonly(files),
    currentPath: readonly(currentPath),
    currentStorage: readonly(currentStorage),
    breadcrumbs: readonly(breadcrumbs),
    storages: readonly(storages),

    // State
    isLoading: readonly(isLoading),

    // Navigation
    navigate,
    navigateUp,
    fetchStorages,

    // Actions
    startPrint,
    deleteFile,

    // Thumbnails
    getThumbnail,
    cacheThumbnail
  }
}
