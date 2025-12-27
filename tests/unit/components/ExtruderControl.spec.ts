import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ExtruderControl from '../../../src/components/ExtruderControl.vue'

describe('ExtruderControl', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders when visible is true', () => {
    const wrapper = mount(ExtruderControl, {
      props: { visible: true, current: 200, target: 215 }
    })
    expect(wrapper.find('.bottom-sheet').exists()).toBe(true)
  })

  it('does not render when visible is false', () => {
    const wrapper = mount(ExtruderControl, {
      props: { visible: false, current: 0, target: 0 }
    })
    expect(wrapper.find('.bottom-sheet').exists()).toBe(false)
  })

  it('displays current and target temperatures', () => {
    const wrapper = mount(ExtruderControl, {
      props: { visible: true, current: 200, target: 215 }
    })
    expect(wrapper.text()).toContain('200')
    expect(wrapper.text()).toContain('215')
  })

  it('displays temperature presets', () => {
    const wrapper = mount(ExtruderControl, {
      props: { visible: true, current: 0, target: 0 }
    })
    expect(wrapper.text()).toContain('PLA')
    expect(wrapper.text()).toContain('PETG')
    expect(wrapper.text()).toContain('ABS')
    expect(wrapper.text()).toContain('Off')
  })

  it('renders Extrude button', () => {
    const wrapper = mount(ExtruderControl, {
      props: { visible: true, current: 200, target: 215 }
    })
    const extrudeButton = wrapper.findAll('button').find(btn =>
      btn.text().includes('Extrude')
    )
    expect(extrudeButton?.exists()).toBe(true)
  })

  it('renders Retract button', () => {
    const wrapper = mount(ExtruderControl, {
      props: { visible: true, current: 200, target: 215 }
    })
    const retractButton = wrapper.findAll('button').find(btn =>
      btn.text().includes('Retract')
    )
    expect(retractButton?.exists()).toBe(true)
  })

  it('displays amount selector with options', () => {
    const wrapper = mount(ExtruderControl, {
      props: { visible: true, current: 200, target: 0 }
    })
    expect(wrapper.text()).toContain('1mm')
    expect(wrapper.text()).toContain('5mm')
    expect(wrapper.text()).toContain('10mm')
    expect(wrapper.text()).toContain('25mm')
  })

  it('locks extrude button when temp < 170°C', () => {
    const wrapper = mount(ExtruderControl, {
      props: { visible: true, current: 160, target: 215 }
    })
    const extrudeButton = wrapper.findAll('button').find(btn =>
      btn.text().includes('Extrude')
    )
    expect(extrudeButton?.attributes('disabled')).toBeDefined()
  })

  it('locks retract button when temp < 170°C', () => {
    const wrapper = mount(ExtruderControl, {
      props: { visible: true, current: 160, target: 215 }
    })
    const retractButton = wrapper.findAll('button').find(btn =>
      btn.text().includes('Retract')
    )
    expect(retractButton?.attributes('disabled')).toBeDefined()
  })

  it('enables extrude button when temp >= 170°C', () => {
    const wrapper = mount(ExtruderControl, {
      props: { visible: true, current: 200, target: 215 }
    })
    const extrudeButton = wrapper.findAll('button').find(btn =>
      btn.text().includes('Extrude')
    )
    expect(extrudeButton?.attributes('disabled')).toBeUndefined()
  })

  it('shows warning when temp < 170°C', () => {
    const wrapper = mount(ExtruderControl, {
      props: { visible: true, current: 160, target: 215 }
    })
    expect(wrapper.text()).toContain('170')
  })

  it('shows ready state when temp >= 170°C and near target', () => {
    const wrapper = mount(ExtruderControl, {
      props: { visible: true, current: 213, target: 215 }
    })
    expect(wrapper.find('.status-ready').exists()).toBe(true)
  })

  it('shows heating state when current < target', () => {
    const wrapper = mount(ExtruderControl, {
      props: { visible: true, current: 150, target: 215 }
    })
    expect(wrapper.find('.status-heating').exists()).toBe(true)
  })

  it('shows cold state when current < 40°C', () => {
    const wrapper = mount(ExtruderControl, {
      props: { visible: true, current: 25, target: 0 }
    })
    expect(wrapper.find('.status-cold').exists()).toBe(true)
  })

  it('emits extrude event with selected amount', async () => {
    const wrapper = mount(ExtruderControl, {
      props: { visible: true, current: 200, target: 215 }
    })

    // Select 10mm
    const amountButtons = wrapper.findAll('.amount-button')
    const amount10 = amountButtons.find(btn => btn.text().includes('10'))
    await amount10?.trigger('click')

    // Click extrude
    const extrudeButton = wrapper.findAll('button').find(btn =>
      btn.text().includes('Extrude')
    )
    await extrudeButton?.trigger('click')

    expect(wrapper.emitted('extrude')).toBeTruthy()
    expect(wrapper.emitted('extrude')?.[0]).toEqual([10])
  })

  it('emits retract event with selected amount', async () => {
    const wrapper = mount(ExtruderControl, {
      props: { visible: true, current: 200, target: 215 }
    })

    // Select 5mm
    const amountButtons = wrapper.findAll('.amount-button')
    const amount5 = amountButtons.find(btn => btn.text().includes('5'))
    await amount5?.trigger('click')

    // Click retract
    const retractButton = wrapper.findAll('button').find(btn =>
      btn.text().includes('Retract')
    )
    await retractButton?.trigger('click')

    expect(wrapper.emitted('retract')).toBeTruthy()
    expect(wrapper.emitted('retract')?.[0]).toEqual([5])
  })

  it('emits set-temp event when preset is clicked', async () => {
    const wrapper = mount(ExtruderControl, {
      props: { visible: true, current: 200, target: 0 }
    })

    const presetButtons = wrapper.findAll('.preset-button')
    const plaButton = presetButtons.find(btn => btn.text().includes('PLA'))
    await plaButton?.trigger('click')

    expect(wrapper.emitted('set-temp')).toBeTruthy()
    expect(wrapper.emitted('set-temp')?.[0]).toEqual([215])
  })

  it('emits close event', async () => {
    const wrapper = mount(ExtruderControl, {
      props: { visible: true, current: 0, target: 0 }
    })

    const closeButton = wrapper.findAllComponents({ name: 'TouchButton' }).find(btn =>
      btn.text().includes('Close')
    )
    await closeButton?.trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('disables extrude button when disabled prop is true', () => {
    const wrapper = mount(ExtruderControl, {
      props: { visible: true, current: 200, target: 215, disabled: true }
    })
    const extrudeButton = wrapper.findAll('button').find(btn =>
      btn.text().includes('Extrude')
    )
    expect(extrudeButton?.attributes('disabled')).toBeDefined()
  })

  it('disables retract button when disabled prop is true', () => {
    const wrapper = mount(ExtruderControl, {
      props: { visible: true, current: 200, target: 215, disabled: true }
    })
    const retractButton = wrapper.findAll('button').find(btn =>
      btn.text().includes('Retract')
    )
    expect(retractButton?.attributes('disabled')).toBeDefined()
  })

  it('thermal safeguard still works - cold nozzle disables extrude even when disabled is false', () => {
    const wrapper = mount(ExtruderControl, {
      props: { visible: true, current: 160, target: 215, disabled: false }
    })
    const extrudeButton = wrapper.findAll('button').find(btn =>
      btn.text().includes('Extrude')
    )
    expect(extrudeButton?.attributes('disabled')).toBeDefined()
  })

  it('both conditions work together - hot nozzle and not disabled enables extrude', () => {
    const wrapper = mount(ExtruderControl, {
      props: { visible: true, current: 200, target: 215, disabled: false }
    })
    const extrudeButton = wrapper.findAll('button').find(btn =>
      btn.text().includes('Extrude')
    )
    expect(extrudeButton?.attributes('disabled')).toBeUndefined()
  })

  it('disabled prop overrides thermal state - hot nozzle but disabled prevents extrude', () => {
    const wrapper = mount(ExtruderControl, {
      props: { visible: true, current: 200, target: 215, disabled: true }
    })
    const extrudeButton = wrapper.findAll('button').find(btn =>
      btn.text().includes('Extrude')
    )
    expect(extrudeButton?.attributes('disabled')).toBeDefined()
  })
})
