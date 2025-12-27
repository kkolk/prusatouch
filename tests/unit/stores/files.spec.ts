import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFilesStore } from '../../../src/stores/files'

// Mock the API before importing
vi.mock('../../../src/api', () => ({
  DefaultService: {
    getApiV1Files: vi.fn()
  }
}))

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

    const blobUrl = 'blob:http://localhost/abc123'
    store.cacheThumbnail('/file1.gcode', 'http://api/thumbnail.jpg', blobUrl)
    expect(store.getThumbnail('/file1.gcode')).toBe(blobUrl)
  })

  it('limits thumbnail cache to 50 items', () => {
    const store = useFilesStore()

    for (let i = 0; i < 60; i++) {
      const blobUrl = `blob:http://localhost/file${i}`
      store.cacheThumbnail(`/file${i}.gcode`, `http://api/file${i}.jpg`, blobUrl)
    }

    // First 10 should be evicted
    expect(store.getThumbnail('/file0.gcode')).toBeNull()
    expect(store.getThumbnail('/file50.gcode')).toBe('blob:http://localhost/file50')
  })

  describe('path normalization', () => {
    beforeEach(async () => {
      const { DefaultService } = await import('../../../src/api')
      vi.mocked(DefaultService.getApiV1Files).mockResolvedValue({
        type: 'FOLDER' as any,
        name: 'test',
        display_name: 'test',
        read_only: false,
        m_timestamp: 0,
        children: []
      })
    })

    afterEach(() => {
      vi.clearAllMocks()
    })

    it('normalizes storage with leading slash: /local + /file.gcode', async () => {
      const { DefaultService } = await import('../../../src/api')
      const store = useFilesStore()

      await store.fetchFiles('/local', '/file.gcode')

      expect(DefaultService.getApiV1Files).toHaveBeenCalledWith(
        'local',  // Storage should have leading slash stripped
        '/file.gcode',  // Path should be preserved as-is
        undefined,
        'application/json'
      )
    })

    it('normalizes storage with leading slash: /local + file.gcode', async () => {
      const { DefaultService } = await import('../../../src/api')
      const store = useFilesStore()

      await store.fetchFiles('/local', 'file.gcode')

      expect(DefaultService.getApiV1Files).toHaveBeenCalledWith(
        'local',  // Storage should have leading slash stripped
        'file.gcode',
        undefined,
        'application/json'
      )
    })

    it('handles storage without slash: local + /file.gcode', async () => {
      const { DefaultService } = await import('../../../src/api')
      const store = useFilesStore()

      await store.fetchFiles('local', '/file.gcode')

      expect(DefaultService.getApiV1Files).toHaveBeenCalledWith(
        'local',  // Storage unchanged (no slash to strip)
        '/file.gcode',  // Path preserved
        undefined,
        'application/json'
      )
    })

    it('handles no slashes: local + file.gcode', async () => {
      const { DefaultService } = await import('../../../src/api')
      const store = useFilesStore()

      await store.fetchFiles('local', 'file.gcode')

      expect(DefaultService.getApiV1Files).toHaveBeenCalledWith(
        'local',
        'file.gcode',
        undefined,
        'application/json'
      )
    })
  })
})
