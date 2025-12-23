import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProgressRing from '../../../src/components/ProgressRing.vue'

describe('ProgressRing', () => {
  it('renders with default props', () => {
    const wrapper = mount(ProgressRing, {
      props: { progress: 0 }
    })
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('calculates correct stroke-dasharray for 0% progress', () => {
    const wrapper = mount(ProgressRing, {
      props: { progress: 0, size: 200, strokeWidth: 10 }
    })
    const circle = wrapper.find('circle.progress')
    // Circumference = 2πr, r = (200/2) - 10 = 90
    // C = 2 * π * 90 ≈ 565.49
    // At 0%: dasharray should be "0 565.49"
    const dasharray = circle.attributes('stroke-dasharray')
    expect(dasharray).toMatch(/^0(\.\d+)?\s+/)
  })

  it('calculates correct stroke-dasharray for 45% progress', () => {
    const wrapper = mount(ProgressRing, {
      props: { progress: 45, size: 200, strokeWidth: 10 }
    })
    const circle = wrapper.find('circle.progress')
    // At 45%: dasharray should be "254.47 565.49"
    const dasharray = circle.attributes('stroke-dasharray')
    expect(dasharray).toMatch(/^254/)
  })

  it('calculates correct stroke-dasharray for 100% progress', () => {
    const wrapper = mount(ProgressRing, {
      props: { progress: 100, size: 200, strokeWidth: 10 }
    })
    const circle = wrapper.find('circle.progress')
    // At 100%: dasharray should be "565.49 565.49"
    const dasharray = circle.attributes('stroke-dasharray')
    expect(dasharray).toMatch(/^565/)
  })

  it('uses custom color prop', () => {
    const wrapper = mount(ProgressRing, {
      props: { progress: 50, color: '#ff6600' }
    })
    const circle = wrapper.find('circle.progress')
    expect(circle.attributes('stroke')).toBe('#ff6600')
  })

  it('renders slot content in center', () => {
    const wrapper = mount(ProgressRing, {
      props: { progress: 75 },
      slots: {
        default: '<div class="center-content">75%</div>'
      }
    })
    expect(wrapper.find('.center-content').text()).toBe('75%')
  })

  it('clamps progress below 0 to 0', () => {
    const wrapper = mount(ProgressRing, {
      props: { progress: -50, size: 200, strokeWidth: 10 }
    })
    const circle = wrapper.find('circle.progress')
    // At 0%: dasharray should be "0 565.49"
    const dasharray = circle.attributes('stroke-dasharray')
    expect(dasharray).toMatch(/^0(\.\d+)?\s+/)
  })

  it('clamps progress above 100 to 100', () => {
    const wrapper = mount(ProgressRing, {
      props: { progress: 150, size: 200, strokeWidth: 10 }
    })
    const circle = wrapper.find('circle.progress')
    // At 100%: dasharray should be "565.49 565.49"
    const dasharray = circle.attributes('stroke-dasharray')
    expect(dasharray).toMatch(/^565/)
  })

  it('stops animation when frozen', () => {
    const wrapper = mount(ProgressRing, {
      props: { progress: 50, frozen: true }
    })
    const svg = wrapper.find('svg')
    expect(svg.classes()).toContain('frozen')
  })

  it('applies animating class when not frozen and progress > 0', () => {
    const wrapper = mount(ProgressRing, {
      props: { progress: 50, frozen: false }
    })
    const circle = wrapper.find('circle.progress')
    expect(circle.classes()).toContain('animating')
  })

  it('does not apply animating class when frozen', () => {
    const wrapper = mount(ProgressRing, {
      props: { progress: 50, frozen: true }
    })
    const circle = wrapper.find('circle.progress')
    expect(circle.classes()).not.toContain('animating')
  })

  it('does not apply animating class when progress is 0', () => {
    const wrapper = mount(ProgressRing, {
      props: { progress: 0, frozen: false }
    })
    const circle = wrapper.find('circle.progress')
    expect(circle.classes()).not.toContain('animating')
  })

  it('uses custom size from props', () => {
    const wrapper = mount(ProgressRing, {
      props: { progress: 50, size: 300, strokeWidth: 15 }
    })
    const svg = wrapper.find('svg')
    expect(svg.attributes('width')).toBe('300')
    expect(svg.attributes('height')).toBe('300')
  })

  it('defaults to size 250 when not specified', () => {
    const wrapper = mount(ProgressRing, {
      props: { progress: 50 }
    })
    const svg = wrapper.find('svg')
    expect(svg.attributes('width')).toBe('250')
    expect(svg.attributes('height')).toBe('250')
  })

  it('defaults to stroke width 14 when not specified', () => {
    const wrapper = mount(ProgressRing, {
      props: { progress: 50 }
    })
    const circle = wrapper.find('circle.progress')
    expect(circle.attributes('stroke-width')).toBe('14')
  })
})
