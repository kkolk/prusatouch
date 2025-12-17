import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import OfflineBanner from '../../../src/components/OfflineBanner.vue'

describe('OfflineBanner', () => {
  it('renders banner when visible', () => {
    const wrapper = mount(OfflineBanner, {
      props: {
        visible: true
      }
    })
    expect(wrapper.find('.offline-banner').exists()).toBe(true)
  })

  it('does not render when not visible', () => {
    const wrapper = mount(OfflineBanner, {
      props: {
        visible: false
      }
    })
    expect(wrapper.find('.offline-banner').exists()).toBe(false)
  })

  it('displays retry count when provided', () => {
    const wrapper = mount(OfflineBanner, {
      props: {
        visible: true,
        retryCount: 3
      }
    })
    expect(wrapper.text()).toContain('attempt 3')
  })

  it('does not show retry count when zero', () => {
    const wrapper = mount(OfflineBanner, {
      props: {
        visible: true,
        retryCount: 0
      }
    })
    expect(wrapper.text()).not.toContain('attempt')
  })

  it('emits retry event when retry button clicked', async () => {
    const wrapper = mount(OfflineBanner, {
      props: {
        visible: true
      }
    })

    await wrapper.find('.banner-retry').trigger('click')
    expect(wrapper.emitted('retry')).toBeTruthy()
  })

  it('displays connection lost message', () => {
    const wrapper = mount(OfflineBanner, {
      props: {
        visible: true
      }
    })
    expect(wrapper.text()).toContain('Connection Lost')
  })
})
