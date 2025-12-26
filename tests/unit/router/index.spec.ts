import { describe, it, expect, beforeEach } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { routes } from '../../../src/router'

describe('Router', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    router = createRouter({
      history: createMemoryHistory(),
      routes
    })
  })

  it('exports routes array', () => {
    expect(routes).toBeDefined()
    expect(Array.isArray(routes)).toBe(true)
  })

  it('has status route', () => {
    const statusRoute = routes.find(r => r.path === '/status')
    expect(statusRoute).toBeDefined()
    expect(statusRoute?.name).toBe('status')
  })

  it('has files route', () => {
    const filesRoute = routes.find(r => r.path === '/files')
    expect(filesRoute).toBeDefined()
    expect(filesRoute?.name).toBe('files')
  })

  it('has settings route', () => {
    const settingsRoute = routes.find(r => r.path === '/settings')
    expect(settingsRoute).toBeDefined()
    expect(settingsRoute?.name).toBe('settings')
  })

  it('navigates to status by default', async () => {
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('status')
  })

  it('navigates to files route', async () => {
    await router.push('/files')
    expect(router.currentRoute.value.name).toBe('files')
  })

  it('navigates to settings route', async () => {
    await router.push('/settings')
    expect(router.currentRoute.value.name).toBe('settings')
  })

  it('redirects unknown routes to status', async () => {
    await router.push('/unknown-route')
    expect(router.currentRoute.value.name).toBe('status')
  })
})
