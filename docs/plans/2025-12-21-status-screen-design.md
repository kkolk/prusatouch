# Status Screen Design Specification

**Date:** 2025-12-21
**Status:** Implementation-ready

## 1. Overview

### Primary Purpose
Passive, at-a-glance monitoring during an active print job.

### Interaction Model
- **Tap anywhere on status area** → Opens control bottom sheet
- **No inline interaction** on the status view itself
- **Visual tone:** Calm, stable, confident
- **Animation policy:** Minimal; progress animates smoothly, freezes on error

### Reference
See `/home/kkolk/prusatouch/../interface.png` for visual mockup.

---

## 2. Layout Specification (800×480 Display)

### Header (60px height)

**Reuses existing header structure**

**Contents (left → right):**
- App title/brand: "PrusaTouch"
- Nozzle temperature: `🔥 215° / 220°`
- Bed temperature: `🛏 60° / 60°`
- Status icons (right-aligned)

**Behavior:**
- Temperatures update live from `printerStore.status`
- Heating pulse animation allowed (GPU-only: opacity/transform)
- Header remains visible at all times

---

### Status Badge Row

**Position:** Below header, left-aligned
**Component:** `StatusBadge.vue` (existing)

**States:**
- `PRINTING` (orange)
- `PAUSED` (yellow)
- `IDLE` (gray)
- `ERROR` (red)

**ERROR behavior:**
- Badge text changes to `ERROR`
- No modal, no auto-navigation
- No shake or additional animation
- Progress ring freezes visually
- **Predictable and non-intrusive failure handling**

---

### Main Content Area (~300px height)

**Layout:** Two-column fixed layout

#### Left Column — Progress Ring (Primary)

**Component:** `ProgressRing.vue` (existing)

**Specifications:**
- Size: 240–260px diameter
- Stroke width: 12–16px
- Color: `--prusa-orange` (#FF6600)
- Background: Dark (`--bg-secondary`)

**Center Content:**
- Percentage display:
  - Font size: 48–56px
  - Weight: bold
  - Color: `--text-primary`
- Optional small "%" symbol

**State Behavior:**
- **PRINTING:** Smooth animation (GPU transform only)
- **PAUSED:** Ring freezes, percentage remains visible
- **ERROR:** Ring stops animating, percentage freezes, no color change

**Why:** Reinforces "something stopped, not exploding" mental model.

---

#### Right Column — Thumbnail + Metadata

##### Thumbnail Preview

**Specifications:**
- Size: 220×220px
- Rounded corners: `--radius-md`
- Border: Subtle (`--border-subtle`)
- Background: `--bg-tertiary`

**Content:**
- 3D preview thumbnail from file metadata (if available)
- **Fallback:**
  - Neutral framed panel
  - Prusa logo watermark at 20–30% opacity
  - No reflow when missing (visual stability)

**Data Source:**
- From `currentJob.value` thumbnail URL (if PrusaLink provides)
- Otherwise use fallback

##### File Name

**Placement:** Below thumbnail
**Specifications:**
- Font: 18–20px, medium weight
- Color: `--text-secondary`
- Max lines: 2
- Overflow: Ellipsis (`text-overflow: ellipsis`)

**Data Source:** `currentJob.value.file.display_name` or `currentJob.value.file.name`

##### Time Remaining

**Placement:** Directly below filename
**Format:** `1h 23m` (reuse existing `timeRemainingFormatted` computed)
**Specifications:**
- Font: 14–16px
- Color: `--text-secondary`
- Icon: ⏱ (optional)

**Fallback:**
- If unknown: Show `Calculating…`
- Do not remove the line (prevents layout shift)

---

## 3. Interaction: Control Bottom Sheet

### Trigger
**Tap anywhere** on the status screen main content area

### Presentation
**Component:** `BottomSheet.vue` (existing)

**Specifications:**
- Height: 55–60% of screen (~260–290px)
- Backdrop: `--bg-overlay` with 0.8 opacity
- Header and status screen dim but remain contextually visible
- Slide-up animation (GPU transform only)

---

### Bottom Sheet Contents

#### Section 1: Print Controls

**Pause / Resume Button**
- Large primary button (`TouchButton` size="large")
- Toggles based on `printerStore.status.state`
- States:
  - `PRINTING` → Show "Pause" (secondary variant)
  - `PAUSED` → Show "Resume" (primary variant)
- Loading state while API call in progress
- Uses `jobStore.pauseJob()` / `jobStore.resumeJob()`

**Cancel Print Button**
- Danger variant (`variant="danger"`)
- Shows confirmation dialog before executing
- Uses `jobStore.stopJob()`
- Confirmation message: "This will cancel the current print job. This action cannot be undone."

#### Section 2: Temperature Adjustments

**Interaction Model:**
- Simple step buttons only (no numeric keypad)
- Immediate API calls on tap
- Visual feedback via loading state on button

**Controls Layout:**

```
Nozzle Temperature
[−5]  [Current: 215° / 220°]  [+5]

Bed Temperature
[−5]  [Current: 60° / 60°]  [+5]
```

**Specifications:**
- Current/target display between buttons
- Buttons disabled when:
  - Printer state disallows changes (if applicable)
  - API call in progress
- Step increment: ±5°C
- Uses `printerStore.setNozzleTemp()` / `printerStore.setBedTemp()`

**Button Constraints:**
- Min nozzle temp: 0°C
- Max nozzle temp: 300°C
- Min bed temp: 0°C
- Max bed temp: 120°C

---

## 4. State Behavior Matrix

| State    | Progress Ring | Status Badge | Interaction | Controls Available |
|----------|---------------|--------------|-------------|--------------------|
| PRINTING | Animates      | Orange       | Enabled     | All enabled        |
| PAUSED   | Frozen        | Yellow       | Enabled     | All enabled        |
| ERROR    | Frozen        | Red          | Enabled     | Enabled*           |
| IDLE     | Hidden        | Gray         | N/A         | N/A                |

\* Controls remain available but no auto-open or forced interaction

---

## 5. Component Mapping

### New Components
- `StatusView.vue` — Main container for status screen

### Existing Components (Reused)
- `ProgressRing.vue` — Left column progress display
- `StatusBadge.vue` — Status indicator below header
- `BottomSheet.vue` — Control overlay
- `TouchButton.vue` — All interactive controls
- `ConfirmDialog.vue` — Cancel print confirmation

### Composables Used
- `useStatus()` — Printer state and polling
- `useJob()` — Job data and control actions

### Stores Used
- `printerStore` — Temperature data, printer state
- `jobStore` — Job progress, control actions

---

## 6. Data Flow

### Status Display
1. `printerStore.startPolling()` runs every 2s during printing
2. `printerStore.status` updates with live data
3. `jobStore.currentJob` provides progress/time/file info
4. Vue reactivity updates display

### Control Actions
1. User taps status screen → `BottomSheet` opens
2. User taps control button → API call via store action
3. Loading state shown on button
4. Store refreshes data after API response
5. UI updates reactively
6. Bottom sheet remains open (user must dismiss)

### Temperature Adjustments
1. User taps +5 or -5 button
2. Calculate new target: `currentTarget ± 5`
3. Call `printerStore.setNozzleTemp(newTarget)` or `setBedTemp(newTarget)`
4. Button shows loading state
5. Store refreshes status after API call
6. Display updates with new target

---

## 7. Error Handling

### API Failures
- **Temperature adjustment fails:**
  - Show toast: "Failed to set temperature"
  - Revert display to previous value

- **Pause/Resume fails:**
  - Show toast: "Failed to pause/resume print"
  - Keep button interactive for retry

- **Cancel fails:**
  - Show toast: "Failed to cancel print"
  - Close confirmation, keep bottom sheet open

### State Transitions
- **Printer goes to ERROR state:**
  - Status badge turns red
  - Progress ring freezes
  - No automatic navigation or modals
  - Controls remain available (user can diagnose)

### Connection Loss
- **Polling fails:**
  - Status badge shows connection error
  - Keep last known state visible
  - Retry every 5s (existing behavior)

---

## 8. Performance Constraints

### GPU Animation Rules
**ONLY animate:**
- `transform` (progress ring rotation, slide-up overlay)
- `opacity` (heating pulse, backdrop fade)

**NEVER animate:**
- Width, height, margin, padding
- Color, background
- Position properties

**Why:** Pi 4's VideoCore VI GPU handles transform/opacity natively. Other properties trigger CPU layout/paint.

### Bundle Size
- Reuse existing components (no new dependencies)
- Code split if StatusView grows >50KB

### Memory
- LRU cache for thumbnails (if implementing preview feature)
- Limit temperature history to 100 points (existing)

---

## 9. Accessibility

### Touch Targets
- Minimum: 44×44px
- Comfortable: 60px (default for buttons)
- Temperature step buttons: 60×60px
- Progress ring tap area: Full circle diameter

### Visual Hierarchy
- Progress percentage: Highest contrast, largest font
- Time remaining: Secondary emphasis
- File name: Tertiary
- Temperature adjustments: Clear labels, visible state

### Color Contrast
- All text meets WCAG AA standards
- Error state uses red (`--status-error`) with sufficient contrast
- Orange accent visible against dark background

---

## 10. Design Rationale

### Why This Works

1. **Matches existing WIP aesthetic**
   - Consistent with mockup in `interface.png`
   - Prusa orange branding maintained
   - Dark theme optimized for Raspberry Pi display

2. **Optimized for touch + distance viewing**
   - Large progress ring visible from ~3 feet away
   - Touch-anywhere interaction reduces precision requirements
   - Clear visual hierarchy guides attention

3. **Avoids UI thrash during errors**
   - No modals or forced navigation
   - Visual indicators only (badge color, ring freeze)
   - User maintains control

4. **Simple mental model**
   - *Look = Status screen*
   - *Tap = Control overlay*
   - Clear separation between monitoring and acting

5. **Performance-first**
   - GPU-only animations
   - Reuses existing components
   - Minimal DOM changes during updates

6. **Touch-optimized controls**
   - Step buttons avoid keyboard on touch interface
   - Large, well-spaced interactive elements
   - Immediate visual feedback

---

## 11. Implementation Notes

### Files to Create
- `src/views/StatusView.vue` — Main status screen component

### Files to Modify
- `src/router/index.ts` — Add `/status` route (if separate view)
- OR integrate into existing `HomeView.vue` printing state section

### Testing Requirements
1. **Unit tests:**
   - Status display updates with job data
   - Control interactions trigger correct store actions
   - Error states render correctly

2. **E2E tests:**
   - Navigate to status screen during print
   - Open control overlay
   - Pause/resume flow
   - Cancel with confirmation
   - Temperature adjustment

3. **Performance tests:**
   - Progress ring animation stays at 60fps
   - No layout thrashing during updates
   - Memory stable during 8-hour print simulation

### Deployment Considerations
- Test on actual Pi 4 with HyperPixel display
- Verify touch responsiveness
- Measure frame rates during active print
- Validate temperature graph rendering performance

---

## 12. Future Enhancements (Out of Scope)

These are explicitly **not** part of this design:

- ❌ Live camera preview (requires camera hardware)
- ❌ Layer-by-layer visualization (PrusaLink API limitation)
- ❌ Print speed adjustment (can be added later)
- ❌ Z-offset tuning during print (advanced feature)
- ❌ Filament change notifications (requires sensor)
- ❌ Print time estimation improvements (ML-based)

**YAGNI principle applied:** Build only what's specified. Add features based on user feedback after deployment.

---

## 13. Success Criteria

This design is successful when:

1. ✅ User can monitor print progress from 3 feet away
2. ✅ All controls accessible within 1 tap
3. ✅ Progress ring maintains 60fps animation
4. ✅ Error states are clear but non-intrusive
5. ✅ Temperature adjustments are quick and intuitive
6. ✅ Bundle size remains <300KB
7. ✅ Design matches mockup aesthetic
8. ✅ Touch targets meet 44px minimum
9. ✅ No layout shifts during state transitions
10. ✅ Works reliably on Pi 4 hardware

---

## Next Steps

**Ready for implementation.**

Recommended approach:
1. Create implementation plan with detailed tasks
2. Set up git worktree for isolated development
3. Implement using TDD (test → fail → code → pass)
4. Code review before merging to main
