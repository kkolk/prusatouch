# Status Screen Redesign P1 Implementation Plan

**Created:** 2025-12-21
**Status:** Ready for implementation
**Parent Issue:** prusatouch-rps
**Design Spec:** docs/plans/2025-12-21-status-screen-design.md
**Issues:** prusatouch-rps.1, prusatouch-rps.2, prusatouch-rps.3, prusatouch-rps.5

## Overview

Implement the four Priority 1 features for the Status Screen Redesign:
1. Tap-anywhere interaction to open control bottom sheet
2. Control bottom sheet with Pause/Resume and Cancel Print buttons
3. Temperature step adjustment controls (+5/-5 buttons)
4. Freeze-on-error visual behavior

**Execution approach:** Sequential implementation with fresh subagent, code review after each task.

## Architecture Context

**Design Reference:** `docs/plans/2025-12-21-status-screen-design.md`

**Existing Components (Reuse):**
- `src/components/BottomSheet.vue` - Overlay presentation
- `src/components/TouchButton.vue` - All buttons
- `src/components/ConfirmDialog.vue` - Cancel confirmation
- `src/components/StatusBadge.vue` - Status indicator
- `src/components/ProgressRing.vue` - Progress display

**Current State:**
- HomeView has printing state section (lines ~80-150)
- printerStore has status polling, temperature setters
- jobStore has job control methods (pause, resume, stop)

**Target Location:**
- Modify existing `HomeView.vue` printing state section
- OR create new `StatusView.vue` component (TBD based on complexity)

## Task 1: Add Tap-Anywhere Interaction (prusatouch-rps.1)

**Lines: 80-150**

**Goal:** Add click handler to status screen area that opens control bottom sheet.

**Current State:**
- HomeView shows printing state with progress ring, file name, time remaining
- No interaction beyond viewing data
- Need to add tap handler to main content area

**Implementation:**

### Step 1.1: Add Bottom Sheet State Management

**File:** `src/views/HomeView.vue`

Add reactive state for control bottom sheet:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import BottomSheet from '@/components/BottomSheet.vue'

const showControlSheet = ref(false)

function openControlSheet() {
  showControlSheet.value = true
}

function closeControlSheet() {
  showControlSheet.value = false
}
</script>
```

### Step 1.2: Make Status Area Clickable

**File:** `src/views/HomeView.vue`

Add click handler to printing state section:

```vue
<template>
  <!-- ... header ... -->

  <!-- Printing state section -->
  <div
    v-if="printerStore.status?.state === 'PRINTING' || printerStore.status?.state === 'PAUSED'"
    class="status-screen"
    @click="openControlSheet"
  >
    <!-- Status badge -->
    <StatusBadge :state="printerStore.status.state" />

    <!-- Main content area (2-column layout) -->
    <div class="status-content">
      <!-- Left: Progress Ring -->
      <div class="progress-column">
        <ProgressRing
          :progress="jobProgress"
          :frozen="printerStore.status.state === 'PAUSED' || printerStore.status.state === 'ERROR'"
        />
      </div>

      <!-- Right: Thumbnail + Metadata -->
      <div class="metadata-column">
        <!-- Thumbnail (placeholder for now - P2 task) -->
        <div class="thumbnail-placeholder">
          <img src="@/assets/prusa-logo.svg" alt="Prusa" class="watermark" />
        </div>

        <!-- File name -->
        <div class="file-name">{{ jobStore.currentJob?.file?.display_name || 'Unknown' }}</div>

        <!-- Time remaining -->
        <div class="time-remaining">
          ⏱ {{ timeRemainingFormatted || 'Calculating...' }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.status-screen {
  cursor: pointer;
  user-select: none;
  padding: var(--space-md);
}

.status-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-lg);
  align-items: center;
}

.progress-column {
  display: flex;
  justify-content: center;
  align-items: center;
}

.metadata-column {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.thumbnail-placeholder {
  width: 220px;
  height: 220px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.watermark {
  opacity: 0.25;
  width: 80px;
  height: auto;
}

.file-name {
  font-size: var(--font-size-lg);
  font-weight: 500;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.time-remaining {
  font-size: var(--font-size-md);
  color: var(--text-secondary);
}
</style>
```

**Verification:**
- [ ] Clicking anywhere on status screen opens bottom sheet (verify with console.log initially)
- [ ] Cursor changes to pointer on hover
- [ ] No text selection when clicking/dragging
- [ ] Layout matches 2-column specification (left: ring, right: metadata)
- [ ] Thumbnail placeholder shows Prusa logo watermark at 25% opacity

**Commit:** `feat: add tap-anywhere interaction to status screen (prusatouch-rps.1)`

---

## Task 2: Create Control Bottom Sheet (prusatouch-rps.2)

**Lines: 151-280**

**Goal:** Implement control bottom sheet with Pause/Resume and Cancel Print buttons.

**Design Spec:**
- Height: 55-60% of screen (~260-290px)
- Pause/Resume toggle button (large size)
- Cancel Print button (danger variant) with confirmation
- Uses existing BottomSheet component

**Implementation:**

### Step 2.1: Add BottomSheet to Template

**File:** `src/views/HomeView.vue`

Add BottomSheet component after status screen:

```vue
<template>
  <!-- ... status screen ... -->

  <!-- Control Bottom Sheet -->
  <BottomSheet
    :show="showControlSheet"
    title="Print Controls"
    @close="closeControlSheet"
  >
    <div class="control-sheet-content">
      <!-- Section 1: Print Controls -->
      <div class="print-controls">
        <!-- Pause/Resume Button -->
        <TouchButton
          :label="isPrinting ? 'Pause Print' : 'Resume Print'"
          :variant="isPrinting ? 'secondary' : 'primary'"
          size="large"
          :loading="pauseResumeLoading"
          :disabled="pauseResumeLoading"
          @click="handlePauseResume"
        />

        <!-- Cancel Print Button -->
        <TouchButton
          label="Cancel Print"
          variant="danger"
          size="large"
          :loading="cancelLoading"
          :disabled="cancelLoading"
          @click="showCancelConfirm = true"
        />
      </div>
    </div>
  </BottomSheet>

  <!-- Cancel Confirmation Dialog -->
  <ConfirmDialog
    :show="showCancelConfirm"
    title="Cancel Print?"
    message="This will cancel the current print job. This action cannot be undone."
    confirm-text="Cancel Print"
    cancel-text="Keep Printing"
    variant="danger"
    @confirm="handleCancelPrint"
    @cancel="showCancelConfirm = false"
  />
</template>
```

### Step 2.2: Implement Control Logic

**File:** `src/views/HomeView.vue`

Add control methods:

```typescript
import { ref, computed } from 'vue'
import { usePrinterStore } from '@/stores/printer'
import { useJobStore } from '@/stores/job'
import { useNotificationStore } from '@/stores/notifications'

const printerStore = usePrinterStore()
const jobStore = useJobStore()
const notificationStore = useNotificationStore()

const showControlSheet = ref(false)
const showCancelConfirm = ref(false)
const pauseResumeLoading = ref(false)
const cancelLoading = ref(false)

const isPrinting = computed(() => printerStore.status?.state === 'PRINTING')

async function handlePauseResume() {
  pauseResumeLoading.value = true

  try {
    if (isPrinting.value) {
      await jobStore.pauseJob()
      notificationStore.addNotification({
        type: 'success',
        message: 'Print paused'
      })
    } else {
      await jobStore.resumeJob()
      notificationStore.addNotification({
        type: 'success',
        message: 'Print resumed'
      })
    }
  } catch (error) {
    notificationStore.addNotification({
      type: 'error',
      message: `Failed to ${isPrinting.value ? 'pause' : 'resume'} print`
    })
  } finally {
    pauseResumeLoading.value = false
  }
}

async function handleCancelPrint() {
  showCancelConfirm.value = false
  cancelLoading.value = true

  try {
    await jobStore.stopJob()
    notificationStore.addNotification({
      type: 'success',
      message: 'Print cancelled'
    })
    closeControlSheet()
  } catch (error) {
    notificationStore.addNotification({
      type: 'error',
      message: 'Failed to cancel print'
    })
  } finally {
    cancelLoading.value = false
  }
}
```

### Step 2.3: Style Control Sheet

**File:** `src/views/HomeView.vue`

Add CSS for control sheet:

```css
.control-sheet-content {
  padding: var(--space-md);
  height: 55vh; /* 55% of screen */
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.print-controls {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}
```

**Verification:**
- [ ] Bottom sheet opens when clicking status screen
- [ ] Bottom sheet height is 55-60% of screen
- [ ] Pause button shows when printing (secondary variant)
- [ ] Resume button shows when paused (primary variant)
- [ ] Cancel button always shows (danger variant)
- [ ] Cancel shows confirmation dialog before executing
- [ ] Buttons show loading state during API calls
- [ ] Success/error toasts shown after actions
- [ ] Bottom sheet closes after successful cancel

**Commit:** `feat: add control bottom sheet with print controls (prusatouch-rps.2)`

---

## Task 3: Add Temperature Step Controls (prusatouch-rps.3)

**Lines: 281-410**

**Goal:** Add temperature adjustment controls (+5/-5 buttons) to control bottom sheet.

**Design Spec:**
- ±5°C step buttons
- Current/target display between buttons
- Nozzle: 0-300°C, Bed: 0-120°C
- No numeric keypad

**Implementation:**

### Step 3.1: Add Temperature Section to Bottom Sheet

**File:** `src/views/HomeView.vue`

Add temperature controls after print controls:

```vue
<template>
  <BottomSheet ...>
    <div class="control-sheet-content">
      <!-- Section 1: Print Controls -->
      <div class="print-controls">
        <!-- ... existing buttons ... -->
      </div>

      <!-- Section 2: Temperature Controls -->
      <div class="temperature-controls">
        <h3>Temperature Adjustments</h3>

        <!-- Nozzle Temperature -->
        <div class="temp-control-row">
          <span class="temp-label">Nozzle</span>
          <TouchButton
            label="−5"
            variant="secondary"
            :disabled="!canDecreaseNozzle || nozzleTempLoading"
            :loading="nozzleTempLoading"
            @click="adjustNozzleTemp(-5)"
          />
          <div class="temp-display">
            {{ nozzleTemp }}° / {{ nozzleTarget }}°
          </div>
          <TouchButton
            label="+5"
            variant="secondary"
            :disabled="!canIncreaseNozzle || nozzleTempLoading"
            :loading="nozzleTempLoading"
            @click="adjustNozzleTemp(5)"
          />
        </div>

        <!-- Bed Temperature -->
        <div class="temp-control-row">
          <span class="temp-label">Bed</span>
          <TouchButton
            label="−5"
            variant="secondary"
            :disabled="!canDecreaseBed || bedTempLoading"
            :loading="bedTempLoading"
            @click="adjustBedTemp(-5)"
          />
          <div class="temp-display">
            {{ bedTemp }}° / {{ bedTarget }}°
          </div>
          <TouchButton
            label="+5"
            variant="secondary"
            :disabled="!canIncreaseBed || bedTempLoading"
            :loading="bedTempLoading"
            @click="adjustBedTemp(5)"
          />
        </div>
      </div>
    </div>
  </BottomSheet>
</template>
```

### Step 3.2: Implement Temperature Logic

**File:** `src/views/HomeView.vue`

Add temperature state and methods:

```typescript
const nozzleTempLoading = ref(false)
const bedTempLoading = ref(false)

// Current temperatures
const nozzleTemp = computed(() => printerStore.status?.temp_nozzle || 0)
const nozzleTarget = computed(() => printerStore.status?.target_nozzle || 0)
const bedTemp = computed(() => printerStore.status?.temp_bed || 0)
const bedTarget = computed(() => printerStore.status?.target_bed || 0)

// Constraints
const MIN_NOZZLE_TEMP = 0
const MAX_NOZZLE_TEMP = 300
const MIN_BED_TEMP = 0
const MAX_BED_TEMP = 120

// Can adjust checks
const canIncreaseNozzle = computed(() => nozzleTarget.value + 5 <= MAX_NOZZLE_TEMP)
const canDecreaseNozzle = computed(() => nozzleTarget.value - 5 >= MIN_NOZZLE_TEMP)
const canIncreaseBed = computed(() => bedTarget.value + 5 <= MAX_BED_TEMP)
const canDecreaseBed = computed(() => bedTarget.value - 5 >= MIN_BED_TEMP)

async function adjustNozzleTemp(delta: number) {
  const newTarget = nozzleTarget.value + delta

  // Bounds check
  if (newTarget < MIN_NOZZLE_TEMP || newTarget > MAX_NOZZLE_TEMP) {
    return
  }

  nozzleTempLoading.value = true

  try {
    await printerStore.setNozzleTemp(newTarget)
    notificationStore.addNotification({
      type: 'success',
      message: `Nozzle target set to ${newTarget}°C`
    })
  } catch (error) {
    notificationStore.addNotification({
      type: 'error',
      message: 'Failed to set nozzle temperature'
    })
  } finally {
    nozzleTempLoading.value = false
  }
}

async function adjustBedTemp(delta: number) {
  const newTarget = bedTarget.value + delta

  // Bounds check
  if (newTarget < MIN_BED_TEMP || newTarget > MAX_BED_TEMP) {
    return
  }

  bedTempLoading.value = true

  try {
    await printerStore.setBedTemp(newTarget)
    notificationStore.addNotification({
      type: 'success',
      message: `Bed target set to ${newTarget}°C`
    })
  } catch (error) {
    notificationStore.addNotification({
      type: 'error',
      message: 'Failed to set bed temperature'
    })
  } finally {
    bedTempLoading.value = false
  }
}
```

### Step 3.3: Style Temperature Controls

**File:** `src/views/HomeView.vue`

Add CSS:

```css
.temperature-controls {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.temperature-controls h3 {
  margin: 0;
  font-size: var(--font-size-md);
  color: var(--text-primary);
  font-weight: 500;
}

.temp-control-row {
  display: grid;
  grid-template-columns: 80px 60px 1fr 60px;
  gap: var(--space-sm);
  align-items: center;
}

.temp-label {
  font-size: var(--font-size-md);
  color: var(--text-secondary);
}

.temp-display {
  text-align: center;
  font-size: var(--font-size-md);
  color: var(--text-primary);
  font-weight: 500;
}
```

**Verification:**
- [ ] Temperature section shows below print controls
- [ ] Current/target temps display correctly
- [ ] +5 buttons increase target by 5°C
- [ ] -5 buttons decrease target by 5°C
- [ ] Buttons disabled at min/max limits (nozzle: 0-300, bed: 0-120)
- [ ] Buttons show loading state during API call
- [ ] Success/error toasts shown
- [ ] Temps update after API call completes

**Commit:** `feat: add temperature step controls to control sheet (prusatouch-rps.3)`

---

## Task 4: Implement Freeze-on-Error Behavior (prusatouch-rps.5)

**Lines: 411-480**

**Goal:** Update error state handling to freeze progress ring and show red badge without modals.

**Design Spec:**
- Progress ring freezes (no animation, no color change)
- Status badge turns red
- No modals or auto-navigation
- Controls remain available

**Implementation:**

### Step 4.1: Update ProgressRing Component

**File:** `src/components/ProgressRing.vue`

Add frozen prop and state handling:

```vue
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  progress: number
  frozen?: boolean
}>()

// Stop animation when frozen
const shouldAnimate = computed(() => !props.frozen && props.progress > 0)
</script>

<template>
  <div class="progress-ring">
    <svg :class="{ 'frozen': frozen }">
      <!-- SVG circle with conditional animation class -->
      <circle
        class="progress-circle"
        :class="{ 'animating': shouldAnimate }"
        :style="{ strokeDashoffset: dashOffset }"
      />

      <!-- Percentage display -->
      <text>{{ Math.round(progress) }}%</text>
    </svg>
  </div>
</template>

<style scoped>
.progress-circle {
  transition: stroke-dashoffset 0.3s ease;
}

.progress-circle.animating {
  /* Subtle rotation animation (GPU-only) */
  animation: rotate 2s linear infinite;
}

.frozen .progress-circle {
  /* Stop animation */
  animation: none;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
```

### Step 4.2: Update StatusBadge for ERROR State

**File:** `src/components/StatusBadge.vue`

Ensure ERROR state shows red badge:

```vue
<script setup lang="ts">
const props = defineProps<{
  state: 'PRINTING' | 'PAUSED' | 'IDLE' | 'ERROR'
}>()

const badgeConfig = computed(() => {
  switch (props.state) {
    case 'PRINTING':
      return { color: 'orange', label: 'Printing' }
    case 'PAUSED':
      return { color: 'yellow', label: 'Paused' }
    case 'ERROR':
      return { color: 'red', label: 'Error' }
    case 'IDLE':
    default:
      return { color: 'gray', label: 'Idle' }
  }
})
</script>

<template>
  <div class="status-badge" :data-color="badgeConfig.color">
    {{ badgeConfig.label }}
  </div>
</template>

<style scoped>
.status-badge[data-color="red"] {
  background-color: var(--status-error);
  color: var(--text-on-error);
}
</style>
```

### Step 4.3: Update HomeView Error Handling

**File:** `src/views/HomeView.vue`

Update status screen to handle ERROR state:

```vue
<template>
  <div
    v-if="isPrintingOrPausedOrError"
    class="status-screen"
    @click="openControlSheet"
  >
    <!-- Status badge (shows ERROR in red) -->
    <StatusBadge :state="printerStore.status.state" />

    <div class="status-content">
      <div class="progress-column">
        <ProgressRing
          :progress="jobProgress"
          :frozen="isFrozen"
        />
      </div>
      <!-- ... metadata column ... -->
    </div>
  </div>
</template>

<script setup lang="ts">
const isPrintingOrPausedOrError = computed(() => {
  const state = printerStore.status?.state
  return state === 'PRINTING' || state === 'PAUSED' || state === 'ERROR'
})

const isFrozen = computed(() => {
  const state = printerStore.status?.state
  return state === 'PAUSED' || state === 'ERROR'
})
</script>
```

### Step 4.4: Remove Error Modals/Auto-Navigation

**File:** `src/views/HomeView.vue` and `src/stores/printer.ts`

Ensure no modals or auto-navigation on ERROR state:

```typescript
// In HomeView - do NOT watch for ERROR state to show modal
// Just let badge turn red and ring freeze

// In printerStore - ensure fetchStatus doesn't navigate on error
async fetchStatus() {
  try {
    const status = await StatusService.getStatus()
    this.status = status
    // Do NOT navigate or show modal if status.state === 'ERROR'
  } catch (error) {
    console.error('Failed to fetch status:', error)
  }
}
```

**Verification:**
- [ ] When printer goes to ERROR state:
  - [ ] Progress ring stops animating
  - [ ] Progress ring keeps current color (no red change)
  - [ ] Status badge turns red
  - [ ] Badge text shows "Error"
  - [ ] No modal appears
  - [ ] No auto-navigation away from status screen
  - [ ] Control bottom sheet still opens on tap
  - [ ] All controls remain functional
- [ ] "Freeze, don't explode" mental model maintained

**Commit:** `feat: implement freeze-on-error behavior (prusatouch-rps.5)`

---

## Final Verification

After all tasks complete:

**Functional Tests:**
1. **Tap-anywhere interaction:**
   - Tap any part of status screen → bottom sheet opens
   - Cursor shows pointer on hover
   - No text selection when clicking

2. **Print controls:**
   - Pause button works (shows loading, updates state)
   - Resume button works (shows loading, updates state)
   - Cancel shows confirmation dialog
   - Cancel confirmation works (closes sheet after success)

3. **Temperature controls:**
   - +5 nozzle button increases target by 5°C
   - -5 nozzle button decreases target by 5°C
   - +5 bed button increases target by 5°C
   - -5 bed button decreases target by 5°C
   - Buttons disabled at limits (nozzle: 0-300, bed: 0-120)
   - Current/target display updates after API call

4. **Error handling:**
   - Simulate ERROR state → ring freezes, badge red, no modal
   - Controls still accessible in ERROR state
   - Success/error toasts shown for all actions

**Performance Tests:**
1. Progress ring maintains 60fps (GPU transform only)
2. No layout shifts when opening/closing bottom sheet
3. Touch targets minimum 44px (temperature buttons 60px)

**Test Suite:**
```bash
just test        # Unit tests should pass
just build       # Build should succeed
```

**Deployment:**
```bash
just deploy      # Deploy to Pi and verify on hardware
```

## Success Criteria

- [ ] All 4 P1 tasks implemented and verified
- [ ] Tap-anywhere opens control bottom sheet
- [ ] Print controls (pause/resume/cancel) work correctly
- [ ] Temperature step controls work within constraints
- [ ] Error state freezes ring and shows red badge (no modals)
- [ ] All tests pass (267+)
- [ ] Bundle size <300KB
- [ ] Code reviewed and approved
- [ ] Deployed to Pi successfully

## Notes

**Design Adherence:**
- Follows `docs/plans/2025-12-21-status-screen-design.md` specification
- Reuses existing components (BottomSheet, TouchButton, ConfirmDialog)
- GPU-only animations (transform/opacity)
- Touch-optimized (44px+ touch targets)

**Out of Scope (P2 tasks):**
- Thumbnail preview (prusatouch-rps.4)
- Progress ring layout updates (prusatouch-rps.6)
- Unit tests (prusatouch-rps.7)
- E2E tests (prusatouch-rps.8)

These will be handled in a separate batch after P1 features are complete and reviewed.
