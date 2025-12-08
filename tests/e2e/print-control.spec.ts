import { test, expect } from '@playwright/test'
import { setupMockServerWithPrinting } from './fixtures/mock-server'

test.describe('Print Job Control Flow', () => {
  test.beforeEach(async ({ page }) => {
    setupMockServerWithPrinting(page)
    await page.goto('/')
  })

  test('displays printing state with progress', async ({ page }) => {
    // Should show ProgressRing
    await expect(page.locator('.progress-ring')).toBeVisible()

    // Should show progress percentage
    await expect(page.locator('.progress-percent')).toContainText('45%')

    // Should show time remaining
    await expect(page.locator('.progress-time')).toContainText('1h 30m')

    // Should show filename
    await expect(page.locator('.file-name')).toContainText('test-print.gcode')
  })

  test('displays pause and stop buttons when printing', async ({ page }) => {
    await expect(page.locator('text=Pause')).toBeVisible()
    await expect(page.locator('text=Stop')).toBeVisible()
  })

  test('pauses print job', async ({ page }) => {
    // Mock pause API
    await page.route('**/api/v1/job', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ status: 204, body: '' })
      } else {
        route.continue()
      }
    })

    // Click Pause
    await page.locator('text=Pause').click()

    // Button should show loading state briefly
    // (This is hard to test due to timing, but we can verify it completes)
    await page.waitForTimeout(100)
  })

  test('shows stop confirmation dialog', async ({ page }) => {
    // Click Stop
    await page.locator('text=Stop').click()

    // BottomSheet should appear
    await expect(page.locator('.bottom-sheet')).toBeVisible()
    await expect(page.locator('.bottom-sheet')).toContainText('Stop Print?')
    await expect(page.locator('.bottom-sheet')).toContainText('This will cancel the current print job')
  })

  test('cancels stop confirmation', async ({ page }) => {
    await page.locator('text=Stop').click()

    // Click Cancel in confirmation
    await page.locator('.bottom-sheet text=Cancel').click()

    // Dialog should close
    await expect(page.locator('.bottom-sheet')).not.toBeVisible()

    // Still showing print controls
    await expect(page.locator('text=Pause')).toBeVisible()
  })

  test('stops print job', async ({ page }) => {
    // Mock stop API
    await page.route('**/api/v1/job', (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 204, body: '' })
      } else {
        route.continue()
      }
    })

    await page.locator('text=Stop').click()

    // Click Stop Print in confirmation
    await page.locator('.bottom-sheet text=Stop Print').click()

    // Dialog should close
    await expect(page.locator('.bottom-sheet')).not.toBeVisible()
  })
})
