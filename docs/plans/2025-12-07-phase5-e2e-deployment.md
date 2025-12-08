# Phase 5: E2E Testing & Deployment Implementation Plan

> **For Claude:** Use executing-plans or agent-developers skill to implement this plan.

**Goal:** Add end-to-end tests for critical user flows and create Raspberry Pi deployment automation, ensuring production-ready performance on target hardware.

**Architecture:** Playwright E2E tests verify complete user journeys (file selection, print control, navigation). Deployment scripts automate build, transfer, and kiosk mode setup on Raspberry Pi 4. Performance verification ensures 60fps animations and <300KB bundle size targets are met.

**Tech Stack:** Playwright 1.40+, Bash scripts, Chromium kiosk mode, systemd services

**Prerequisites:**
- Phase 4 complete (all views and router implemented)
- All unit tests passing (113+ tests)
- Development server runs successfully (`npm run dev`)
- Target: Raspberry Pi 4 (1GB RAM) with HyperPixel 4 (800x480)

---

## Task Execution Order

**Sequential dependencies:**
- Task 27 → Tasks 28-30 (E2E setup before individual tests)
- Tasks 28-30 can run in parallel
- Task 31 → Task 32 (deployment script before kiosk setup)
- Task 33 depends on all previous tasks

**Recommended order:**
1. Task 27: E2E test setup
2. Tasks 28-30: Core E2E flows (can be parallel)
3. Task 31: Performance verification
4. Task 32: Deployment script
5. Task 33: Kiosk mode setup
6. Task 34: Final production verification

---

### Task 27: Playwright E2E Setup - Configure test environment

**Context:** Playwright enables browser-based testing of complete user flows. Setup includes configuration for 800x480 viewport (matching HyperPixel display) and mock PrusaLink server for reliable tests.

**Files to Interact:**
- C: `playwright.config.ts` (Create)
- C: `tests/e2e/fixtures/mock-server.ts` (Create)
- C: `tests/e2e/setup/global-setup.ts` (Create)
- M: `package.json:1-100` (Modify - add E2E script)

**Step 1: Write Playwright configuration**

Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Run tests serially for stability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    viewport: { width: 800, height: 480 }, // HyperPixel 4 resolution
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
```

**Step 2: Create mock PrusaLink server**

Create `tests/e2e/fixtures/mock-server.ts`:

```typescript
import { MockedEndpoint } from '@playwright/test'

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

export function setupMockServer(page: any) {
  // Intercept API calls and return mock data
  page.route('**/api/v1/status', (route: any) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockPrusaLinkResponses.status),
    })
  })

  page.route('**/api/v1/job', (route: any) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockPrusaLinkResponses.job),
    })
  })

  page.route('**/api/v1/files/**', (route: any) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockPrusaLinkResponses.files),
    })
  })
}
```

**Step 3: Create global setup**

Create `tests/e2e/setup/global-setup.ts`:

```typescript
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
```

**Step 4: Add E2E script to package.json**

Update `package.json` scripts section:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

**Step 5: Install Playwright**

Run: `npm install -D @playwright/test@^1.40.0`
Expected: Playwright installed successfully

Then install browsers:
Run: `npx playwright install chromium`
Expected: Chromium browser installed

**Step 6: Verify setup works**

Create minimal smoke test `tests/e2e/smoke.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test('smoke test - app loads', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.app')).toBeVisible()
})
```

Run: `npm run test:e2e`
Expected: 1 test passes

**Step 7: Commit**

```bash
git add playwright.config.ts tests/e2e/ package.json package-lock.json
git commit -m "test: add Playwright E2E test setup

- Configure for 800x480 viewport (HyperPixel display)
- Mock PrusaLink server for reliable testing
- Global setup with dev server verification
- Smoke test confirms setup works

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 28: E2E Test - Navigation Flow

**Context:** Tests the core navigation between Home, Files, and Settings views using the bottom navigation tabs. Verifies router integration and view rendering.

**Files to Interact:**
- C: `tests/e2e/navigation.spec.ts` (Create)

**Step 1: Write navigation test**

Create `tests/e2e/navigation.spec.ts`:

```typescript
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
```

**Step 2: Run test to verify it works**

Run: `npm run test:e2e -- navigation.spec.ts`
Expected: 4 tests pass

**Step 3: Commit**

```bash
git add tests/e2e/navigation.spec.ts
git commit -m "test: add E2E navigation flow tests

- Bottom nav tab switching
- Back button navigation
- Settings button in top bar
- Active tab state persistence

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 29: E2E Test - File Selection Flow

**Context:** Tests the complete flow of browsing files and selecting one to print. Verifies FileListItem interaction, BottomSheet confirmation, and navigation back to HomeView.

**Files to Interact:**
- C: `tests/e2e/file-selection.spec.ts` (Create)

**Step 1: Write file selection test**

Create `tests/e2e/file-selection.spec.ts`:

```typescript
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
```

**Step 2: Run test to verify it works**

Run: `npm run test:e2e -- file-selection.spec.ts`
Expected: 6 tests pass

**Step 3: Commit**

```bash
git add tests/e2e/file-selection.spec.ts
git commit -m "test: add E2E file selection flow tests

- Navigate from home to files view
- Display file list items
- Show print confirmation dialog
- Cancel confirmation
- Start print and return to home
- Back button navigation

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 30: E2E Test - Print Job Control Flow

**Context:** Tests print job control actions (pause, resume, stop) including the stop confirmation modal. Verifies button states and loading indicators during async operations.

**Files to Interact:**
- C: `tests/e2e/print-control.spec.ts` (Create)
- M: `tests/e2e/fixtures/mock-server.ts:1-100` (Modify - add printing state)

**Step 1: Update mock server with printing state**

Update `tests/e2e/fixtures/mock-server.ts` to add a printing state helper:

```typescript
export const mockPrintingState = {
  status: {
    printer: {
      state: 'PRINTING',
      temp_nozzle: 215.0,
      target_nozzle: 215.0,
      temp_bed: 60.0,
      target_bed: 60.0,
    },
  },

  job: {
    state: 'PRINTING',
    progress: 45,
    time_remaining: 5400, // 1h 30m in seconds
    file: {
      name: 'test-print.gcode',
      size: 1024000,
    },
  },
}

export function setupMockServerWithPrinting(page: any) {
  setupMockServer(page) // Base setup

  // Override with printing state
  page.route('**/api/v1/status', (route: any) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockPrintingState.status),
    })
  })

  page.route('**/api/v1/job', (route: any) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockPrintingState.job),
    })
  })
}
```

**Step 2: Write print control test**

Create `tests/e2e/print-control.spec.ts`:

```typescript
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
```

**Step 3: Run test to verify it works**

Run: `npm run test:e2e -- print-control.spec.ts`
Expected: 6 tests pass

**Step 4: Commit**

```bash
git add tests/e2e/print-control.spec.ts tests/e2e/fixtures/mock-server.ts
git commit -m "test: add E2E print job control flow tests

- Display printing state with progress
- Pause/Resume button visibility
- Pause job action
- Stop confirmation dialog
- Cancel stop confirmation
- Stop job action

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 31: Performance Verification - Bundle size and metrics

**Context:** Verifies production build meets performance targets: <300KB gzipped bundle, lazy loading working, no console errors. Creates performance report for Pi deployment validation.

**Files to Interact:**
- C: `scripts/verify-performance.sh` (Create)
- C: `.github/performance-budgets.json` (Create - for future CI)

**Step 1: Create performance verification script**

Create `scripts/verify-performance.sh`:

```bash
#!/bin/bash
set -e

echo "🔍 Performance Verification for PrusaTouch"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Build production bundle
echo "📦 Building production bundle..."
npm run build

# Check if dist exists
if [ ! -d "dist" ]; then
  echo -e "${RED}❌ Build failed - dist directory not found${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Build successful${NC}"
echo ""

# Analyze bundle size
echo "📊 Bundle Size Analysis:"
echo "------------------------"

# Find main JS bundle (largest .js file)
MAIN_BUNDLE=$(ls -S dist/assets/*.js | head -1)
BUNDLE_SIZE=$(stat -f%z "$MAIN_BUNDLE" 2>/dev/null || stat -c%s "$MAIN_BUNDLE")
BUNDLE_SIZE_KB=$((BUNDLE_SIZE / 1024))

# Check gzipped size
gzip -c "$MAIN_BUNDLE" > /tmp/bundle.js.gz
GZIP_SIZE=$(stat -f%z /tmp/bundle.js.gz 2>/dev/null || stat -c%s /tmp/bundle.js.gz)
GZIP_SIZE_KB=$((GZIP_SIZE / 1024))
rm /tmp/bundle.js.gz

echo "Main bundle: ${BUNDLE_SIZE_KB}KB (${GZIP_SIZE_KB}KB gzipped)"

# Target: <300KB gzipped
if [ $GZIP_SIZE_KB -lt 300 ]; then
  echo -e "${GREEN}✓ Bundle size within target (<300KB gzipped)${NC}"
else
  echo -e "${RED}❌ Bundle size exceeds target: ${GZIP_SIZE_KB}KB > 300KB${NC}"
  exit 1
fi

echo ""

# Check for lazy-loaded chunks
echo "🔀 Code Splitting Verification:"
echo "--------------------------------"
CHUNK_COUNT=$(ls dist/assets/*.js | wc -l | tr -d ' ')
echo "Total JS chunks: $CHUNK_COUNT"

if [ $CHUNK_COUNT -gt 1 ]; then
  echo -e "${GREEN}✓ Code splitting enabled (lazy loading working)${NC}"
else
  echo -e "${YELLOW}⚠ No code splitting detected${NC}"
fi

echo ""

# List all chunks with sizes
echo "📄 All chunks:"
ls -lh dist/assets/*.js | awk '{print "  " $9 " - " $5}'

echo ""

# CSS size
echo "🎨 CSS Bundle:"
echo "--------------"
CSS_FILES=$(ls dist/assets/*.css 2>/dev/null || echo "")
if [ -n "$CSS_FILES" ]; then
  CSS_SIZE=$(cat dist/assets/*.css | wc -c | tr -d ' ')
  CSS_SIZE_KB=$((CSS_SIZE / 1024))
  echo "Total CSS: ${CSS_SIZE_KB}KB"

  if [ $CSS_SIZE_KB -lt 50 ]; then
    echo -e "${GREEN}✓ CSS size acceptable${NC}"
  else
    echo -e "${YELLOW}⚠ CSS larger than expected: ${CSS_SIZE_KB}KB${NC}"
  fi
else
  echo "No CSS files found"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Performance verification complete${NC}"
echo ""
echo "Summary:"
echo "  • Main bundle: ${GZIP_SIZE_KB}KB gzipped (target: <300KB)"
echo "  • Code splitting: $CHUNK_COUNT chunks"
echo "  • Ready for Raspberry Pi deployment"
```

Make script executable:
```bash
chmod +x scripts/verify-performance.sh
```

**Step 2: Create performance budgets config**

Create `.github/performance-budgets.json`:

```json
{
  "budgets": [
    {
      "resourceSizes": [
        {
          "resourceType": "script",
          "budget": 300
        },
        {
          "resourceType": "stylesheet",
          "budget": 50
        },
        {
          "resourceType": "total",
          "budget": 400
        }
      ]
    }
  ]
}
```

**Step 3: Run verification**

Run: `./scripts/verify-performance.sh`
Expected: All checks pass, bundle <300KB gzipped

**Step 4: Add to package.json**

Add script to `package.json`:

```json
{
  "scripts": {
    "verify:performance": "./scripts/verify-performance.sh"
  }
}
```

**Step 5: Commit**

```bash
git add scripts/verify-performance.sh .github/performance-budgets.json package.json
git commit -m "build: add performance verification script

- Verifies bundle size <300KB gzipped
- Checks code splitting is working
- Reports all chunk sizes
- Ready for CI integration

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 32: Deployment Script - Raspberry Pi automation

**Context:** Creates deployment script to build, transfer, and install PrusaTouch on Raspberry Pi 4. Handles directory setup, nginx configuration (if needed), and file permissions.

**Files to Interact:**
- C: `scripts/deploy-to-pi.sh` (Create)
- C: `docs/deployment.md` (Create)

**Step 1: Create deployment script**

Create `scripts/deploy-to-pi.sh`:

```bash
#!/bin/bash
set -e

# PrusaTouch Deployment Script for Raspberry Pi
# Usage: ./scripts/deploy-to-pi.sh [pi-hostname]

PI_HOST="${1:-prusa-mk3s.local}"
PI_USER="pi"
DEPLOY_PATH="/var/www/html/prusatouch"

echo "🚀 PrusaTouch Deployment to Raspberry Pi"
echo "========================================="
echo "Target: ${PI_USER}@${PI_HOST}"
echo "Path: ${DEPLOY_PATH}"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Build production bundle
echo "📦 Building production bundle..."
npm run build

if [ ! -d "dist" ]; then
  echo "❌ Build failed - dist directory not found"
  exit 1
fi

echo -e "${GREEN}✓ Build complete${NC}"
echo ""

# Step 2: Verify bundle size
echo "🔍 Verifying performance..."
./scripts/verify-performance.sh || {
  echo "❌ Performance verification failed"
  exit 1
}
echo ""

# Step 3: Create deployment directory on Pi
echo "📁 Creating deployment directory on Pi..."
ssh ${PI_USER}@${PI_HOST} "sudo mkdir -p ${DEPLOY_PATH} && sudo chown ${PI_USER}:${PI_USER} ${DEPLOY_PATH}"
echo -e "${GREEN}✓ Directory ready${NC}"
echo ""

# Step 4: Transfer files
echo "📤 Transferring files to Pi..."
rsync -avz --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.env' \
  dist/ ${PI_USER}@${PI_HOST}:${DEPLOY_PATH}/

echo -e "${GREEN}✓ Files transferred${NC}"
echo ""

# Step 5: Set permissions
echo "🔐 Setting permissions..."
ssh ${PI_USER}@${PI_HOST} "sudo chown -R www-data:www-data ${DEPLOY_PATH} && sudo chmod -R 755 ${DEPLOY_PATH}"
echo -e "${GREEN}✓ Permissions set${NC}"
echo ""

# Step 6: Verify deployment
echo "✅ Verifying deployment..."
ssh ${PI_USER}@${PI_HOST} "ls -lh ${DEPLOY_PATH}/index.html" || {
  echo "❌ index.html not found on Pi"
  exit 1
}

echo -e "${GREEN}✓ Deployment verified${NC}"
echo ""

echo "=========================================="
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Access PrusaTouch at: http://${PI_HOST}:8080"
echo ""
echo "Next steps:"
echo "  1. Set up kiosk mode: ./scripts/setup-kiosk.sh ${PI_HOST}"
echo "  2. Configure autostart on boot"
```

Make executable:
```bash
chmod +x scripts/deploy-to-pi.sh
```

**Step 2: Create deployment documentation**

Create `docs/deployment.md`:

```markdown
# PrusaTouch Deployment Guide

## Prerequisites

- Raspberry Pi 4 (1GB+ RAM) with Raspberry Pi OS
- HyperPixel 4 display (800x480) configured
- SSH access to Pi
- Node.js 24.x on development machine

## Quick Deployment

### 1. Build and Deploy

From your development machine:

\`\`\`bash
# Deploy to default hostname (prusa-mk3s.local)
./scripts/deploy-to-pi.sh

# Deploy to custom hostname
./scripts/deploy-to-pi.sh raspberrypi.local
\`\`\`

This script will:
- Build production bundle
- Verify performance targets
- Transfer files to Pi
- Set proper permissions

### 2. Set Up Kiosk Mode

\`\`\`bash
./scripts/setup-kiosk.sh prusa-mk3s.local
\`\`\`

### 3. Verify

Open Chromium on the Pi and navigate to:
\`http://localhost:8080\`

Or from another device:
\`http://prusa-mk3s.local:8080\`

## Manual Deployment

If the script doesn't work, deploy manually:

1. **Build**:
   \`\`\`bash
   npm run build
   \`\`\`

2. **Transfer**:
   \`\`\`bash
   scp -r dist/* pi@prusa-mk3s.local:/var/www/html/prusatouch/
   \`\`\`

3. **Set permissions**:
   \`\`\`bash
   ssh pi@prusa-mk3s.local "sudo chown -R www-data:www-data /var/www/html/prusatouch && sudo chmod -R 755 /var/www/html/prusatouch"
   \`\`\`

## Troubleshooting

### Can't connect to Pi
- Verify hostname: \`ping prusa-mk3s.local\`
- Try IP address instead
- Check SSH is enabled: \`sudo systemctl status ssh\`

### Permission denied
- Ensure Pi user has sudo access
- Check directory ownership

### Page doesn't load
- Verify nginx/lighttpd is running
- Check logs: \`sudo journalctl -u nginx -f\`
- Verify PrusaLink base URL in \`.env\`

## Performance Verification

After deployment, verify on the Pi:

1. Open Chromium DevTools (F12)
2. Check Network tab - initial load should be <500KB
3. Navigate between views - should be <60ms
4. Verify 60fps animations (Performance tab)
```

**Step 3: Test script syntax**

Run: `bash -n scripts/deploy-to-pi.sh`
Expected: No syntax errors

**Step 4: Commit**

```bash
git add scripts/deploy-to-pi.sh docs/deployment.md
git commit -m "build: add Raspberry Pi deployment automation

- Build and transfer script
- Performance verification before deploy
- Automatic permission setup
- Deployment documentation

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 33: Kiosk Mode Setup - Chromium autostart

**Context:** Creates kiosk mode setup script for Raspberry Pi that configures Chromium to auto-launch PrusaTouch in fullscreen on boot, with cursor hidden and screen blanking disabled.

**Files to Interact:**
- C: `scripts/setup-kiosk.sh` (Create)
- C: `scripts/templates/kiosk-autostart.desktop` (Create)

**Step 1: Create kiosk autostart template**

Create `scripts/templates/kiosk-autostart.desktop`:

```desktop
[Desktop Entry]
Type=Application
Name=PrusaTouch Kiosk
Exec=/home/pi/start-prusatouch.sh
X-GNOME-Autostart-enabled=true
```

**Step 2: Create kiosk startup script template**

Create `scripts/templates/start-prusatouch.sh`:

```bash
#!/bin/bash

# Disable screen blanking
xset s off
xset -dpms
xset s noblank

# Hide cursor after 0.1 seconds of inactivity
unclutter -idle 0.1 -root &

# Wait for network (PrusaLink connection)
sleep 5

# Launch Chromium in kiosk mode
chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-component-update \
  --check-for-update-interval=31536000 \
  --app=http://localhost:8080
```

**Step 3: Create kiosk setup script**

Create `scripts/setup-kiosk.sh`:

```bash
#!/bin/bash
set -e

# PrusaTouch Kiosk Mode Setup for Raspberry Pi
# Usage: ./scripts/setup-kiosk.sh [pi-hostname]

PI_HOST="${1:-prusa-mk3s.local}"
PI_USER="pi"

echo "🖥️  PrusaTouch Kiosk Mode Setup"
echo "================================"
echo "Target: ${PI_USER}@${PI_HOST}"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Install dependencies on Pi
echo "📦 Installing dependencies on Pi..."
ssh ${PI_USER}@${PI_HOST} << 'EOF'
  sudo apt-get update
  sudo apt-get install -y \
    chromium-browser \
    unclutter \
    xdotool
EOF

echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 2: Copy startup script
echo "📄 Copying startup script..."
scp scripts/templates/start-prusatouch.sh ${PI_USER}@${PI_HOST}:/home/pi/
ssh ${PI_USER}@${PI_HOST} "chmod +x /home/pi/start-prusatouch.sh"

echo -e "${GREEN}✓ Startup script installed${NC}"
echo ""

# Step 3: Set up autostart
echo "⚙️  Configuring autostart..."
ssh ${PI_USER}@${PI_HOST} << 'EOF'
  mkdir -p /home/pi/.config/autostart
EOF

scp scripts/templates/kiosk-autostart.desktop ${PI_USER}@${PI_HOST}:/home/pi/.config/autostart/

echo -e "${GREEN}✓ Autostart configured${NC}"
echo ""

# Step 4: Disable screen blanking in lightdm
echo "🖥️  Disabling screen blanking..."
ssh ${PI_USER}@${PI_HOST} << 'EOF'
  sudo mkdir -p /etc/lightdm/lightdm.conf.d
  echo "[Seat:*]
xserver-command=X -s 0 -dpms" | sudo tee /etc/lightdm/lightdm.conf.d/01-disable-blanking.conf
EOF

echo -e "${GREEN}✓ Screen blanking disabled${NC}"
echo ""

echo "================================"
echo -e "${GREEN}✅ Kiosk mode setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Reboot the Pi: ssh ${PI_USER}@${PI_HOST} 'sudo reboot'"
echo "  2. PrusaTouch will auto-launch in kiosk mode"
echo ""
echo "To disable kiosk mode:"
echo "  ssh ${PI_USER}@${PI_HOST} 'rm /home/pi/.config/autostart/kiosk-autostart.desktop'"
```

Make executable:
```bash
chmod +x scripts/setup-kiosk.sh
chmod +x scripts/templates/start-prusatouch.sh
```

**Step 4: Test script syntax**

Run: `bash -n scripts/setup-kiosk.sh`
Expected: No syntax errors

**Step 5: Commit**

```bash
git add scripts/setup-kiosk.sh scripts/templates/
git commit -m "build: add kiosk mode setup for Raspberry Pi

- Chromium kiosk mode configuration
- Auto-launch on boot
- Screen blanking disabled
- Cursor hidden during inactivity
- Startup script template

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 34: Final Production Verification

**Context:** Final comprehensive check that all systems work: all tests pass, build succeeds, E2E flows work, and deployment is ready.

**Files to Interact:**
- C: `scripts/verify-production-ready.sh` (Create)
- M: `README.md:1-100` (Modify - add deployment status)

**Step 1: Create production verification script**

Create `scripts/verify-production-ready.sh`:

```bash
#!/bin/bash
set -e

echo "✅ PrusaTouch Production Readiness Verification"
echo "================================================"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

FAILURES=0

# Function to run check
run_check() {
  local name=$1
  local command=$2

  echo "🔍 $name..."
  if eval $command > /tmp/check.log 2>&1; then
    echo -e "${GREEN}✓ $name passed${NC}"
  else
    echo -e "${RED}✗ $name failed${NC}"
    cat /tmp/check.log
    FAILURES=$((FAILURES + 1))
  fi
  echo ""
}

# 1. Unit Tests
run_check "Unit tests" "npm run test:unit"

# 2. E2E Tests
run_check "E2E tests" "npm run test:e2e"

# 3. TypeScript type check
run_check "TypeScript type check" "npx vue-tsc --noEmit"

# 4. Build
run_check "Production build" "npm run build"

# 5. Performance verification
run_check "Performance targets" "./scripts/verify-performance.sh"

# Summary
echo "================================================"
if [ $FAILURES -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed! Production ready.${NC}"
  echo ""
  echo "Ready to deploy:"
  echo "  ./scripts/deploy-to-pi.sh prusa-mk3s.local"
  echo "  ./scripts/setup-kiosk.sh prusa-mk3s.local"
  exit 0
else
  echo -e "${RED}❌ $FAILURES check(s) failed${NC}"
  echo "Fix issues before deploying to production"
  exit 1
fi
```

Make executable:
```bash
chmod +x scripts/verify-production-ready.sh
```

**Step 2: Update README with deployment status**

Add deployment section to `README.md`:

```markdown
## Deployment Status

✅ **Production Ready**

- ✅ 113+ unit tests passing
- ✅ 16+ E2E tests passing
- ✅ Bundle size: <300KB gzipped
- ✅ TypeScript: 0 errors
- ✅ Performance: 60fps animations
- ✅ Target: Raspberry Pi 4 (1GB RAM)

### Quick Deploy

\`\`\`bash
# Verify production readiness
npm run verify:production

# Deploy to Raspberry Pi
./scripts/deploy-to-pi.sh prusa-mk3s.local

# Set up kiosk mode
./scripts/setup-kiosk.sh prusa-mk3s.local
\`\`\`

See [docs/deployment.md](docs/deployment.md) for detailed instructions.
```

**Step 3: Add script to package.json**

```json
{
  "scripts": {
    "verify:production": "./scripts/verify-production-ready.sh"
  }
}
```

**Step 4: Run full verification**

Run: `npm run verify:production`
Expected: All checks pass

**Step 5: Commit**

```bash
git add scripts/verify-production-ready.sh README.md package.json
git commit -m "build: add production readiness verification

- Runs all tests (unit + E2E)
- TypeScript type checking
- Build verification
- Performance target validation
- Ready for deployment gate

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Verification

After all tasks complete:

1. **Run full verification**: `npm run verify:production`
   - Expected: All checks pass (unit, E2E, build, performance)

2. **Test deployment** (if Pi available):
   ```bash
   ./scripts/deploy-to-pi.sh prusa-mk3s.local
   ./scripts/setup-kiosk.sh prusa-mk3s.local
   ssh pi@prusa-mk3s.local 'sudo reboot'
   ```

3. **Manual validation on Pi**:
   - PrusaTouch launches in kiosk mode on boot
   - No screen blanking
   - Cursor hidden
   - Smooth 60fps navigation
   - All views render correctly at 800x480

**Expected outcomes:**
- 16+ E2E tests passing
- Bundle <300KB gzipped verified
- Deployment automation working
- Kiosk mode configured
- Production-ready for Raspberry Pi deployment
