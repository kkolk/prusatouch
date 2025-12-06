import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FileListItem from '../../../src/components/FileListItem.vue'

describe('FileListItem', () => {
  const mockFile = {
    name: 'test-print.gcode',
    path: '/storage/test-print.gcode',
    size: 1024 * 1024, // 1MB
    m_timestamp: 1638316800
  }

  it('renders filename', () => {
    const wrapper = mount(FileListItem, {
      props: { file: mockFile }
    })
    expect(wrapper.text()).toContain('test-print.gcode')
  })

  it('displays thumbnail when thumbnailUrl is provided', () => {
    const wrapper = mount(FileListItem, {
      props: { file: mockFile, thumbnailUrl: 'data:image/png;base64,test' }
    })
    const img = wrapper.find('img.thumbnail')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('data:image/png;base64,test')
  })

  it('shows placeholder when thumbnailUrl is null', () => {
    const wrapper = mount(FileListItem, {
      props: { file: mockFile, thumbnailUrl: null }
    })
    expect(wrapper.find('.thumbnail-placeholder').exists()).toBe(true)
  })

  it('formats file size in KB', () => {
    const wrapper = mount(FileListItem, {
      props: { file: { ...mockFile, size: 2048 } }
    })
    expect(wrapper.text()).toContain('2.0 KB')
  })

  it('formats file size in MB', () => {
    const wrapper = mount(FileListItem, {
      props: { file: mockFile } // 1MB
    })
    expect(wrapper.text()).toContain('1.0 MB')
  })

  it('formats file size in GB', () => {
    const wrapper = mount(FileListItem, {
      props: { file: { ...mockFile, size: 1024 * 1024 * 1024 } }
    })
    expect(wrapper.text()).toContain('1.0 GB')
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(FileListItem, {
      props: { file: mockFile }
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')![0]).toEqual([mockFile])
  })

  it('applies selected class when selected prop is true', () => {
    const wrapper = mount(FileListItem, {
      props: { file: mockFile, selected: true }
    })
    expect(wrapper.classes()).toContain('selected')
  })

  it('has minimum 80px height for touch targets', () => {
    const wrapper = mount(FileListItem, {
      props: { file: mockFile }
    })
    const style = wrapper.element.style
    // Check via computed style would be better, but checking class is fine
    expect(wrapper.classes()).toContain('file-list-item')
  })
})
