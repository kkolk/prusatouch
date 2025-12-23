import { test, expect } from '@playwright/test'

test.describe('Status Screen', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:5173')

    // Mock printer status as PRINTING
    await page.route('**/api/v1/status', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          state: 'PRINTING',
          temp_nozzle: 215,
          target_nozzle: 220,
          temp_bed: 60,
          target_bed: 60,
          speed: 100
        })
      })
    })

    // Mock current job
    await page.route('**/api/v1/job', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          state: 'PRINTING',
          progress: 0.45,
          time_remaining: 3600,
          time_printing: 2700,
          file: {
            name: 'test_print.gcode',
            display_name: 'Test Print',
            path: '/test_print.gcode',
            m_timestamp: Date.now()
          }
        })
      })
    })
  })

  test('displays status screen when printing', async ({ page }) => {
    const statusScreen = page.locator('.status-screen')
    await expect(statusScreen).toBeVisible()
  })

  test('displays progress ring with percentage', async ({ page }) => {
    const progressText = page.locator('.progress-text')
    await expect(progressText).toBeVisible()
    // Progress should be 45% from mock data
    await expect(progressText).toContainText('45%')
  })

  test('displays thumbnail preview area', async ({ page }) => {
    const thumbnail = page.locator('.thumbnail-preview')
    await expect(thumbnail).toBeVisible()
  })

  test('displays file name in metadata', async ({ page }) => {
    const fileName = page.locator('.file-name')
    await expect(fileName).toBeVisible()
    await expect(fileName).toContainText('Test Print')
  })

  test('displays time remaining', async ({ page }) => {
    const timeRemaining = page.locator('.time-remaining')
    await expect(timeRemaining).toBeVisible()
    // Should contain clock emoji
    await expect(timeRemaining).toContainText('⏱')
  })

  test('tapping status screen opens control overlay', async ({ page }) => {
    await page.click('.status-screen')

    // Wait for control sheet to appear
    const controlSheet = page.locator('.control-sheet-content')
    await expect(controlSheet).toBeVisible()
  })

  test('control sheet contains pause button when printing', async ({ page }) => {
    await page.click('.status-screen')

    const pauseButton = page.locator('button:has-text("Pause Print")')
    await expect(pauseButton).toBeVisible()
  })

  test('control sheet contains cancel button', async ({ page }) => {
    await page.click('.status-screen')

    const cancelButton = page.locator('button:has-text("Cancel Print")')
    await expect(cancelButton).toBeVisible()
  })

  test('cancel button shows confirmation dialog', async ({ page }) => {
    await page.click('.status-screen')
    await page.click('button:has-text("Cancel Print")')

    // ConfirmDialog should appear with warning message
    const confirmText = page.locator('text=cannot be undone')
    await expect(confirmText).toBeVisible()
  })

  test('temperature controls display current and target temps', async ({ page }) => {
    await page.click('.status-screen')

    // Nozzle temp should display
    const nozzleTemp = page.locator('text=215° / 220°')
    await expect(nozzleTemp).toBeVisible()

    // Bed temp should display
    const bedTemp = page.locator('text=60° / 60°')
    await expect(bedTemp).toBeVisible()
  })

  test('nozzle temperature adjustment buttons work', async ({ page }) => {
    await page.click('.status-screen')

    // Find the first temp control row (nozzle)
    const nozzleRow = page.locator('.temp-control-row').first()

    // Should have minus and plus buttons
    const minusButton = nozzleRow.locator('button:has-text("-5")')
    const plusButton = nozzleRow.locator('button:has-text("+5")')

    await expect(minusButton).toBeVisible()
    await expect(plusButton).toBeVisible()
  })

  test('paused state displays correctly', async ({ page }) => {
    // Mock PAUSED state
    await page.route('**/api/v1/status', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          state: 'PAUSED',
          temp_nozzle: 215,
          target_nozzle: 220,
          temp_bed: 60,
          target_bed: 60
        })
      })
    })

    await page.reload()

    // Status badge should show paused
    const badge = page.locator('.status-badge')
    await expect(badge).toBeVisible()

    // Progress ring should have frozen class
    const ring = page.locator('svg.frozen')
    await expect(ring).toBeVisible()
  })

  test('error state freezes progress ring', async ({ page }) => {
    // Mock ERROR state
    await page.route('**/api/v1/status', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          state: 'ERROR',
          temp_nozzle: 0,
          target_nozzle: 0,
          temp_bed: 0,
          target_bed: 0
        })
      })
    })

    await page.reload()

    // Progress ring should have frozen class
    const ring = page.locator('svg.frozen')
    await expect(ring).toBeVisible()

    // Status screen should still be accessible
    const statusScreen = page.locator('.status-screen')
    await expect(statusScreen).toBeVisible()
  })

  test('controls remain accessible in error state', async ({ page }) => {
    // Mock ERROR state
    await page.route('**/api/v1/status', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          state: 'ERROR',
          temp_nozzle: 0,
          target_nozzle: 0,
          temp_bed: 0,
          target_bed: 0
        })
      })
    })

    await page.reload()

    // Should still be able to open control sheet
    await page.click('.status-screen')
    const controlSheet = page.locator('.control-sheet-content')
    await expect(controlSheet).toBeVisible()
  })

  test('layout is responsive for 800x480 display', async ({ page }) => {
    // Set viewport to HyperPixel 4 dimensions
    await page.setViewportSize({ width: 800, height: 480 })

    // Status screen should still be visible and properly laid out
    const statusScreen = page.locator('.status-screen')
    await expect(statusScreen).toBeVisible()

    // Both columns should be visible
    const progressColumn = page.locator('.progress-column')
    const metadataColumn = page.locator('.metadata-column')

    await expect(progressColumn).toBeVisible()
    await expect(metadataColumn).toBeVisible()
  })
})
