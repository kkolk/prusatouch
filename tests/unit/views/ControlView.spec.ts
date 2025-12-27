import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ControlView from '../../../src/views/ControlView.vue'
import { usePrinterStore } from '../../../src/stores/printer'
import { StatusPrinter } from '../../../src/api/models/StatusPrinter'

describe('ControlView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the control view', () => {
    const wrapper = mount(ControlView)
    expect(wrapper.find('.control-view').exists()).toBe(true)
  })

  it('displays position coordinates', () => {
    const printerStore = usePrinterStore()
    printerStore.status = {
      axis_x: 100.5,
      axis_y: 50.3,
      axis_z: 10.8,
      state: StatusPrinter.state.IDLE,
      temp_nozzle: 0,
      target_nozzle: 0,
      temp_bed: 0,
      target_bed: 0
    } as StatusPrinter

    const wrapper = mount(ControlView)

    expect(wrapper.text()).toContain('100.5')
    expect(wrapper.text()).toContain('50.3')
    expect(wrapper.text()).toContain('10.8')
  })

  it('displays position with 1 decimal place formatting', () => {
    const printerStore = usePrinterStore()
    printerStore.status = {
      axis_x: 100.123,
      axis_y: 50.456,
      axis_z: 10.789,
      state: StatusPrinter.state.IDLE,
      temp_nozzle: 0,
      target_nozzle: 0,
      temp_bed: 0,
      target_bed: 0
    } as StatusPrinter

    const wrapper = mount(ControlView)

    expect(wrapper.text()).toContain('100.1')
    expect(wrapper.text()).toContain('50.5')
    expect(wrapper.text()).toContain('10.8')
  })

  it('defaults to 0.0 when position values are undefined', () => {
    const printerStore = usePrinterStore()
    printerStore.status = {
      state: StatusPrinter.state.IDLE,
      temp_nozzle: 0,
      target_nozzle: 0,
      temp_bed: 0,
      target_bed: 0
    } as StatusPrinter

    const wrapper = mount(ControlView)

    expect(wrapper.text()).toContain('X:')
    expect(wrapper.text()).toContain('Y:')
    expect(wrapper.text()).toContain('Z:')
    expect(wrapper.text()).toContain('0.0')
  })

  it('updates position display when status changes', async () => {
    const printerStore = usePrinterStore()
    printerStore.status = {
      axis_x: 0,
      axis_y: 0,
      axis_z: 0,
      state: StatusPrinter.state.IDLE,
      temp_nozzle: 0,
      target_nozzle: 0,
      temp_bed: 0,
      target_bed: 0
    } as StatusPrinter

    const wrapper = mount(ControlView)

    expect(wrapper.text()).toContain('0.0')

    // Update position
    printerStore.status = {
      axis_x: 25.5,
      axis_y: 37.2,
      axis_z: 5.0,
      state: StatusPrinter.state.IDLE,
      temp_nozzle: 0,
      target_nozzle: 0,
      temp_bed: 0,
      target_bed: 0
    } as StatusPrinter

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('25.5')
    expect(wrapper.text()).toContain('37.2')
    expect(wrapper.text()).toContain('5.0')
  })

  it('renders DirectionalPad component', () => {
    const wrapper = mount(ControlView)
    expect(wrapper.findComponent({ name: 'DirectionalPad' }).exists()).toBe(true)
  })

  it('displays move step selector', () => {
    const wrapper = mount(ControlView)
    const stepButtons = wrapper.findAll('.step-selector button')
    expect(stepButtons.length).toBeGreaterThan(0)
  })

  it('has step options: 0.1, 1, 10, 100mm', () => {
    const wrapper = mount(ControlView)
    expect(wrapper.text()).toContain('0.1')
    expect(wrapper.text()).toContain('1')
    expect(wrapper.text()).toContain('10')
    expect(wrapper.text()).toContain('100')
  })

  it('highlights selected step', () => {
    const wrapper = mount(ControlView)
    const activeButton = wrapper.find('.step-button.active')
    expect(activeButton.exists()).toBe(true)
  })

  it('calls moveAxis when directional pad emits move event', async () => {
    const printerStore = usePrinterStore()
    const moveAxisSpy = vi.spyOn(printerStore, 'moveAxis').mockResolvedValue()

    const wrapper = mount(ControlView)
    const directionalPad = wrapper.findComponent({ name: 'DirectionalPad' })

    await directionalPad.vm.$emit('move', { axis: 'x', direction: 1 })

    expect(moveAxisSpy).toHaveBeenCalledWith('x', expect.any(Number))
  })

  it('uses selected step for movement distance', async () => {
    const printerStore = usePrinterStore()
    const moveAxisSpy = vi.spyOn(printerStore, 'moveAxis').mockResolvedValue()

    const wrapper = mount(ControlView)

    // Select 10mm step
    const stepButtons = wrapper.findAll('.step-button')
    const step10Button = stepButtons.find(btn => btn.text().includes('10'))
    await step10Button?.trigger('click')

    // Trigger move
    const directionalPad = wrapper.findComponent({ name: 'DirectionalPad' })
    await directionalPad.vm.$emit('move', { axis: 'x', direction: 1 })

    expect(moveAxisSpy).toHaveBeenCalledWith('x', 10)
  })

  it('renders Home All button', () => {
    const wrapper = mount(ControlView)
    const homeButton = wrapper.findAll('button').find(btn =>
      btn.text().includes('Home All')
    )
    expect(homeButton?.exists()).toBe(true)
  })

  it('calls homeAxes when Home All is clicked', async () => {
    const printerStore = usePrinterStore()
    const homeAxesSpy = vi.spyOn(printerStore, 'homeAxes').mockResolvedValue()

    const wrapper = mount(ControlView)
    const homeButton = wrapper.findAll('button').find(btn =>
      btn.text().includes('Home All')
    )
    await homeButton?.trigger('click')

    expect(homeAxesSpy).toHaveBeenCalledWith(['x', 'y', 'z'])
  })

  it('renders Disable Steppers button', () => {
    const wrapper = mount(ControlView)
    const disableButton = wrapper.findAll('button').find(btn =>
      btn.text().includes('Disable Steppers')
    )
    expect(disableButton?.exists()).toBe(true)
  })

  it('calls disableSteppers when Disable Steppers is clicked', async () => {
    const printerStore = usePrinterStore()
    const disableSteppersSpy = vi.spyOn(printerStore, 'disableSteppers').mockResolvedValue()

    const wrapper = mount(ControlView)
    const disableButton = wrapper.findAll('button').find(btn =>
      btn.text().includes('Disable Steppers')
    )
    await disableButton?.trigger('click')

    expect(disableSteppersSpy).toHaveBeenCalled()
  })

  it('renders Extruder Controls button', () => {
    const wrapper = mount(ControlView)
    const extruderButton = wrapper.findAll('button').find(btn =>
      btn.text().includes('Extruder Controls')
    )
    expect(extruderButton?.exists()).toBe(true)
  })

  it('shows ExtruderControl component', () => {
    const wrapper = mount(ControlView)
    expect(wrapper.findComponent({ name: 'ExtruderControl' }).exists()).toBe(true)
  })

  it('calls extrudeFilament when ExtruderControl emits extrude', async () => {
    const printerStore = usePrinterStore()
    const extrudeSpy = vi.spyOn(printerStore, 'extrudeFilament').mockResolvedValue()

    const wrapper = mount(ControlView)
    const extruderControl = wrapper.findComponent({ name: 'ExtruderControl' })

    await extruderControl.vm.$emit('extrude', 5)

    expect(extrudeSpy).toHaveBeenCalledWith(5)
  })

  it('calls retractFilament when ExtruderControl emits retract', async () => {
    const printerStore = usePrinterStore()
    const retractSpy = vi.spyOn(printerStore, 'retractFilament').mockResolvedValue()

    const wrapper = mount(ControlView)
    const extruderControl = wrapper.findComponent({ name: 'ExtruderControl' })

    await extruderControl.vm.$emit('retract', 10)

    expect(retractSpy).toHaveBeenCalledWith(10)
  })

  it('calls setNozzleTemp when ExtruderControl emits set-temp', async () => {
    const printerStore = usePrinterStore()
    const setTempSpy = vi.spyOn(printerStore, 'setNozzleTemp').mockResolvedValue()

    const wrapper = mount(ControlView)
    const extruderControl = wrapper.findComponent({ name: 'ExtruderControl' })

    await extruderControl.vm.$emit('set-temp', 215)

    expect(setTempSpy).toHaveBeenCalledWith(215)
  })

  describe('Busy overlay', () => {
    it('shows busy overlay when printer status is BUSY', async () => {
      const printerStore = usePrinterStore()
      // Set printer state to BUSY using the enum
      printerStore.status = {
        state: StatusPrinter.state.BUSY,
        temp_nozzle: 0,
        target_nozzle: 0,
        temp_bed: 0,
        target_bed: 0
      } as StatusPrinter

      const wrapper = mount(ControlView)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.busy-overlay').exists()).toBe(true)
    })

    it('hides busy overlay when printer status is IDLE', async () => {
      const printerStore = usePrinterStore()
      // Set printer state to IDLE using the enum
      printerStore.status = {
        state: StatusPrinter.state.IDLE,
        temp_nozzle: 0,
        target_nozzle: 0,
        temp_bed: 0,
        target_bed: 0
      } as StatusPrinter

      const wrapper = mount(ControlView)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.busy-overlay').exists()).toBe(false)
    })

    it('commandInProgress provides immediate feedback for commands', async () => {
      const printerStore = usePrinterStore()
      const homeAxesSpy = vi.spyOn(printerStore, 'homeAxes').mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )

      const wrapper = mount(ControlView)

      // Trigger Home All command
      const homeButton = wrapper.findAll('button').find(btn =>
        btn.text().includes('Home All')
      )
      await homeButton?.trigger('click')

      // commandInProgress should be true immediately
      expect(wrapper.vm.commandInProgress).toBe(true)

      // Wait for command to complete
      await new Promise(resolve => setTimeout(resolve, 150))

      // commandInProgress should be false after command completes
      expect(wrapper.vm.commandInProgress).toBe(false)
    })
  })
})
