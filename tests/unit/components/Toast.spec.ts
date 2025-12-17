import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Toast from '../../../src/components/Toast.vue'

describe('Toast', () => {
  it('renders toast when visible', () => {
    const wrapper = mount(Toast, {
      props: {
        visible: true,
        message: 'Test message'
      }
    })
    expect(wrapper.find('.toast').exists()).toBe(true)
    expect(wrapper.text()).toContain('Test message')
  })

  it('does not render when not visible', () => {
    const wrapper = mount(Toast, {
      props: {
        visible: false,
        message: 'Test message'
      }
    })
    expect(wrapper.find('.toast').exists()).toBe(false)
  })

  it('applies correct type class', () => {
    const types = ['info', 'success', 'warning', 'error'] as const

    types.forEach(type => {
      const wrapper = mount(Toast, {
        props: {
          visible: true,
          message: 'Test',
          type
        }
      })
      expect(wrapper.find(`.toast-${type}`).exists()).toBe(true)
    })
  })

  it('emits close event when close button clicked', async () => {
    const wrapper = mount(Toast, {
      props: {
        visible: true,
        message: 'Test'
      }
    })

    await wrapper.find('.toast-close').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('uses default type and duration', () => {
    const wrapper = mount(Toast, {
      props: {
        visible: true,
        message: 'Test'
      }
    })
    expect(wrapper.find('.toast-info').exists()).toBe(true)
  })
})
