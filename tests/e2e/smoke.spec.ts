import { test, expect } from '@playwright/test'

/**
 * Smoke test - verifies the Playwright setup is working
 *
 * NOTE: On WSL, you may need to install system dependencies:
 * sudo npx playwright install-deps chromium
 *
 * Or install manually:
 * sudo apt-get update
 * sudo apt-get install -y libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 \
 *   libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \
 *   libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2
 */
test('smoke test - app loads', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.app')).toBeVisible()
})
