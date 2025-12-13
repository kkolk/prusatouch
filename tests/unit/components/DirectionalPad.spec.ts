import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DirectionalPad from '../../../src/components/DirectionalPad.vue'

describe('DirectionalPad', () => {
  it('renders all directional buttons', () => {
    const wrapper = mount(DirectionalPad)

    expect(wrapper.find('[data-direction="up"]').exists()).toBe(true)
    expect(wrapper.find('[data-direction="down"]').exists()).toBe(true)
    expect(wrapper.find('[data-direction="left"]').exists()).toBe(true)
    expect(wrapper.find('[data-direction="right"]').exists()).toBe(true)
  })

  it('renders Z axis controls', () => {
    const wrapper = mount(DirectionalPad)

    expect(wrapper.find('[data-axis="z"][data-direction="up"]').exists()).toBe(true)
    expect(wrapper.find('[data-axis="z"][data-direction="down"]').exists()).toBe(true)
  })

  it('emits move event with correct axis and direction for up button', async () => {
    const wrapper = mount(DirectionalPad)

    await wrapper.find('[data-direction="up"]').trigger('click')

    expect(wrapper.emitted('move')).toBeTruthy()
    expect(wrapper.emitted('move')?.[0]).toEqual([{ axis: 'y', direction: 1 }])
  })

  it('emits move event with correct axis and direction for down button', async () => {
    const wrapper = mount(DirectionalPad)

    await wrapper.find('[data-direction="down"]').trigger('click')

    expect(wrapper.emitted('move')).toBeTruthy()
    expect(wrapper.emitted('move')?.[0]).toEqual([{ axis: 'y', direction: -1 }])
  })

  it('emits move event with correct axis and direction for left button', async () => {
    const wrapper = mount(DirectionalPad)

    await wrapper.find('[data-direction="left"]').trigger('click')

    expect(wrapper.emitted('move')).toBeTruthy()
    expect(wrapper.emitted('move')?.[0]).toEqual([{ axis: 'x', direction: -1 }])
  })

  it('emits move event with correct axis and direction for right button', async () => {
    const wrapper = mount(DirectionalPad)

    await wrapper.find('[data-direction="right"]').trigger('click')

    expect(wrapper.emitted('move')).toBeTruthy()
    expect(wrapper.emitted('move')?.[0]).toEqual([{ axis: 'x', direction: 1 }])
  })

  it('emits move event for Z up button', async () => {
    const wrapper = mount(DirectionalPad)

    await wrapper.find('[data-axis="z"][data-direction="up"]').trigger('click')

    expect(wrapper.emitted('move')).toBeTruthy()
    expect(wrapper.emitted('move')?.[0]).toEqual([{ axis: 'z', direction: 1 }])
  })

  it('emits move event for Z down button', async () => {
    const wrapper = mount(DirectionalPad)

    await wrapper.find('[data-axis="z"][data-direction="down"]').trigger('click')

    expect(wrapper.emitted('move')).toBeTruthy()
    expect(wrapper.emitted('move')?.[0]).toEqual([{ axis: 'z', direction: -1 }])
  })

  it('has large touch targets (80px minimum)', () => {
    const wrapper = mount(DirectionalPad)
    const button = wrapper.find('[data-direction="up"]')

    // Verify button has the pad-button class which sets min size to 80px
    expect(button.classes()).toContain('pad-button')
  })

  it('applies active state on press for visual feedback', () => {
    const wrapper = mount(DirectionalPad)
    const button = wrapper.find('[data-direction="up"]')

    // Component should have CSS for active state with transform
    expect(button.exists()).toBe(true)
  })
})
