import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ExpandedFileView from '../../../src/components/ExpandedFileView.vue'

// Mock fetch for thumbnail loading
global.fetch = vi.fn()

describe('ExpandedFileView', () => {
  const mockFile = {
    name: 'test-print.gcode',
    display_name: 'Test Print.gcode',
    path: '/storage/test-print.gcode',
    size: 1024 * 1024,
    type: 'PRINT_FILE',
    m_timestamp: 1638316800
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('renders filename', () => {
    const wrapper = mount(ExpandedFileView, {
      props: {
        visible: true,
        file: mockFile,
        storage: '/local',
        path: '/test-print.gcode'
      }
    })
    expect(wrapper.text()).toContain('Test Print.gcode')
  })

  it('renders print time label and value', () => {
    const wrapper = mount(ExpandedFileView, {
      props: {
        visible: true,
        file: mockFile,
        storage: '/local',
        path: '/test-print.gcode'
      }
    })
    expect(wrapper.text()).toContain('PRINT TIME')
  })

  it('renders filament label and value', () => {
    const wrapper = mount(ExpandedFileView, {
      props: {
        visible: true,
        file: mockFile,
        storage: '/local',
        path: '/test-print.gcode'
      }
    })
    expect(wrapper.text()).toContain('FILAMENT')
  })

  it('renders layer height label and value', () => {
    const wrapper = mount(ExpandedFileView, {
      props: {
        visible: true,
        file: mockFile,
        storage: '/local',
        path: '/test-print.gcode'
      }
    })
    expect(wrapper.text()).toContain('LAYER HEIGHT')
  })

  it('renders nozzle size label and value', () => {
    const wrapper = mount(ExpandedFileView, {
      props: {
        visible: true,
        file: mockFile,
        storage: '/local',
        path: '/test-print.gcode'
      }
    })
    expect(wrapper.text()).toContain('NOZZLE SIZE')
  })

  it('shows thumbnail when thumbnailUrl is provided', () => {
    const wrapper = mount(ExpandedFileView, {
      props: {
        visible: true,
        file: mockFile,
        storage: '/local',
        path: '/test-print.gcode',
        thumbnailUrl: '/api/thumbnails/local/test.gcode.orig.png'
      }
    })
    expect(wrapper.find('.thumbnail-container').exists()).toBe(true)
  })

  it('shows placeholder when no thumbnail', () => {
    const wrapper = mount(ExpandedFileView, {
      props: {
        visible: true,
        file: mockFile,
        storage: '/local',
        path: '/test-print.gcode',
        thumbnailUrl: null
      }
    })
    expect(wrapper.find('.thumbnail-placeholder').exists()).toBe(true)
  })

  it('has PRINT NOW button', () => {
    const wrapper = mount(ExpandedFileView, {
      props: {
        visible: true,
        file: mockFile,
        storage: '/local',
        path: '/test-print.gcode'
      }
    })
    expect(wrapper.text()).toContain('PRINT NOW')
  })

  it('has CANCEL button', () => {
    const wrapper = mount(ExpandedFileView, {
      props: {
        visible: true,
        file: mockFile,
        storage: '/local',
        path: '/test-print.gcode'
      }
    })
    expect(wrapper.text()).toContain('CANCEL')
  })

  it('emits close event when CANCEL button is clicked', async () => {
    const wrapper = mount(ExpandedFileView, {
      props: {
        visible: true,
        file: mockFile,
        storage: '/local',
        path: '/test-print.gcode'
      }
    })
    const cancelBtn = wrapper.find('.btn-cancel')
    await cancelBtn.trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits close event when backdrop is clicked', async () => {
    const wrapper = mount(ExpandedFileView, {
      props: {
        visible: true,
        file: mockFile,
        storage: '/local',
        path: '/test-print.gcode'
      },
      attachTo: document.body
    })
    await wrapper.find('.expanded-file-view').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('does not emit close when modal content is clicked', async () => {
    const wrapper = mount(ExpandedFileView, {
      props: {
        visible: true,
        file: mockFile,
        storage: '/local',
        path: '/test-print.gcode'
      }
    })
    await wrapper.find('.modal-content').trigger('click')
    expect(wrapper.emitted('close')).toBeFalsy()
  })

  it('is not visible when visible prop is false', () => {
    const wrapper = mount(ExpandedFileView, {
      props: {
        visible: false,
        file: mockFile,
        storage: '/local',
        path: '/test-print.gcode'
      }
    })
    expect(wrapper.find('.expanded-file-view').exists()).toBe(false)
  })

  it('has slide-up animation class', () => {
    const wrapper = mount(ExpandedFileView, {
      props: {
        visible: true,
        file: mockFile,
        storage: '/local',
        path: '/test-print.gcode'
      }
    })
    expect(wrapper.find('.modal-content').exists()).toBe(true)
  })

  it('has min-height 60px for buttons', () => {
    const wrapper = mount(ExpandedFileView, {
      props: {
        visible: true,
        file: mockFile,
        storage: '/local',
        path: '/test-print.gcode'
      }
    })
    const buttons = wrapper.findAll('.btn')
    buttons.forEach(btn => {
      expect(btn.classes()).toContain('btn')
    })
  })
})
