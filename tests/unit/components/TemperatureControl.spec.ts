import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TemperatureControl from '../../../src/components/TemperatureControl.vue'
import { usePrinterStore } from '../../../src/stores/printer'

describe('TemperatureControl', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders with nozzle type', () => {
    const wrapper = mount(TemperatureControl, {
      props: {
        visible: true,
        type: 'nozzle',
        current: 25,
        target: 0
      }
    })
    expect(wrapper.text()).toContain('Nozzle Temperature')
  })

  it('renders with bed type', () => {
    const wrapper = mount(TemperatureControl, {
      props: {
        visible: true,
        type: 'bed',
        current: 25,
        target: 0
      }
    })
    expect(wrapper.text()).toContain('Bed Temperature')
  })

  it('displays current and target temperatures', () => {
    const wrapper = mount(TemperatureControl, {
      props: {
        visible: true,
        type: 'nozzle',
        current: 215,
        target: 220
      }
    })
    expect(wrapper.text()).toContain('215°')
    expect(wrapper.text()).toContain('220°')
  })

  it('shows PLA preset button for nozzle (215°C)', () => {
    const wrapper = mount(TemperatureControl, {
      props: {
        visible: true,
        type: 'nozzle',
        current: 25,
        target: 0
      }
    })
    expect(wrapper.text()).toContain('PLA')
    expect(wrapper.text()).toContain('215°')
  })

  it('shows PETG preset button for nozzle (240°C)', () => {
    const wrapper = mount(TemperatureControl, {
      props: {
        visible: true,
        type: 'nozzle',
        current: 25,
        target: 0
      }
    })
    expect(wrapper.text()).toContain('PETG')
    expect(wrapper.text()).toContain('240°')
  })

  it('shows ABS preset button for nozzle (255°C)', () => {
    const wrapper = mount(TemperatureControl, {
      props: {
        visible: true,
        type: 'nozzle',
        current: 25,
        target: 0
      }
    })
    expect(wrapper.text()).toContain('ABS')
    expect(wrapper.text()).toContain('255°')
  })

  it('shows PLA preset button for bed (60°C)', () => {
    const wrapper = mount(TemperatureControl, {
      props: {
        visible: true,
        type: 'bed',
        current: 25,
        target: 0
      }
    })
    expect(wrapper.text()).toContain('PLA')
    expect(wrapper.text()).toContain('60°')
  })

  it('shows PETG preset button for bed (85°C)', () => {
    const wrapper = mount(TemperatureControl, {
      props: {
        visible: true,
        type: 'bed',
        current: 25,
        target: 0
      }
    })
    expect(wrapper.text()).toContain('PETG')
    expect(wrapper.text()).toContain('85°')
  })

  it('shows ABS preset button for bed (100°C)', () => {
    const wrapper = mount(TemperatureControl, {
      props: {
        visible: true,
        type: 'bed',
        current: 25,
        target: 0
      }
    })
    expect(wrapper.text()).toContain('ABS')
    expect(wrapper.text()).toContain('100°')
  })

  it('shows Off preset button (0°C)', () => {
    const wrapper = mount(TemperatureControl, {
      props: {
        visible: true,
        type: 'nozzle',
        current: 215,
        target: 215
      }
    })
    expect(wrapper.text()).toContain('Off')
    expect(wrapper.text()).toContain('0°')
  })

  it('allows custom temperature input', async () => {
    const wrapper = mount(TemperatureControl, {
      props: {
        visible: true,
        type: 'nozzle',
        current: 25,
        target: 0
      }
    })
    const input = wrapper.find('input[type="number"]')
    expect(input.exists()).toBe(true)
  })

  it('calls setNozzleTemp when Set button clicked for nozzle', async () => {
    const printerStore = usePrinterStore()
    printerStore.setNozzleTemp = vi.fn().mockResolvedValue(undefined)

    const wrapper = mount(TemperatureControl, {
      props: {
        visible: true,
        type: 'nozzle',
        current: 25,
        target: 0
      }
    })

    // Click PLA preset
    const plaButton = wrapper.findAll('button').find(btn => btn.text().includes('PLA'))
    await plaButton?.trigger('click')

    // Click Set button
    const setButton = wrapper.findAll('button').find(btn => btn.text() === 'Set')
    await setButton?.trigger('click')

    expect(printerStore.setNozzleTemp).toHaveBeenCalledWith(215)
  })

  it('calls setBedTemp when Set button clicked for bed', async () => {
    const printerStore = usePrinterStore()
    printerStore.setBedTemp = vi.fn().mockResolvedValue(undefined)

    const wrapper = mount(TemperatureControl, {
      props: {
        visible: true,
        type: 'bed',
        current: 25,
        target: 0
      }
    })

    // Click PLA preset
    const plaButton = wrapper.findAll('button').find(btn => btn.text().includes('PLA'))
    await plaButton?.trigger('click')

    // Click Set button
    const setButton = wrapper.findAll('button').find(btn => btn.text() === 'Set')
    await setButton?.trigger('click')

    expect(printerStore.setBedTemp).toHaveBeenCalledWith(60)
  })

  it('emits close event when Cancel button clicked', async () => {
    const wrapper = mount(TemperatureControl, {
      props: {
        visible: true,
        type: 'nozzle',
        current: 25,
        target: 0
      }
    })

    const cancelButton = wrapper.findAll('button').find(btn => btn.text() === 'Cancel')
    await cancelButton?.trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits close event after successful temperature set', async () => {
    const printerStore = usePrinterStore()
    printerStore.setNozzleTemp = vi.fn().mockResolvedValue(undefined)

    const wrapper = mount(TemperatureControl, {
      props: {
        visible: true,
        type: 'nozzle',
        current: 25,
        target: 0
      }
    })

    // Click PLA preset
    const plaButton = wrapper.findAll('button').find(btn => btn.text().includes('PLA'))
    await plaButton?.trigger('click')

    // Click Set button
    const setButton = wrapper.findAll('button').find(btn => btn.text() === 'Set')
    await setButton?.trigger('click')

    // Wait for async operation
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('updates custom input when preset clicked', async () => {
    const wrapper = mount(TemperatureControl, {
      props: {
        visible: true,
        type: 'nozzle',
        current: 25,
        target: 0
      }
    })

    const plaButton = wrapper.findAll('button').find(btn => btn.text().includes('PLA'))
    await plaButton?.trigger('click')

    const input = wrapper.find('input[type="number"]')
    expect((input.element as HTMLInputElement).value).toBe('215')
  })

  it('allows manual temperature entry', async () => {
    const wrapper = mount(TemperatureControl, {
      props: {
        visible: true,
        type: 'nozzle',
        current: 25,
        target: 0
      }
    })

    const input = wrapper.find('input[type="number"]')
    await input.setValue(230)

    expect((input.element as HTMLInputElement).value).toBe('230')
  })

  it('shows loading state while setting temperature', async () => {
    const printerStore = usePrinterStore()
    // Mock with a promise that doesn't resolve immediately
    let resolvePromise: () => void
    printerStore.setNozzleTemp = vi.fn(() => new Promise(resolve => { resolvePromise = resolve }))

    const wrapper = mount(TemperatureControl, {
      props: {
        visible: true,
        type: 'nozzle',
        current: 25,
        target: 0
      }
    })

    const plaButton = wrapper.findAll('button').find(btn => btn.text().includes('PLA'))
    await plaButton?.trigger('click')

    const setButton = wrapper.findAll('button').find(btn => btn.text() === 'Set')
    await setButton?.trigger('click')

    // Button should be in loading state
    expect(setButton?.attributes('disabled')).toBeDefined()
  })
})
