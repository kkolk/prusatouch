import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'

vi.mock('../../../src/api', () => ({
  DefaultService: {
    getStorages: vi.fn(),
    getFiles: vi.fn(),
    startPrint: vi.fn(),
    deleteFile: vi.fn()
  }
}))

describe('useFiles', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('provides sorted files with folders first', async () => {
    const { DefaultService } = await import('../../../src/api')
    vi.mocked(DefaultService.getFiles).mockResolvedValue({
      children: [
        { name: 'zebra.gcode', size: 1000 },
        { name: 'folder', size: 0, type: 'FOLDER' },
        { name: 'alpha.gcode', size: 2000 }
      ]
    })

    const { useFiles } = await import('../../../src/composables/useFiles')
    const { files, navigate } = useFiles()

    await navigate('local', '/')
    await nextTick()

    expect(files.value[0].name).toBe('folder')  // Folder first
    expect(files.value[1].name).toBe('alpha.gcode')  // Then alphabetically
    expect(files.value[2].name).toBe('zebra.gcode')
  })

  it('provides loading state during fetch', async () => {
    const { DefaultService } = await import('../../../src/api')

    // Set up a promise that can be resolved from outside
    let resolveFiles: ((value: any) => void) | null = null
    const filesPromise = new Promise(resolve => {
      resolveFiles = resolve
    })

    vi.mocked(DefaultService.getFiles).mockReturnValue(filesPromise as any)

    const { useFiles } = await import('../../../src/composables/useFiles')
    const { isLoading, navigate } = useFiles()

    const navPromise = navigate('local', '/')
    await nextTick()

    expect(isLoading.value).toBe(true)

    // Resolve the pending promise
    resolveFiles!({ children: [] })
    await navPromise
    await nextTick()

    expect(isLoading.value).toBe(false)
  })

  it('provides breadcrumb navigation', async () => {
    const { DefaultService } = await import('../../../src/api')
    vi.mocked(DefaultService.getFiles).mockResolvedValue({ children: [] })

    const { useFiles } = await import('../../../src/composables/useFiles')
    const { breadcrumbs, navigate } = useFiles()

    await navigate('local', '/models/calibration')
    await nextTick()

    expect(breadcrumbs.value).toEqual([
      { name: 'Home', path: '/' },
      { name: 'models', path: '/models' },
      { name: 'calibration', path: '/models/calibration' }
    ])
  })

  it('exposes startPrint action', async () => {
    const { DefaultService } = await import('../../../src/api')
    vi.mocked(DefaultService.startPrint).mockResolvedValue(undefined)

    const { useFiles } = await import('../../../src/composables/useFiles')
    const { startPrint, currentStorage } = useFiles()

    // Set current storage context
    vi.mocked(DefaultService.getFiles).mockResolvedValue({ children: [] })
    const { navigate } = useFiles()
    await navigate('usb', '/')

    await startPrint('/test.gcode')

    expect(DefaultService.startPrint).toHaveBeenCalledWith('usb', '/test.gcode')
  })

  it('exposes deleteFile action', async () => {
    const { DefaultService } = await import('../../../src/api')
    vi.mocked(DefaultService.deleteFile).mockResolvedValue(undefined)
    vi.mocked(DefaultService.getFiles).mockResolvedValue({ children: [] })

    const { useFiles } = await import('../../../src/composables/useFiles')
    const { deleteFile, navigate } = useFiles()

    await navigate('local', '/')
    await deleteFile('/old-file.gcode')

    expect(DefaultService.deleteFile).toHaveBeenCalledWith('local', '/old-file.gcode')
  })

  it('provides thumbnail from cache', async () => {
    const { useFiles } = await import('../../../src/composables/useFiles')
    const { getThumbnail, cacheThumbnail } = useFiles()

    cacheThumbnail('/test.gcode', 'data:image/png;base64,abc123')

    expect(getThumbnail('/test.gcode')).toBe('data:image/png;base64,abc123')
  })
})
