import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFilesStore } from '../../../src/stores/files'

describe('filesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with empty state', () => {
    const store = useFilesStore()
    expect(store.files).toEqual([])
    expect(store.currentPath).toBe('/')
    expect(store.loading).toBe(false)
  })

  it('generates breadcrumbs from current path', () => {
    const store = useFilesStore()
    store.currentPath = '/folder1/folder2/folder3'

    expect(store.breadcrumbs).toEqual([
      { name: 'Home', path: '/' },
      { name: 'folder1', path: '/folder1' },
      { name: 'folder2', path: '/folder1/folder2' },
      { name: 'folder3', path: '/folder1/folder2/folder3' }
    ])
  })

  it('sorts files by type then name', () => {
    const store = useFilesStore()
    store.files = [
      { name: 'zebra.gcode', path: '/zebra.gcode', size: 100, m_timestamp: 1000 },
      { name: 'apple', path: '/apple', size: 0, m_timestamp: 1000 },
      { name: 'banana.gcode', path: '/banana.gcode', size: 200, m_timestamp: 1000 }
    ]

    const sorted = store.sortedFiles
    expect(sorted[0].name).toBe('apple') // Folders first
    expect(sorted[1].name).toBe('banana.gcode')
    expect(sorted[2].name).toBe('zebra.gcode')
  })

  it('caches thumbnails with LRU policy', () => {
    const store = useFilesStore()

    store.cacheThumbnail('/file1.gcode', 'data:image/png;base64,ABC')
    expect(store.getThumbnail('/file1.gcode')).toBe('data:image/png;base64,ABC')
  })

  it('limits thumbnail cache to 50 items', () => {
    const store = useFilesStore()

    for (let i = 0; i < 60; i++) {
      store.cacheThumbnail(`/file${i}.gcode`, `data${i}`)
    }

    // First 10 should be evicted
    expect(store.getThumbnail('/file0.gcode')).toBeNull()
    expect(store.getThumbnail('/file50.gcode')).toBe('data50')
  })
})
