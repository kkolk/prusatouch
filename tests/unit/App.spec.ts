import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import App from '../../src/App.vue'
import { routes } from '../../src/router'
import ConnectStatusIndicator from '../../src/components/ConnectStatusIndicator.vue'

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

  it('renders kiosk header', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: { plugins: [router] }
    })
    expect(wrapper.find('.kiosk-header').exists()).toBe(true)
  })

  it('renders bottom navigation', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: { plugins: [router] }
    })
    expect(wrapper.find('.kiosk-nav').exists()).toBe(true)
  })

  it('renders three nav tabs', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: { plugins: [router] }
    })
    const tabs = wrapper.findAll('.nav-tab')
    expect(tabs.length).toBe(3)
  })

  it('highlights active tab based on route', async () => {
    router.push('/control')
    await router.isReady()

    const wrapper = mount(App, {
      global: { plugins: [router] }
    })
    const activeTab = wrapper.find('.nav-tab.active')
    expect(activeTab.text()).toContain('Control')
  })

  it('navigates when tab is clicked', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: { plugins: [router] }
    })

    const controlTab = wrapper.findAll('.nav-tab')[1]
    await controlTab.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('control')
  })

  it('renders router-view for content', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: { plugins: [router] }
    })
    expect(wrapper.find('.main-content').exists()).toBe(true)
  })

  describe('kiosk header displays', () => {
    it('displays temperatures on all views', async () => {
      const routes = ['/', '/files', '/control']
      for (const route of routes) {
        router.push(route)
        await router.isReady()
        const wrapper = mount(App, { global: { plugins: [router] } })
        expect(wrapper.find('.kiosk-header').exists()).toBe(true)
        // KioskHeader contains TemperatureDisplay components
        expect(wrapper.findComponent({ name: 'TemperatureDisplay' }).exists()).toBe(true)
      }
    })
  })

  describe('computed values', () => {
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

  describe('KioskHeader Connection Status', () => {
    it('displays green connection dot when printer is connected', async () => {
      const { usePrinterStore } = await import('../../src/stores/printer')
      const printerStore = usePrinterStore()
      printerStore.connection.connected = true

      router.push('/files')
      await router.isReady()
      const wrapper = mount(App, { global: { plugins: [router] } })

      const indicator = wrapper.findComponent(ConnectStatusIndicator)
      expect(indicator.exists()).toBe(true)
      expect(indicator.props('connected')).toBe(true)
      expect(indicator.classes()).toContain('status-connected')
    })

    it('displays red connection dot when printer is disconnected', async () => {
      const { usePrinterStore } = await import('../../src/stores/printer')
      const printerStore = usePrinterStore()
      printerStore.connection.connected = false

      router.push('/files')
      await router.isReady()
      const wrapper = mount(App, { global: { plugins: [router] } })

      const indicator = wrapper.findComponent(ConnectStatusIndicator)
      expect(indicator.exists()).toBe(true)
      expect(indicator.props('connected')).toBe(false)
      expect(indicator.classes()).toContain('status-offline')
    })

    it('displays connection dot with correct aria-label when connected', async () => {
      const { usePrinterStore } = await import('../../src/stores/printer')
      const printerStore = usePrinterStore()
      printerStore.connection.connected = true

      router.push('/files')
      await router.isReady()
      const wrapper = mount(App, { global: { plugins: [router] } })

      const indicator = wrapper.findComponent(ConnectStatusIndicator)
      expect(indicator.props('connected')).toBe(true)
      expect(indicator.attributes('aria-label')).toBe('Connected')
    })

    it('displays connection dot with correct aria-label when offline', async () => {
      const { usePrinterStore } = await import('../../src/stores/printer')
      const printerStore = usePrinterStore()
      printerStore.connection.connected = false

      router.push('/files')
      await router.isReady()
      const wrapper = mount(App, { global: { plugins: [router] } })

      const indicator = wrapper.findComponent(ConnectStatusIndicator)
      expect(indicator.props('connected')).toBe(false)
      expect(indicator.attributes('aria-label')).toBe('Offline')
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
