import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TemperatureGraph from '../../../src/components/TemperatureGraph.vue'
import type { TemperatureDataPoint } from '../../../src/stores/printer'

describe('TemperatureGraph', () => {
  const mockData: TemperatureDataPoint[] = [
    { timestamp: Date.now() - 600000, nozzle: 200, bed: 60, nozzleTarget: 215, bedTarget: 60 },
    { timestamp: Date.now() - 300000, nozzle: 210, bed: 60, nozzleTarget: 215, bedTarget: 60 },
    { timestamp: Date.now(), nozzle: 215, bed: 60, nozzleTarget: 215, bedTarget: 60 }
  ]

  it('renders the temperature graph', () => {
    const wrapper = mount(TemperatureGraph, {
      props: { data: mockData }
    })
    expect(wrapper.find('.temperature-graph').exists()).toBe(true)
  })

  it('renders SVG element', () => {
    const wrapper = mount(TemperatureGraph, {
      props: { data: mockData }
    })
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('renders grid lines', () => {
    const wrapper = mount(TemperatureGraph, {
      props: { data: mockData }
    })
    const gridLines = wrapper.findAll('.grid-line')
    expect(gridLines.length).toBeGreaterThan(0)
  })

  it('renders temperature lines', () => {
    const wrapper = mount(TemperatureGraph, {
      props: { data: mockData }
    })
    const tempLines = wrapper.findAll('.temp-line')
    expect(tempLines.length).toBe(4) // nozzle, bed, nozzle target, bed target
  })

  it('renders legend', () => {
    const wrapper = mount(TemperatureGraph, {
      props: { data: mockData }
    })
    expect(wrapper.find('.legend').exists()).toBe(true)
    expect(wrapper.text()).toContain('Nozzle')
    expect(wrapper.text()).toContain('Bed')
    expect(wrapper.text()).toContain('Target')
  })

  it('handles empty data gracefully', () => {
    const wrapper = mount(TemperatureGraph, {
      props: { data: [] }
    })
    expect(wrapper.find('.temperature-graph').exists()).toBe(true)
  })

  it('accepts custom width and height', () => {
    const wrapper = mount(TemperatureGraph, {
      props: {
        data: mockData,
        width: 600,
        height: 150
      }
    })
    const svg = wrapper.find('svg')
    expect(svg.attributes('width')).toBe('600')
    expect(svg.attributes('height')).toBe('150')
  })

  it('uses default dimensions when not provided', () => {
    const wrapper = mount(TemperatureGraph, {
      props: { data: mockData }
    })
    const svg = wrapper.find('svg')
    expect(svg.attributes('width')).toBe('700')
    expect(svg.attributes('height')).toBe('200')
  })
})
