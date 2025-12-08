import { Page, Route } from '@playwright/test'

export const mockPrusaLinkResponses = {
  status: {
    printer: {
      state: 'IDLE',
      temp_nozzle: 25.0,
      target_nozzle: 0.0,
      temp_bed: 22.0,
      target_bed: 0.0,
    },
  },

  job: {
    state: 'IDLE',
    progress: 0,
    time_remaining: 0,
    file: null,
  },

  files: {
    files: [
      {
        name: 'test-print.gcode',
        type: 'PRINT_FILE',
        size: 1024000,
        m_timestamp: Date.now(),
      },
    ],
    free: 1000000000,
  },
}

export function setupMockServer(page: Page) {
  // Intercept API calls and return mock data
  page.route('**/api/v1/status', (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockPrusaLinkResponses.status),
    })
  })

  page.route('**/api/v1/job', (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockPrusaLinkResponses.job),
    })
  })

  page.route('**/api/v1/files/**', (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockPrusaLinkResponses.files),
    })
  })
}
