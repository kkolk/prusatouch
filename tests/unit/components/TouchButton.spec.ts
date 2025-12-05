import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TouchButton from '../../../src/components/TouchButton.vue'

describe('TouchButton', () => {
  it('renders with default props', () => {
    const wrapper = mount(TouchButton, {
      slots: { default: 'Click me' }
    })
    expect(wrapper.text()).toBe('Click me')
    expect(wrapper.classes()).toContain('touch-button')
  })

  it('applies primary variant class', () => {
    const wrapper = mount(TouchButton, {
      props: { variant: 'primary' }
    })
    expect(wrapper.classes()).toContain('touch-button--primary')
  })

  it('applies secondary variant class', () => {
    const wrapper = mount(TouchButton, {
      props: { variant: 'secondary' }
    })
    expect(wrapper.classes()).toContain('touch-button--secondary')
  })

  it('applies danger variant class', () => {
    const wrapper = mount(TouchButton, {
      props: { variant: 'danger' }
    })
    expect(wrapper.classes()).toContain('touch-button--danger')
  })

  it('applies large size class', () => {
    const wrapper = mount(TouchButton, {
      props: { size: 'large' }
    })
    expect(wrapper.classes()).toContain('touch-button--large')
  })

  it('shows loading spinner when loading', () => {
    const wrapper = mount(TouchButton, {
      props: { loading: true }
    })
    expect(wrapper.find('.spinner').exists()).toBe(true)
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('is disabled when disabled prop is true', () => {
    const wrapper = mount(TouchButton, {
      props: { disabled: true }
    })
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(TouchButton)
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('does not emit click when disabled', async () => {
    const wrapper = mount(TouchButton, {
      props: { disabled: true }
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })
})
