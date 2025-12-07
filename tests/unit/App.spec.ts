import { describe, it, expect, beforeEach } from 'vitest'
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
})
