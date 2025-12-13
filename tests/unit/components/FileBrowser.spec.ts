import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import FileBrowser from '../../../src/components/FileBrowser.vue'
import { useFilesStore } from '../../../src/stores/files'

describe('FileBrowser', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders when visible is true', () => {
    const wrapper = mount(FileBrowser, {
      props: { visible: true }
    })
    expect(wrapper.find('.file-browser').exists()).toBe(true)
  })

  it('does not render when visible is false', () => {
    const wrapper = mount(FileBrowser, {
      props: { visible: false }
    })
    expect(wrapper.find('.file-browser').exists()).toBe(false)
  })

  it('displays title "Select File to Print"', () => {
    const wrapper = mount(FileBrowser, {
      props: { visible: true }
    })
    expect(wrapper.text()).toContain('Select File to Print')
  })

  it('emits close event when close button is clicked', async () => {
    const wrapper = mount(FileBrowser, {
      props: { visible: true }
    })
    // Find the TouchButton in the actions slot
    const closeButton = wrapper.findAllComponents({ name: 'TouchButton' }).find(btn =>
      btn.text().includes('Close')
    )
    await closeButton?.trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('displays storage selector dropdown', () => {
    const filesStore = useFilesStore()
    filesStore.storages = [
      { path: '/local', name: 'local', read_only: false },
      { path: '/usb', name: 'USB', read_only: false }
    ]

    const wrapper = mount(FileBrowser, {
      props: { visible: true }
    })

    const select = wrapper.find('select.storage-selector')
    expect(select.exists()).toBe(true)
  })

  it('displays file list container', () => {
    const filesStore = useFilesStore()
    filesStore.loading = false
    filesStore.files = [
      { name: 'test.gcode', size: 1024, path: '/local/test.gcode' }
    ]

    const wrapper = mount(FileBrowser, {
      props: { visible: true }
    })
    expect(wrapper.find('.file-list').exists()).toBe(true)
  })

  it('displays empty state when no files', () => {
    const filesStore = useFilesStore()
    filesStore.files = []

    const wrapper = mount(FileBrowser, {
      props: { visible: true }
    })

    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.text()).toContain('No files found')
  })

  it('renders FileListItem for each file', () => {
    const filesStore = useFilesStore()
    filesStore.files = [
      { name: 'test1.gcode', size: 1024, path: '/local/test1.gcode' },
      { name: 'test2.gcode', size: 2048, path: '/local/test2.gcode' }
    ]

    const wrapper = mount(FileBrowser, {
      props: { visible: true }
    })

    const items = wrapper.findAllComponents({ name: 'FileListItem' })
    expect(items).toHaveLength(2)
  })

  it('fetches storages and files on mount', async () => {
    const filesStore = useFilesStore()
    const fetchStoragesSpy = vi.spyOn(filesStore, 'fetchStorages').mockResolvedValue()
    const fetchFilesSpy = vi.spyOn(filesStore, 'fetchFiles').mockResolvedValue()

    const wrapper = mount(FileBrowser, {
      props: { visible: true }
    })

    // Wait for onMounted to complete
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(fetchStoragesSpy).toHaveBeenCalled()
    expect(fetchFilesSpy).toHaveBeenCalledWith('local', '/')
  })

  it('displays loading state', () => {
    const filesStore = useFilesStore()
    filesStore.loading = true

    const wrapper = mount(FileBrowser, {
      props: { visible: true }
    })

    expect(wrapper.find('.loading-indicator').exists()).toBe(true)
  })

  it('emits file-selected when file is clicked', async () => {
    const filesStore = useFilesStore()
    filesStore.files = [
      { name: 'test.gcode', size: 1024, path: '/local/test.gcode' }
    ]

    const wrapper = mount(FileBrowser, {
      props: { visible: true }
    })

    const fileItem = wrapper.findComponent({ name: 'FileListItem' })
    await fileItem.vm.$emit('click', filesStore.files[0])

    expect(wrapper.emitted('file-selected')).toBeTruthy()
    expect(wrapper.emitted('file-selected')?.[0]).toEqual([filesStore.files[0]])
  })
})
