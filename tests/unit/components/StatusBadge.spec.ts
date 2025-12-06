import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusBadge from '../../../src/components/StatusBadge.vue'

describe('StatusBadge', () => {
  it('renders IDLE state', () => {
    const wrapper = mount(StatusBadge, {
      props: { state: 'IDLE' }
    })
    expect(wrapper.text()).toContain('IDLE')
    expect(wrapper.classes()).toContain('status-idle')
  })

  it('renders PRINTING state', () => {
    const wrapper = mount(StatusBadge, {
      props: { state: 'PRINTING' }
    })
    expect(wrapper.text()).toContain('PRINTING')
    expect(wrapper.classes()).toContain('status-printing')
  })

  it('renders PAUSED state', () => {
    const wrapper = mount(StatusBadge, {
      props: { state: 'PAUSED' }
    })
    expect(wrapper.text()).toContain('PAUSED')
    expect(wrapper.classes()).toContain('status-paused')
  })

  it('renders ERROR state', () => {
    const wrapper = mount(StatusBadge, {
      props: { state: 'ERROR' }
    })
    expect(wrapper.text()).toContain('ERROR')
    expect(wrapper.classes()).toContain('status-error')
  })

  it('renders FINISHED state', () => {
    const wrapper = mount(StatusBadge, {
      props: { state: 'FINISHED' }
    })
    expect(wrapper.text()).toContain('FINISHED')
    expect(wrapper.classes()).toContain('status-finished')
  })

  it('shows dot indicator', () => {
    const wrapper = mount(StatusBadge, {
      props: { state: 'PRINTING' }
    })
    expect(wrapper.find('.status-dot').exists()).toBe(true)
  })

  it('applies breathing animation for PRINTING state', () => {
    const wrapper = mount(StatusBadge, {
      props: { state: 'PRINTING' }
    })
    expect(wrapper.classes()).toContain('status-printing')
    // Animation is defined in CSS, check class exists
  })

  it('applies correct color for each state', () => {
    const states = ['IDLE', 'PRINTING', 'PAUSED', 'ERROR', 'FINISHED'] as const
    states.forEach(state => {
      const wrapper = mount(StatusBadge, { props: { state } })
      expect(wrapper.classes()).toContain(`status-${state.toLowerCase()}`)
    })
  })
})
