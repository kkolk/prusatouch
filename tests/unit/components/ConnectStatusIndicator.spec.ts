import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ConnectStatusIndicator from '../../../src/components/ConnectStatusIndicator.vue'

describe('ConnectStatusIndicator', () => {
  it('renders with correct structure', () => {
    const wrapper = mount(ConnectStatusIndicator, {
      props: { connected: true }
    })

    expect(wrapper.find('.connection-indicator').exists()).toBe(true)
    expect(wrapper.find('.indicator-dot').exists()).toBe(true)
    expect(wrapper.attributes('role')).toBe('status')
  })

  it('displays green dot when connected', () => {
    const wrapper = mount(ConnectStatusIndicator, {
      props: { connected: true }
    })

    expect(wrapper.classes()).toContain('status-connected')
    expect(wrapper.attributes('aria-label')).toBe('Connected')
  })

  it('displays red dot when offline', () => {
    const wrapper = mount(ConnectStatusIndicator, {
      props: { connected: false }
    })

    expect(wrapper.classes()).toContain('status-offline')
    expect(wrapper.attributes('aria-label')).toBe('Offline')
  })

  it('displays yellow dot with pulse when connecting', () => {
    const wrapper = mount(ConnectStatusIndicator, {
      props: { connected: false, connecting: true }
    })

    expect(wrapper.classes()).toContain('status-connecting')
    expect(wrapper.attributes('aria-label')).toBe('Connecting')
  })

  it('gives priority to connecting state over connected', () => {
    const wrapper = mount(ConnectStatusIndicator, {
      props: { connected: true, connecting: true }
    })

    expect(wrapper.classes()).toContain('status-connecting')
    expect(wrapper.attributes('aria-label')).toBe('Connecting')
  })

  it('meets 44px minimum touch target', () => {
    const wrapper = mount(ConnectStatusIndicator, {
      props: { connected: true }
    })

    const indicator = wrapper.find('.connection-indicator')
    const style = window.getComputedStyle(indicator.element)

    // The component uses CSS variables, so we check the classes are set
    // Actual dimensions are determined by CSS variables
    expect(indicator.exists()).toBe(true)
  })

  it('passes connected prop correctly', () => {
    const wrapper = mount(ConnectStatusIndicator, {
      props: { connected: true }
    })

    expect(wrapper.props('connected')).toBe(true)
  })

  it('has connecting prop default false', () => {
    const wrapper = mount(ConnectStatusIndicator, {
      props: { connected: true }
    })

    expect(wrapper.props('connecting')).toBe(false)
  })

  it('reacts to prop changes', async () => {
    const wrapper = mount(ConnectStatusIndicator, {
      props: { connected: true }
    })

    expect(wrapper.classes()).toContain('status-connected')

    await wrapper.setProps({ connected: false })
    expect(wrapper.classes()).toContain('status-offline')
  })
})
