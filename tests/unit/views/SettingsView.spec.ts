import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SettingsView from '../../../src/views/SettingsView.vue'
import { useSettingsStore } from '../../../src/stores/settings'

describe('SettingsView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('renders the settings view', () => {
    const wrapper = mount(SettingsView)
    expect(wrapper.find('.settings-view').exists()).toBe(true)
  })

  it('displays settings title', () => {
    const wrapper = mount(SettingsView)
    expect(wrapper.text()).toContain('Settings')
  })

  it('renders brightness slider', () => {
    const wrapper = mount(SettingsView)
    const slider = wrapper.find('.brightness-slider')
    expect(slider.exists()).toBe(true)
  })

  it('displays current brightness value', () => {
    const store = useSettingsStore()
    store.setBrightness(80)

    const wrapper = mount(SettingsView)
    expect(wrapper.text()).toContain('Brightness: 80%')
  })

  it('renders screensaver timeout select', () => {
    const wrapper = mount(SettingsView)
    const select = wrapper.find('.screensaver-select')
    expect(select.exists()).toBe(true)
  })

  it('displays network information section', () => {
    const wrapper = mount(SettingsView)
    expect(wrapper.text()).toContain('Network')
    expect(wrapper.text()).toContain('Hostname')
    expect(wrapper.text()).toContain('IP Address')
  })

  it('displays system information section', () => {
    const wrapper = mount(SettingsView)
    expect(wrapper.text()).toContain('System')
    expect(wrapper.text()).toContain('App Version')
    expect(wrapper.text()).toContain('Platform')
    expect(wrapper.text()).toContain('Memory')
  })

  it('renders action buttons', () => {
    const wrapper = mount(SettingsView)
    expect(wrapper.text()).toContain('Clear Cache')
    expect(wrapper.text()).toContain('Restart Interface')
    expect(wrapper.text()).toContain('Reset to Defaults')
  })

  it('has proper sections with styling', () => {
    const wrapper = mount(SettingsView)
    const sections = wrapper.findAll('.settings-section')
    expect(sections.length).toBeGreaterThanOrEqual(4) // Display, Network, System, Actions
  })
})
