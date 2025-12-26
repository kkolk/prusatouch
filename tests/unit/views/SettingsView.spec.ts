import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SettingsView from '../../../src/views/SettingsView.vue'
import { usePrinterStore } from '../../../src/stores/printer'

describe('SettingsView', () => {
  let printerStore: ReturnType<typeof usePrinterStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    printerStore = usePrinterStore()
    // Reset store state before each test
    printerStore.printerInfo = null
    printerStore.version = null
    printerStore.printerInfoLoading = false
  })

  it('renders the settings view', () => {
    const wrapper = mount(SettingsView)
    expect(wrapper.find('.settings-view').exists()).toBe(true)
  })

  it('displays settings title', () => {
    const wrapper = mount(SettingsView)
    expect(wrapper.text()).toContain('Settings')
  })

  // Printer Information Tests
  it('displays printer section with refresh button', () => {
    const wrapper = mount(SettingsView)
    expect(wrapper.text()).toContain('Printer')
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('displays all printer info fields', async () => {
    printerStore.printerInfo = {
      name: 'Prusa MINI',
      serial: 'CZPX1234',
      hostname: 'prusamini.local',
      location: 'Home Office',
      nozzle_diameter: 0.4,
      'printer.type': 'MINI',
      'printer.variant': 'MINI'
    } as any
    printerStore.version = {
      firmware: '3.14.0',
      text: 'prusa-link 0.9.0'
    } as any
    printerStore.printerInfoLoading = false

    const wrapper = mount(SettingsView)
    await nextTick()
    // The component should show printer info when loading is false
    const text = wrapper.text()
    expect(text).toContain('Name:')
    expect(text).toContain('Serial:')
    expect(text).toContain('Firmware:')
    expect(text).toContain('PrusaLink:')
    expect(text).toContain('Nozzle:')
  })

  it('shows loading state while fetching printer info', () => {
    printerStore.printerInfoLoading = true

    const wrapper = mount(SettingsView)
    expect(wrapper.text()).toContain('Loading printer information...')
  })

  it('displays fallback values when printer info is not available', async () => {
    printerStore.printerInfo = null
    printerStore.version = null
    printerStore.printerInfoLoading = false

    const wrapper = mount(SettingsView)
    await nextTick()
    const text = wrapper.text()
    expect(text).toContain('Unknown Printer')
    expect(text).toContain('Unknown')
    expect(text).toContain('Not Set')
  })

  it('refresh button calls fetchPrinterInfo and fetchVersion', async () => {
    printerStore.printerInfoLoading = false

    const fetchPrinterInfoSpy = vi.spyOn(printerStore, 'fetchPrinterInfo')
    const fetchVersionSpy = vi.spyOn(printerStore, 'fetchVersion')

    const wrapper = mount(SettingsView)
    const button = wrapper.find('button')
    await button.trigger('click')
    await nextTick()

    expect(fetchPrinterInfoSpy).toHaveBeenCalled()
    expect(fetchVersionSpy).toHaveBeenCalled()

    fetchPrinterInfoSpy.mockRestore()
    fetchVersionSpy.mockRestore()
  })

  it('disables refresh button while loading', () => {
    printerStore.printerInfoLoading = true

    const wrapper = mount(SettingsView)
    const button = wrapper.find('button')
    expect(button.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Refreshing...')
  })

  // Network Information Tests
  it('displays network section', () => {
    const wrapper = mount(SettingsView)
    expect(wrapper.text()).toContain('Network')
  })

  it('displays hostname and location', async () => {
    printerStore.printerInfo = {
      hostname: 'prusamini.local',
      location: 'Home Office',
      name: 'Prusa MINI',
      serial: 'CZPX1234',
      nozzle_diameter: 0.4,
      'printer.type': 'MINI',
      'printer.variant': 'MINI'
    } as any
    printerStore.printerInfoLoading = false

    const wrapper = mount(SettingsView)
    await nextTick()
    const text = wrapper.text()
    expect(text).toContain('Hostname:')
    expect(text).toContain('Location:')
    expect(text).toContain('prusamini.local')
    expect(text).toContain('Home Office')
  })

  it('shows loading state for network section', () => {
    printerStore.printerInfoLoading = true

    const wrapper = mount(SettingsView)
    expect(wrapper.text()).toContain('Loading network information...')
  })

  // Actions Section Tests
  it('renders action buttons', () => {
    const wrapper = mount(SettingsView)
    expect(wrapper.text()).toContain('Clear Cache')
    expect(wrapper.text()).toContain('Restart Interface')
    expect(wrapper.text()).toContain('Reset to Defaults')
  })

  it('has proper sections with styling', () => {
    const wrapper = mount(SettingsView)
    const sections = wrapper.findAll('.settings-section')
    expect(sections.length).toBeGreaterThanOrEqual(3) // Printer, Network, Actions
  })

  // Tests removed (brightness/screensaver no longer exist)
  it('does not display brightness slider', () => {
    const wrapper = mount(SettingsView)
    const slider = wrapper.find('.brightness-slider')
    expect(slider.exists()).toBe(false)
  })

  it('does not display screensaver timeout select', () => {
    const wrapper = mount(SettingsView)
    const select = wrapper.find('.screensaver-select')
    expect(select.exists()).toBe(false)
  })
})
