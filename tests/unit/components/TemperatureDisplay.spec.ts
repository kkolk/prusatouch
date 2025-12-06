import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TemperatureDisplay from '../../../src/components/TemperatureDisplay.vue'

describe('TemperatureDisplay', () => {
  it('renders current and target temperatures', () => {
    const wrapper = mount(TemperatureDisplay, {
      props: { current: 215, target: 215, type: 'nozzle' }
    })
    expect(wrapper.text()).toContain('215')
  })

  it('shows cold state when temperature < 40', () => {
    const wrapper = mount(TemperatureDisplay, {
      props: { current: 25, target: 0, type: 'bed' }
    })
    expect(wrapper.classes()).toContain('temp-cold')
  })

  it('shows heating state when current < target', () => {
    const wrapper = mount(TemperatureDisplay, {
      props: { current: 180, target: 215, type: 'nozzle' }
    })
    expect(wrapper.classes()).toContain('temp-heating')
  })

  it('shows at-target state when within 2 degrees', () => {
    const wrapper = mount(TemperatureDisplay, {
      props: { current: 214, target: 215, type: 'nozzle' }
    })
    expect(wrapper.classes()).toContain('temp-at-target')
  })

  it('shows at-target state when exactly at target', () => {
    const wrapper = mount(TemperatureDisplay, {
      props: { current: 215, target: 215, type: 'nozzle' }
    })
    expect(wrapper.classes()).toContain('temp-at-target')
  })

  it('shows cooling state when current > target + 2', () => {
    const wrapper = mount(TemperatureDisplay, {
      props: { current: 70, target: 60, type: 'bed' }
    })
    expect(wrapper.classes()).toContain('temp-cooling')
  })

  it('displays nozzle icon for nozzle type', () => {
    const wrapper = mount(TemperatureDisplay, {
      props: { current: 215, target: 215, type: 'nozzle' }
    })
    expect(wrapper.find('.icon').text()).toContain('🔥')
  })

  it('displays bed icon for bed type', () => {
    const wrapper = mount(TemperatureDisplay, {
      props: { current: 60, target: 60, type: 'bed' }
    })
    expect(wrapper.find('.icon').text()).toContain('🛏️')
  })

  it('formats temperature with degree symbol', () => {
    const wrapper = mount(TemperatureDisplay, {
      props: { current: 215, target: 220, type: 'nozzle' }
    })
    expect(wrapper.text()).toMatch(/215°/)
    expect(wrapper.text()).toMatch(/220°/)
  })
})
