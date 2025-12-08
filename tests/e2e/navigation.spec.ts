import { test, expect } from '@playwright/test'
import { setupMockServer } from './fixtures/mock-server'

test.describe('Navigation Flow', () => {
  test.beforeEach(async ({ page }) => {
    setupMockServer(page)
    await page.goto('/')
  })

  test('navigates between views using bottom nav', async ({ page }) => {
    // Start at home
    await expect(page.locator('.home-view')).toBeVisible()
    await expect(page.locator('.nav-tab.active')).toContainText('Home')

    // Navigate to Files
    await page.locator('.nav-tab').filter({ hasText: 'Files' }).click()
    await expect(page.locator('.files-view')).toBeVisible()
    await expect(page.locator('.nav-tab.active')).toContainText('Files')

    // Navigate to Settings
    await page.locator('.nav-tab').filter({ hasText: 'Settings' }).click()
    await expect(page.locator('.settings-view')).toBeVisible()
    await expect(page.locator('.nav-tab.active')).toContainText('Settings')

    // Back to Home
    await page.locator('.nav-tab').filter({ hasText: 'Home' }).click()
    await expect(page.locator('.home-view')).toBeVisible()
  })

  test('back button navigates from settings to home', async ({ page }) => {
    // Go to settings
    await page.locator('.nav-tab').filter({ hasText: 'Settings' }).click()
    await expect(page.locator('.settings-view')).toBeVisible()

    // Click back button
    await page.locator('.settings-view .back-btn').click()
    await expect(page.locator('.home-view')).toBeVisible()
  })

  test('top bar settings button navigates to settings', async ({ page }) => {
    await page.locator('.top-bar .settings-btn').click()
    await expect(page.locator('.settings-view')).toBeVisible()
  })

  test('maintains active tab state across navigation', async ({ page }) => {
    // Navigate to Files
    await page.locator('.nav-tab').filter({ hasText: 'Files' }).click()

    // Verify active state styling
    const activeTab = page.locator('.nav-tab.active')
    await expect(activeTab).toContainText('Files')

    // Verify border color (orange)
    const borderColor = await activeTab.evaluate(el =>
      getComputedStyle(el).borderTopColor
    )
    expect(borderColor).toBe('rgb(255, 102, 0)') // --prusa-orange
  })
})
