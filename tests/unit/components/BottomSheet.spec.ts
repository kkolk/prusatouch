import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BottomSheet from '../../../src/components/BottomSheet.vue'

describe('BottomSheet', () => {
  it('renders when visible is true', () => {
    const wrapper = mount(BottomSheet, {
      props: { visible: true, title: 'Confirm Action' }
    })
    expect(wrapper.find('.bottom-sheet').exists()).toBe(true)
  })

  it('does not render when visible is false', () => {
    const wrapper = mount(BottomSheet, {
      props: { visible: false, title: 'Confirm Action' }
    })
    expect(wrapper.find('.bottom-sheet').exists()).toBe(false)
  })

  it('displays title prop', () => {
    const wrapper = mount(BottomSheet, {
      props: { visible: true, title: 'Delete File?' }
    })
    expect(wrapper.find('.sheet-title').text()).toBe('Delete File?')
  })

  it('renders slot content', () => {
    const wrapper = mount(BottomSheet, {
      props: { visible: true, title: 'Confirm' },
      slots: {
        default: '<p class="custom-content">Are you sure?</p>'
      }
    })
    expect(wrapper.find('.custom-content').text()).toBe('Are you sure?')
  })

  it('emits close event when backdrop is clicked', async () => {
    const wrapper = mount(BottomSheet, {
      props: { visible: true, title: 'Test' }
    })
    await wrapper.find('.backdrop').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('does not emit close when sheet content is clicked', async () => {
    const wrapper = mount(BottomSheet, {
      props: { visible: true, title: 'Test' }
    })
    await wrapper.find('.sheet-content').trigger('click')
    expect(wrapper.emitted('close')).toBeFalsy()
  })

  it('renders actions slot when provided', () => {
    const wrapper = mount(BottomSheet, {
      props: { visible: true, title: 'Confirm' },
      slots: {
        actions: '<button class="confirm-btn">Confirm</button>'
      }
    })
    expect(wrapper.find('.confirm-btn').exists()).toBe(true)
  })

  it('has transition classes for slide-up animation', () => {
    const wrapper = mount(BottomSheet, {
      props: { visible: true, title: 'Test' }
    })
    // Check that Transition component exists
    expect(wrapper.findComponent({ name: 'Transition' }).exists()).toBe(true)
  })
})
