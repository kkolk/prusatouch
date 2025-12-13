import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfirmDialog from '../../../src/components/ConfirmDialog.vue'

describe('ConfirmDialog', () => {
  it('renders when visible is true', () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        visible: true,
        title: 'Confirm Action',
        message: 'Are you sure?'
      }
    })
    expect(wrapper.find('.confirm-dialog').exists()).toBe(true)
  })

  it('does not render when visible is false', () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        visible: false,
        title: 'Confirm Action',
        message: 'Are you sure?'
      }
    })
    expect(wrapper.find('.confirm-dialog').exists()).toBe(false)
  })

  it('displays title and message', () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        visible: true,
        title: 'Delete File?',
        message: 'This action cannot be undone.'
      }
    })
    expect(wrapper.find('.dialog-title').text()).toBe('Delete File?')
    expect(wrapper.find('.dialog-message').text()).toBe('This action cannot be undone.')
  })

  it('emits confirm event when confirm button is clicked', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        visible: true,
        title: 'Confirm',
        message: 'Continue?'
      }
    })
    await wrapper.find('.btn-confirm').trigger('click')
    expect(wrapper.emitted('confirm')).toBeTruthy()
  })

  it('emits cancel event when cancel button is clicked', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        visible: true,
        title: 'Confirm',
        message: 'Continue?'
      }
    })
    await wrapper.find('.btn-cancel').trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('applies danger variant styling', () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        visible: true,
        title: 'Stop Print?',
        message: 'This will end the print.',
        variant: 'danger'
      }
    })
    expect(wrapper.find('.btn-confirm').classes()).toContain('btn-danger')
  })

  it('uses custom confirm button text', () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        visible: true,
        title: 'Confirm',
        message: 'Continue?',
        confirmText: 'Delete'
      }
    })
    expect(wrapper.find('.btn-confirm').text()).toBe('Delete')
  })

  it('uses custom cancel button text', () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        visible: true,
        title: 'Confirm',
        message: 'Continue?',
        cancelText: 'No'
      }
    })
    expect(wrapper.find('.btn-cancel').text()).toBe('No')
  })

  it('emits cancel when backdrop is clicked', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        visible: true,
        title: 'Confirm',
        message: 'Continue?'
      }
    })
    await wrapper.find('.dialog-backdrop').trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })
})
