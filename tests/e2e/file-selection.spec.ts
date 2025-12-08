import { test, expect } from '@playwright/test'
import { setupMockServer } from './fixtures/mock-server'

test.describe('File Selection Flow', () => {
  test.beforeEach(async ({ page }) => {
    setupMockServer(page)
    await page.goto('/')
  })

  test('selects file from idle state', async ({ page }) => {
    // Click "Select File to Print" button
    await page.locator('text=Select File to Print').click()

    // Should navigate to Files view
    await expect(page.locator('.files-view')).toBeVisible()
    await expect(page.locator('.breadcrumbs')).toContainText('local')
  })

  test('displays file list items', async ({ page }) => {
    await page.goto('/files')

    // Wait for files to load
    await expect(page.locator('.file-list')).toBeVisible()

    // Should show test file
    await expect(page.locator('text=test-print.gcode')).toBeVisible()
  })

  test('shows print confirmation when file clicked', async ({ page }) => {
    await page.goto('/files')

    // Click on a print file
    await page.locator('text=test-print.gcode').click()

    // BottomSheet should appear
    await expect(page.locator('.bottom-sheet')).toBeVisible()
    await expect(page.locator('.bottom-sheet')).toContainText('Print test-print.gcode?')
    await expect(page.locator('text=Start Print')).toBeVisible()
  })

  test('cancels print confirmation', async ({ page }) => {
    await page.goto('/files')
    await page.locator('text=test-print.gcode').click()

    // Click Cancel
    await page.locator('text=Cancel').click()

    // BottomSheet should close
    await expect(page.locator('.bottom-sheet')).not.toBeVisible()

    // Still on Files view
    await expect(page.locator('.files-view')).toBeVisible()
  })

  test('starts print and returns to home', async ({ page }) => {
    // Intercept the print start API call
    await page.route('**/api/v1/files/*/print', (route) => {
      route.fulfill({
        status: 204,
        body: '',
      })
    })

    await page.goto('/files')
    await page.locator('text=test-print.gcode').click()

    // Click Start Print
    await page.locator('text=Start Print').click()

    // Should navigate back to home
    await expect(page.locator('.home-view')).toBeVisible()
  })

  test('back button returns to home from files', async ({ page }) => {
    await page.goto('/files')

    // Click back button
    await page.locator('.files-view .back-btn').click()

    // Should return to home
    await expect(page.locator('.home-view')).toBeVisible()
  })
})
