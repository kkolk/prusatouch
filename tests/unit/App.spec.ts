import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import App from '../../src/App.vue'
import { routes } from '../../src/router'

describe('App', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createMemoryHistory(),
      routes
    })
  })

  it('renders app container', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: { plugins: [router] }
    })
    expect(wrapper.find('.app').exists()).toBe(true)
  })

  it('renders top bar', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: { plugins: [router] }
    })
    expect(wrapper.find('.top-bar').exists()).toBe(true)
  })

  it('renders bottom navigation', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: { plugins: [router] }
    })
    expect(wrapper.find('.bottom-nav').exists()).toBe(true)
  })

  it('renders four nav tabs', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: { plugins: [router] }
    })
    const tabs = wrapper.findAll('.nav-tab')
    expect(tabs.length).toBe(4)
  })

  it('highlights active tab based on route', async () => {
    router.push('/files')
    await router.isReady()

    const wrapper = mount(App, {
      global: { plugins: [router] }
    })
    const activeTab = wrapper.find('.nav-tab.active')
    expect(activeTab.text()).toContain('Files')
  })

  it('navigates when tab is clicked', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: { plugins: [router] }
    })

    const filesTab = wrapper.findAll('.nav-tab')[1]
    await filesTab.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('files')
  })

  it('renders router-view for content', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: { plugins: [router] }
    })
    expect(wrapper.find('.main-content').exists()).toBe(true)
  })

  describe('top bar displays', () => {
    it('displays position on control view', async () => {
      router.push('/control')
      await router.isReady()
      const wrapper = mount(App, { global: { plugins: [router] } })
      expect(wrapper.find('.position-compact').exists()).toBe(true)
      expect(wrapper.find('.temps-compact').exists()).toBe(false)
    })

    it('displays temperatures on home view', async () => {
      router.push('/')
      await router.isReady()
      const wrapper = mount(App, { global: { plugins: [router] } })
      expect(wrapper.find('.temps-compact').exists()).toBe(true)
      expect(wrapper.find('.position-compact').exists()).toBe(false)
    })

    it('displays neither position nor temps on files view', async () => {
      router.push('/files')
      await router.isReady()
      const wrapper = mount(App, { global: { plugins: [router] } })
      expect(wrapper.find('.position-compact').exists()).toBe(false)
      expect(wrapper.find('.temps-compact').exists()).toBe(false)
    })

    it('displays neither position nor temps on settings view', async () => {
      router.push('/settings')
      await router.isReady()
      const wrapper = mount(App, { global: { plugins: [router] } })
      expect(wrapper.find('.position-compact').exists()).toBe(false)
      expect(wrapper.find('.temps-compact').exists()).toBe(false)
    })
  })

  describe('computed values', () => {
    it('calculates position from printerStore', async () => {
      router.push('/control')
      await router.isReady()
      const wrapper = mount(App, { global: { plugins: [router] } })
      const vm = wrapper.vm as any

      // Default values when no status
      expect(vm.position).toEqual({ x: 0, y: 0, z: 0 })
    })

    it('calculates nozzle temperature from printerStore', async () => {
      router.push('/')
      await router.isReady()
      const wrapper = mount(App, { global: { plugins: [router] } })
      const vm = wrapper.vm as any

      // Default values when no status
      expect(vm.nozzleTemp).toEqual({ current: 0, target: 0 })
    })

    it('calculates bed temperature from printerStore', async () => {
      router.push('/')
      await router.isReady()
      const wrapper = mount(App, { global: { plugins: [router] } })
      const vm = wrapper.vm as any

      // Default values when no status
      expect(vm.bedTemp).toEqual({ current: 0, target: 0 })
    })

    it('rounds temperature values to nearest integer', async () => {
      const { usePrinterStore } = await import('../../src/stores/printer')
      const printerStore = usePrinterStore()

      // Set printer status with decimal temperatures
      printerStore.status = {
        temp_nozzle: 215.7,
        target_nozzle: 220.3,
        temp_bed: 59.8,
        target_bed: 60.2,
        axis_x: 0,
        axis_y: 0,
        axis_z: 0
      } as any

      router.push('/')
      await router.isReady()
      const wrapper = mount(App, { global: { plugins: [router] } })
      const vm = wrapper.vm as any

      expect(vm.nozzleTemp).toEqual({ current: 216, target: 220 })
      expect(vm.bedTemp).toEqual({ current: 60, target: 60 })
    })

    it('formats position values to 1 decimal place', async () => {
      const { usePrinterStore } = await import('../../src/stores/printer')
      const printerStore = usePrinterStore()

      // Set printer status with precise position values
      printerStore.status = {
        axis_x: 123.456,
        axis_y: 78.912,
        axis_z: 5.678,
        temp_nozzle: 0,
        target_nozzle: 0,
        temp_bed: 0,
        target_bed: 0
      } as any

      router.push('/control')
      await router.isReady()
      const wrapper = mount(App, { global: { plugins: [router] } })

      const posValues = wrapper.findAll('.pos-value')
      expect(posValues[0].text()).toBe('123.5')
      expect(posValues[1].text()).toBe('78.9')
      expect(posValues[2].text()).toBe('5.7')
    })
  })

  describe('Printer Info Fetching', () => {
    it('should fetch printer info and version on mount', async () => {
      const { usePrinterStore } = await import('../../src/stores/printer')
      const printerStore = usePrinterStore()
      const fetchPrinterInfoSpy = vi.spyOn(printerStore, 'fetchPrinterInfo')
      const fetchVersionSpy = vi.spyOn(printerStore, 'fetchVersion')

      const newWrapper = mount(App, {
        global: {
          plugins: [router],
          stubs: {
            RouterView: true,
            OfflineBanner: true,
            Toast: true
          }
        }
      })

      await newWrapper.vm.$nextTick()

      expect(fetchPrinterInfoSpy).toHaveBeenCalledOnce()
      expect(fetchVersionSpy).toHaveBeenCalledOnce()
    })
  })

  describe('Status Indicator', () => {
    it('shows status indicator on files view', async () => {
      router.push('/files')
      await router.isReady()
      const wrapper = mount(App, { global: { plugins: [router] } })
      expect(wrapper.find('.status-indicator').exists()).toBe(true)
      expect(wrapper.find('.top-bar-center').exists()).toBe(true)
    })

    it('shows status indicator on settings view', async () => {
      router.push('/settings')
      await router.isReady()
      const wrapper = mount(App, { global: { plugins: [router] } })
      expect(wrapper.find('.status-indicator').exists()).toBe(true)
      expect(wrapper.find('.top-bar-center').exists()).toBe(true)
    })

    it('does NOT show status indicator on home view', async () => {
      router.push('/')
      await router.isReady()
      const wrapper = mount(App, { global: { plugins: [router] } })
      expect(wrapper.find('.status-indicator').exists()).toBe(false)
      // top-bar-center exists with temps-compact inside
      expect(wrapper.find('.top-bar-center').exists()).toBe(true)
      expect(wrapper.find('.temps-compact').exists()).toBe(true)
    })

    it('does NOT show status indicator on control view', async () => {
      router.push('/control')
      await router.isReady()
      const wrapper = mount(App, { global: { plugins: [router] } })
      expect(wrapper.find('.status-indicator').exists()).toBe(false)
      // top-bar-center exists with position-compact inside
      expect(wrapper.find('.top-bar-center').exists()).toBe(true)
      expect(wrapper.find('.position-compact').exists()).toBe(true)
    })

    it('displays green connection dot when printer is connected', async () => {
      const { usePrinterStore } = await import('../../src/stores/printer')
      const printerStore = usePrinterStore()
      printerStore.connection.connected = true

      router.push('/files')
      await router.isReady()
      const wrapper = mount(App, { global: { plugins: [router] } })

      const dot = wrapper.find('.connection-dot')
      expect(dot.exists()).toBe(true)
      expect(dot.classes()).toContain('connected')
    })

    it('displays red connection dot when printer is disconnected', async () => {
      const { usePrinterStore } = await import('../../src/stores/printer')
      const printerStore = usePrinterStore()
      printerStore.connection.connected = false

      router.push('/files')
      await router.isReady()
      const wrapper = mount(App, { global: { plugins: [router] } })

      const dot = wrapper.find('.connection-dot')
      expect(dot.exists()).toBe(true)
      expect(dot.classes()).not.toContain('connected')
    })

    it('displays user-friendly state text for PRINTING', async () => {
      const { usePrinterStore } = await import('../../src/stores/printer')
      const printerStore = usePrinterStore()
      printerStore.status = { state: 'PRINTING' } as any

      router.push('/files')
      await router.isReady()
      const wrapper = mount(App, { global: { plugins: [router] } })

      const statusText = wrapper.find('.status-text')
      expect(statusText.text()).toBe('Printing')
    })

    it('displays user-friendly state text for IDLE', async () => {
      const { usePrinterStore } = await import('../../src/stores/printer')
      const printerStore = usePrinterStore()
      printerStore.status = { state: 'IDLE' } as any

      router.push('/files')
      await router.isReady()
      const wrapper = mount(App, { global: { plugins: [router] } })

      const statusText = wrapper.find('.status-text')
      expect(statusText.text()).toBe('Idle')
    })

    it('displays "Offline" when printer is disconnected', async () => {
      const { usePrinterStore } = await import('../../src/stores/printer')
      const printerStore = usePrinterStore()
      printerStore.status = null
      printerStore.connection.connected = false

      router.push('/files')
      await router.isReady()
      const wrapper = mount(App, { global: { plugins: [router] } })

      const statusText = wrapper.find('.status-text')
      expect(statusText.text()).toBe('Offline')
    })

    it('displays connection dot with correct aria-label when connected', async () => {
      const { usePrinterStore } = await import('../../src/stores/printer')
      const printerStore = usePrinterStore()
      printerStore.connection.connected = true

      router.push('/files')
      await router.isReady()
      const wrapper = mount(App, { global: { plugins: [router] } })

      const dot = wrapper.find('.connection-dot')
      expect(dot.attributes('aria-label')).toBe('Connected')
    })

    it('displays connection dot with correct aria-label when offline', async () => {
      const { usePrinterStore } = await import('../../src/stores/printer')
      const printerStore = usePrinterStore()
      printerStore.connection.connected = false

      router.push('/files')
      await router.isReady()
      const wrapper = mount(App, { global: { plugins: [router] } })

      const dot = wrapper.find('.connection-dot')
      expect(dot.attributes('aria-label')).toBe('Offline')
    })
  })

  describe('Debug Button Removal', () => {
    it('does NOT render debug button', async () => {
      router.push('/')
      await router.isReady()
      const wrapper = mount(App, { global: { plugins: [router] } })

      // Check that there's only one settings button (the gear icon)
      const settingsBtns = wrapper.findAll('.settings-btn')
      expect(settingsBtns.length).toBe(1)

      // Verify it's the settings icon, not debug
      const icon = wrapper.find('.settings-icon')
      expect(icon.text()).toBe('⚙️')
    })

    it('goToDebug function does not exist', async () => {
      router.push('/')
      await router.isReady()
      const wrapper = mount(App, { global: { plugins: [router] } })
      const vm = wrapper.vm as any

      expect(typeof vm.goToDebug).toBe('undefined')
    })
  })
})
