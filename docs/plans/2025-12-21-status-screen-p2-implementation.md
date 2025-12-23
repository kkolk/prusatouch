# Status Screen Redesign P2 Implementation Plan

**Created:** 2025-12-21
**Status:** Ready for implementation
**Parent Issue:** prusatouch-rps
**Design Spec:** docs/plans/2025-12-21-status-screen-design.md
**Issues:** prusatouch-rps.4, prusatouch-rps.6, prusatouch-rps.7, prusatouch-rps.8

## Overview

Implement the four Priority 2 features to complete the Status Screen Redesign:
1. Add thumbnail preview with fallback
2. Update progress ring layout and sizing
3. Write unit tests for status screen components
4. Write E2E tests for status screen interactions

**Execution approach:** Sequential implementation with fresh subagent, code review after each task.

## Architecture Context

**Design Reference:** `docs/plans/2025-12-21-status-screen-design.md`
**P1 Implementation:** Completed in commits 53d157c, 3cfed22, b4599eb, c565ea1, 0fb6022

**Current State:**
- Status screen with tap-anywhere interaction exists
- Control bottom sheet with print and temperature controls
- Freeze-on-error behavior implemented
- Thumbnail currently shows placeholder watermark (150px)
- Progress ring needs size adjustment to match spec

## Task 1: Add Thumbnail Preview with Fallback (prusatouch-rps.4)

**Lines: 80-180**

**Goal:** Enhance thumbnail preview to match design spec (220x220px) with proper fallback.

**Design Spec Reference:** Lines 92-110 of design doc

**Current State:**
- HomeView has placeholder thumbnail at 150px (src/views/HomeView.vue:651)
- Shows watermark "P" text
- Need to upgrade to 220x220px with proper fallback image

**Implementation:**

### Step 1.1: Update Thumbnail Size and Fallback

**File:** `src/views/HomeView.vue`

Update thumbnail placeholder section:

```vue
<template>
  <!-- Right Column: Thumbnail + Metadata -->
  <div class="metadata-column">
    <!-- Thumbnail Preview -->
    <div class="thumbnail-preview">
      <!-- Real thumbnail if available from job data -->
      <img
        v-if="thumbnailUrl"
        :src="thumbnailUrl"
        alt="Print preview"
        class="thumbnail-image"
      />

      <!-- Fallback: Prusa logo watermark -->
      <div v-else class="thumbnail-fallback">
        <img
          src="@/assets/prusa-logo.svg"
          alt="Prusa"
          class="prusa-watermark"
        />
      </div>
    </div>

    <!-- File name -->
    <div class="file-name">
      {{ jobStore.currentJob?.file?.display_name || jobStore.currentJob?.file?.name || 'Unknown' }}
    </div>

    <!-- Time remaining -->
    <div class="time-remaining">
      ⏱ {{ timeRemainingFormatted || 'Calculating...' }}
    </div>
  </div>
</template>
```

### Step 1.2: Add Thumbnail URL Computed

**File:** `src/views/HomeView.vue`

Add computed property for thumbnail URL:

```typescript
const thumbnailUrl = computed(() => {
  // Try to get thumbnail from current job
  const job = jobStore.currentJob
  if (!job) return null

  // Check if job has file with thumbnail reference
  // PrusaLink provides thumbnail URLs in file metadata
  const file = job.file
  if (!file) return null

  // Type guard for refs property
  if ('refs' in file && file.refs && 'thumbnail' in file.refs) {
    return file.refs.thumbnail
  }

  return null
})
```

### Step 1.3: Update Thumbnail Styles

**File:** `src/views/HomeView.vue`

Update CSS to match 220x220px spec:

```css
.thumbnail-preview {
  width: 220px;
  height: 220px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: var(--bg-tertiary);
  overflow: hidden;
  flex-shrink: 0; /* Prevent size changes */
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
}

.prusa-watermark {
  opacity: 0.25; /* 25% opacity per spec */
  width: 80px;
  height: auto;
}
```

**Verification:**
- [ ] Thumbnail shows 220x220px size
- [ ] Real thumbnail displays if available from job data
- [ ] Fallback shows Prusa logo at 25% opacity when no thumbnail
- [ ] No layout reflow when switching between thumbnail and fallback
- [ ] Border and rounded corners match design
- [ ] Thumbnail doesn't distort (object-fit: cover)

**Commit:** `feat: add thumbnail preview with fallback to status screen (prusatouch-rps.4)`

---

## Task 2: Update Progress Ring Layout and Sizing (prusatouch-rps.6)

**Lines: 181-280**

**Goal:** Adjust progress ring to match design spec sizing (240-260px diameter, 12-16px stroke).

**Design Spec Reference:** Lines 69-88 of design doc

**Current State:**
- ProgressRing component exists at src/components/ProgressRing.vue
- Current size needs verification and adjustment
- Center percentage display needs size check

**Implementation:**

### Step 2.1: Review Current ProgressRing Size

**File:** `src/components/ProgressRing.vue`

Check current SVG dimensions and stroke width:

```vue
<!-- Current implementation to review -->
<svg :width="size" :height="size" viewBox="0 0 100 100">
  <circle
    class="progress-background"
    :stroke-width="strokeWidth"
    ...
  />
  <circle
    class="progress-circle"
    :stroke-width="strokeWidth"
    ...
  />
  <text class="progress-text">{{ Math.round(progress) }}%</text>
</svg>
```

### Step 2.2: Update ProgressRing Props and Defaults

**File:** `src/components/ProgressRing.vue`

Ensure size and stroke width match spec:

```typescript
const props = withDefaults(defineProps<{
  progress: number
  frozen?: boolean
  size?: number
  strokeWidth?: number
}>(), {
  size: 250,  // 240-260px range, use middle value
  strokeWidth: 14  // 12-16px range, use middle value
})
```

### Step 2.3: Update Center Percentage Styling

**File:** `src/components/ProgressRing.vue`

Ensure percentage text matches 48-56px spec:

```css
.progress-text {
  font-size: 52px; /* 48-56px range, use middle value */
  font-weight: bold;
  fill: var(--text-primary);
  text-anchor: middle;
  dominant-baseline: middle;
}
```

### Step 2.4: Verify Layout in HomeView

**File:** `src/views/HomeView.vue`

Ensure progress ring fits properly in left column:

```vue
<div class="progress-column">
  <ProgressRing
    :progress="jobProgress"
    :frozen="isFrozen"
    :size="250"
    :stroke-width="14"
  />
</div>
```

Update CSS if needed:

```css
.progress-column {
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 280px; /* Accommodate 250px ring + padding */
}
```

**Verification:**
- [ ] Progress ring diameter is 240-260px (using 250px)
- [ ] Stroke width is 12-16px (using 14px)
- [ ] Center percentage text is 48-56px (using 52px)
- [ ] Ring fits properly in left column without overflow
- [ ] 2-column layout still balanced (left: ring, right: thumbnail+metadata)
- [ ] Animation still smooth (GPU transform only)

**Commit:** `feat: update progress ring sizing to match design spec (prusatouch-rps.6)`

---

## Task 3: Write Unit Tests for Status Screen (prusatouch-rps.7)

**Lines: 281-400**

**Goal:** Write comprehensive unit tests for status screen components and interactions.

**Test Coverage Requirements:**
1. Status display updates with job data
2. Control interactions trigger correct store actions
3. Error states render correctly
4. Temperature adjustments calculate new targets
5. Frozen state behavior
6. Thumbnail fallback logic

**Implementation:**

### Step 3.1: Create HomeView Unit Tests

**File:** `tests/unit/views/HomeView.spec.ts`

Add or enhance tests for status screen:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HomeView from '@/views/HomeView.vue'
import { usePrinterStore } from '@/stores/printer'
import { useJobStore } from '@/stores/job'

describe('HomeView - Status Screen', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('displays status screen when printing', () => {
    const printerStore = usePrinterStore()
    printerStore.status = { state: 'PRINTING', /* ... */ }

    const wrapper = mount(HomeView)
    expect(wrapper.find('.status-screen').exists()).toBe(true)
  })

  it('displays status screen when paused', () => {
    const printerStore = usePrinterStore()
    printerStore.status = { state: 'PAUSED', /* ... */ }

    const wrapper = mount(HomeView)
    expect(wrapper.find('.status-screen').exists()).toBe(true)
  })

  it('displays status screen when error', () => {
    const printerStore = usePrinterStore()
    printerStore.status = { state: 'ERROR', /* ... */ }

    const wrapper = mount(HomeView)
    expect(wrapper.find('.status-screen').exists()).toBe(true)
  })

  it('hides status screen when idle', () => {
    const printerStore = usePrinterStore()
    printerStore.status = { state: 'IDLE', /* ... */ }

    const wrapper = mount(HomeView)
    expect(wrapper.find('.status-screen').exists()).toBe(false)
  })

  it('opens control sheet when status screen clicked', async () => {
    const printerStore = usePrinterStore()
    printerStore.status = { state: 'PRINTING', /* ... */ }

    const wrapper = mount(HomeView)
    await wrapper.find('.status-screen').trigger('click')

    expect(wrapper.find('.control-sheet-content').exists()).toBe(true)
  })

  it('shows pause button when printing', () => {
    const printerStore = usePrinterStore()
    printerStore.status = { state: 'PRINTING', /* ... */ }

    const wrapper = mount(HomeView)
    wrapper.find('.status-screen').trigger('click')

    const pauseButton = wrapper.findAll('button').find(btn =>
      btn.text().includes('Pause')
    )
    expect(pauseButton).toBeTruthy()
  })

  it('shows resume button when paused', () => {
    const printerStore = usePrinterStore()
    printerStore.status = { state: 'PAUSED', /* ... */ }

    const wrapper = mount(HomeView)
    wrapper.find('.status-screen').trigger('click')

    const resumeButton = wrapper.findAll('button').find(btn =>
      btn.text().includes('Resume')
    )
    expect(resumeButton).toBeTruthy()
  })

  it('calls jobStore.pauseJob when pause clicked', async () => {
    const printerStore = usePrinterStore()
    const jobStore = useJobStore()
    printerStore.status = { state: 'PRINTING', /* ... */ }
    vi.spyOn(jobStore, 'pauseJob')

    const wrapper = mount(HomeView)
    await wrapper.find('.status-screen').trigger('click')

    const pauseButton = wrapper.findAll('button').find(btn =>
      btn.text().includes('Pause')
    )
    await pauseButton?.trigger('click')

    expect(jobStore.pauseJob).toHaveBeenCalled()
  })

  it('shows cancel confirmation dialog', async () => {
    const printerStore = usePrinterStore()
    printerStore.status = { state: 'PRINTING', /* ... */ }

    const wrapper = mount(HomeView)
    await wrapper.find('.status-screen').trigger('click')

    const cancelButton = wrapper.findAll('button').find(btn =>
      btn.text().includes('Cancel Print')
    )
    await cancelButton?.trigger('click')

    // ConfirmDialog should be visible
    expect(wrapper.text()).toContain('cannot be undone')
  })

  it('calculates new nozzle temp correctly on +5', () => {
    const printerStore = usePrinterStore()
    printerStore.status = {
      state: 'PRINTING',
      temp_nozzle: 215,
      target_nozzle: 220
    }

    const wrapper = mount(HomeView)
    wrapper.find('.status-screen').trigger('click')

    // Find +5 button for nozzle
    const plusButton = wrapper.findAll('button').find(btn =>
      btn.text() === '+5' && btn.element.closest('.temp-control-row')
    )

    // Should calculate 220 + 5 = 225
    // (Verify via spy on setNozzleTemp)
  })

  it('disables nozzle +5 at max temp (300°C)', () => {
    const printerStore = usePrinterStore()
    printerStore.status = {
      state: 'PRINTING',
      temp_nozzle: 295,
      target_nozzle: 300
    }

    const wrapper = mount(HomeView)
    wrapper.find('.status-screen').trigger('click')

    const plusButton = wrapper.findAll('button').find(btn =>
      btn.text() === '+5'
    )
    expect(plusButton?.attributes('disabled')).toBeDefined()
  })

  it('passes frozen prop to ProgressRing when paused', () => {
    const printerStore = usePrinterStore()
    printerStore.status = { state: 'PAUSED', /* ... */ }

    const wrapper = mount(HomeView)
    const progressRing = wrapper.findComponent({ name: 'ProgressRing' })

    expect(progressRing.props('frozen')).toBe(true)
  })

  it('passes frozen prop to ProgressRing when error', () => {
    const printerStore = usePrinterStore()
    printerStore.status = { state: 'ERROR', /* ... */ }

    const wrapper = mount(HomeView)
    const progressRing = wrapper.findComponent({ name: 'ProgressRing' })

    expect(progressRing.props('frozen')).toBe(true)
  })

  it('shows thumbnail when available from job', () => {
    const jobStore = useJobStore()
    jobStore.currentJob = {
      file: {
        name: 'test.gcode',
        refs: {
          thumbnail: '/api/thumbnails/test.png'
        }
      }
    }

    const wrapper = mount(HomeView)
    const thumbnail = wrapper.find('.thumbnail-image')
    expect(thumbnail.exists()).toBe(true)
    expect(thumbnail.attributes('src')).toBe('/api/thumbnails/test.png')
  })

  it('shows fallback when no thumbnail available', () => {
    const jobStore = useJobStore()
    jobStore.currentJob = {
      file: {
        name: 'test.gcode'
        // No refs.thumbnail
      }
    }

    const wrapper = mount(HomeView)
    const fallback = wrapper.find('.thumbnail-fallback')
    expect(fallback.exists()).toBe(true)
    expect(wrapper.find('.prusa-watermark').exists()).toBe(true)
  })
})
```

### Step 3.2: Enhance ProgressRing Tests

**File:** `tests/unit/components/ProgressRing.spec.ts`

Add tests for frozen behavior:

```typescript
it('stops animation when frozen', () => {
  const wrapper = mount(ProgressRing, {
    props: { progress: 50, frozen: true }
  })

  const circle = wrapper.find('.progress-circle')
  expect(circle.classes()).not.toContain('animating')
})

it('animates when not frozen', () => {
  const wrapper = mount(ProgressRing, {
    props: { progress: 50, frozen: false }
  })

  const circle = wrapper.find('.progress-circle')
  expect(circle.classes()).toContain('animating')
})

it('shows correct percentage text', () => {
  const wrapper = mount(ProgressRing, {
    props: { progress: 73.6 }
  })

  expect(wrapper.text()).toContain('74%') // Rounded
})
```

**Verification:**
- [ ] All new tests pass
- [ ] Code coverage for status screen > 80%
- [ ] Tests cover happy path and edge cases
- [ ] Tests are fast (no unnecessary delays)

**Commit:** `test: add unit tests for status screen components (prusatouch-rps.7)`

---

## Task 4: Write E2E Tests for Status Screen (prusatouch-rps.8)

**Lines: 401-520**

**Goal:** Write end-to-end tests for status screen user interactions.

**Test Coverage Requirements:**
1. Tap status screen opens overlay
2. Pause/resume flow works
3. Cancel with confirmation works
4. Temperature adjustment flow
5. Error state display

**Implementation:**

### Step 4.1: Create Status Screen E2E Tests

**File:** `tests/e2e/status-screen.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Status Screen', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:5173')

    // Mock printer status as PRINTING
    await page.route('**/api/v1/status', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          state: 'PRINTING',
          temp_nozzle: 215,
          target_nozzle: 220,
          temp_bed: 60,
          target_bed: 60
        })
      })
    })

    // Mock current job
    await page.route('**/api/v1/job', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          id: 1,
          progress: 45,
          time_remaining: 3600,
          file: {
            name: 'test_print.gcode',
            display_name: 'Test Print'
          }
        })
      })
    })
  })

  test('displays status screen when printing', async ({ page }) => {
    const statusScreen = page.locator('.status-screen')
    await expect(statusScreen).toBeVisible()
  })

  test('tapping status screen opens control overlay', async ({ page }) => {
    await page.click('.status-screen')

    const controlSheet = page.locator('.control-sheet-content')
    await expect(controlSheet).toBeVisible()
  })

  test('pause button pauses print', async ({ page }) => {
    // Open control sheet
    await page.click('.status-screen')

    // Mock pause API
    let pauseCalled = false
    await page.route('**/api/v1/job/pause', async route => {
      pauseCalled = true
      await route.fulfill({ status: 204 })
    })

    // Click pause button
    await page.click('button:has-text("Pause")')

    // Wait for API call
    await page.waitForTimeout(100)
    expect(pauseCalled).toBe(true)
  })

  test('resume button resumes print', async ({ page }) => {
    // Mock as PAUSED state
    await page.route('**/api/v1/status', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ state: 'PAUSED', /* ... */ })
      })
    })

    await page.reload()
    await page.click('.status-screen')

    // Mock resume API
    let resumeCalled = false
    await page.route('**/api/v1/job/resume', async route => {
      resumeCalled = true
      await route.fulfill({ status: 204 })
    })

    await page.click('button:has-text("Resume")')
    await page.waitForTimeout(100)
    expect(resumeCalled).toBe(true)
  })

  test('cancel button shows confirmation dialog', async ({ page }) => {
    await page.click('.status-screen')
    await page.click('button:has-text("Cancel Print")')

    // ConfirmDialog should appear
    await expect(page.locator('text=cannot be undone')).toBeVisible()
  })

  test('cancel confirmation stops print', async ({ page }) => {
    await page.click('.status-screen')
    await page.click('button:has-text("Cancel Print")')

    // Mock stop API
    let stopCalled = false
    await page.route('**/api/v1/job', async route => {
      if (route.request().method() === 'DELETE') {
        stopCalled = true
        await route.fulfill({ status: 204 })
      }
    })

    // Confirm cancellation
    await page.click('button:has-text("Cancel Print"):last-of-type')
    await page.waitForTimeout(100)
    expect(stopCalled).toBe(true)
  })

  test('+5 nozzle button increases temperature', async ({ page }) => {
    await page.click('.status-screen')

    // Mock setNozzleTemp API
    let newTemp: number | null = null
    await page.route('**/api/v1/printer/tool', async route => {
      const body = await route.request().postDataJSON()
      newTemp = body.targets?.tool0
      await route.fulfill({ status: 204 })
    })

    // Click +5 for nozzle
    const nozzlePlusButton = page.locator('.temp-control-row').first().locator('button:has-text("+5")')
    await nozzlePlusButton.click()

    await page.waitForTimeout(100)
    expect(newTemp).toBe(225) // 220 + 5
  })

  test('-5 bed button decreases temperature', async ({ page }) => {
    await page.click('.status-screen')

    // Mock setBedTemp API
    let newTemp: number | null = null
    await page.route('**/api/v1/printer/bed', async route => {
      const body = await route.request().postDataJSON()
      newTemp = body.target
      await route.fulfill({ status: 204 })
    })

    // Click -5 for bed
    const bedMinusButton = page.locator('.temp-control-row').last().locator('button:has-text("-5")')
    await bedMinusButton.click()

    await page.waitForTimeout(100)
    expect(newTemp).toBe(55) // 60 - 5
  })

  test('error state shows red badge and frozen ring', async ({ page }) => {
    // Mock ERROR state
    await page.route('**/api/v1/status', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ state: 'ERROR', /* ... */ })
      })
    })

    await page.reload()

    // Status badge should be red
    const badge = page.locator('.status-badge[data-color="red"]')
    await expect(badge).toBeVisible()

    // Progress ring should have frozen class
    const ring = page.locator('.progress-ring.frozen')
    await expect(ring).toBeVisible()
  })

  test('controls remain accessible in error state', async ({ page }) => {
    // Mock ERROR state
    await page.route('**/api/v1/status', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ state: 'ERROR', /* ... */ })
      })
    })

    await page.reload()

    // Should still be able to open control sheet
    await page.click('.status-screen')
    const controlSheet = page.locator('.control-sheet-content')
    await expect(controlSheet).toBeVisible()
  })
})
```

**Verification:**
- [ ] All E2E tests pass
- [ ] Tests run headlessly in CI
- [ ] Tests are reliable (no flakiness)
- [ ] Tests cover critical user flows
- [ ] Mock API responses appropriately

**Commit:** `test: add E2E tests for status screen interactions (prusatouch-rps.8)`

---

## Final Verification

After all tasks complete:

**Functional Tests:**
1. **Thumbnail preview:**
   - 220x220px size
   - Shows real thumbnail if available
   - Shows Prusa logo fallback at 25% opacity
   - No layout reflow

2. **Progress ring:**
   - 240-260px diameter (250px)
   - 12-16px stroke (14px)
   - 48-56px percentage text (52px)
   - Fits properly in layout

3. **Unit tests:**
   - All tests pass
   - Coverage > 80% for status screen
   - Tests are fast and reliable

4. **E2E tests:**
   - All flows tested
   - Tests pass in headless mode
   - No flaky tests

**Test Suite:**
```bash
just test        # Unit tests should pass (267+)
just test-e2e    # E2E tests should pass
just build       # Build should succeed
```

**Deployment:**
```bash
just deploy      # Deploy to Pi and verify
```

## Success Criteria

- [ ] All 4 P2 tasks implemented and verified
- [ ] Thumbnail preview matches 220x220px spec with fallback
- [ ] Progress ring sized correctly (250px diameter, 14px stroke, 52px text)
- [ ] Unit tests achieve >80% coverage for status screen
- [ ] E2E tests cover all critical user flows
- [ ] All tests pass (unit + E2E)
- [ ] Bundle size <300KB
- [ ] Code reviewed and approved
- [ ] Status Screen Redesign epic complete!

## Notes

**Design Adherence:**
- Follows `docs/plans/2025-12-21-status-screen-design.md` specification
- Completes implementation of all design requirements
- Maintains GPU-only animations
- Touch-optimized UX preserved

**Epic Completion:**
This completes ALL 8 subtasks of prusatouch-rps (P1: rps.1-3,5 + P2: rps.4,6-8). The Status Screen Redesign will be fully implemented with comprehensive test coverage.
