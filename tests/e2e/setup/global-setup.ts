import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('Starting E2E test environment...')

  // Verify dev server is responsive
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    await page.goto(config.use?.baseURL || 'http://localhost:5173', {
      waitUntil: 'networkidle',
      timeout: 30000,
    })
    console.log('Dev server ready')
  } catch (error) {
    console.error('Failed to connect to dev server:', error)
    throw error
  } finally {
    await browser.close()
  }
}

export default globalSetup
