# PrusaTouch Redesign - Complete Issue Summary

**Generated:** December 26, 2025
**Total Issues:** 24
**Status:** All issues created and tracked in BD

---

## 📊 Overview

This document provides a complete reference of all 24 redesign issues created during the design review session.

**Priority Breakdown:**
- **Priority 1 (Critical):** 7 issues - Foundation and bug fixes
- **Priority 2 (Standard):** 17 issues - Features and enhancements

**Category Breakdown:**
- **Layout/Foundation:** 4 issues
- **Components:** 6 issues
- **Visual Enhancement:** 5 issues
- **Files View:** 4 issues
- **Status View:** 5 issues
- **Specifications:** 2 issues
- **Performance:** 2 issues

---

## 🔴 Priority 1: Foundation & Critical (7 Issues)

### prusatouch-fhg - Extract KioskHeader component from App.vue
**Category:** Layout
**Phase:** 1
**Est. Time:** 1.5 hours

**Description:**
Create unified persistent header component matching redesign mockup. 3-column layout: Left (PRUSA logo + StatusBadge), Center (TemperatureDisplay for nozzle/bed), Right (ConnectStatusIndicator + settings gear). Must be 60px height, always visible across all views.

**Acceptance Criteria:**
- [ ] KioskHeader.vue component created
- [ ] 3-column layout implemented (left/center/right)
- [ ] Header is 60px height using --touch-comfortable
- [ ] Appears on all views (Files/Control/Status)
- [ ] Temperature display always visible
- [ ] Settings gear navigates to /settings

---

### prusatouch-ab4 - Extract KioskNav component from App.vue
**Category:** Layout
**Phase:** 1
**Est. Time:** 1 hour

**Description:**
Create bottom navigation component with 3 tabs (Files/Control/Status) instead of current 4 tabs. Active tab indicated by 3px orange underline. Must be 60px height, persistent across all views. Uses GPU-accelerated transform for sliding indicator.

**Acceptance Criteria:**
- [ ] KioskNav.vue component created
- [ ] 3 tabs only: Files, Control, Status
- [ ] Active tab shows 3px orange underline
- [ ] Underline animates with transform (GPU-accelerated)
- [ ] Height is 60px
- [ ] Tapping tab changes view

**Dependencies:**
- Blocks: prusatouch-6cj (StatusView printing state)
- Blocks: prusatouch-i8r (StatusView idle state)

---

### prusatouch-mfy - Rename HomeView to StatusView and update routing
**Category:** Layout
**Phase:** 1
**Est. Time:** 45 minutes

**Description:**
Rename HomeView.vue to StatusView.vue to align with new 3-tab navigation. Update router from '/' to '/status'. Settings view becomes header-only (no bottom nav tab). Update all imports and references.

**Acceptance Criteria:**
- [ ] HomeView.vue renamed to StatusView.vue
- [ ] Router updated: / → /status
- [ ] All imports updated
- [ ] Default route redirects to /status
- [ ] Settings accessible via header gear only
- [ ] No broken links or imports

---

### prusatouch-9nt - Create ConnectStatusIndicator component
**Category:** Component
**Phase:** 1
**Est. Time:** 30 minutes

**Description:**
Network status indicator for KioskHeader. Shows connection state with icon/dot. Must meet 44px minimum touch target. Should indicate online/offline/connecting states with appropriate colors (success/error/warning).

**Acceptance Criteria:**
- [ ] ConnectStatusIndicator.vue component created
- [ ] Shows green dot when connected
- [ ] Shows red dot when offline
- [ ] Optional: Shows yellow when connecting/retrying
- [ ] Minimum 44px touch target
- [ ] Uses CSS variables for colors

---

### prusatouch-dj5 - Fix TouchButton variant and size prop names to match spec
**Category:** Bug Fix
**Phase:** 1
**Est. Time:** 30 minutes

**Description:**
TouchButton.vue has incorrect prop values. Must fix: 1) Add 'tertiary' variant (currently only has primary/secondary/danger, missing tertiary). 2) Rename size values from 'small'/'medium'/'large' to 'min'/'comfortable'/'large' to match spec terminology. Component already uses correct CSS variables, just needs prop interface updates.

**Acceptance Criteria:**
- [ ] Add 'tertiary' variant to TouchButton
- [ ] Tertiary uses --bg-tertiary background
- [ ] Rename size prop: small → min
- [ ] Rename size prop: medium → comfortable
- [ ] Keep 'large' as-is
- [ ] Update all usages in codebase
- [ ] No visual regressions

---

### prusatouch-z8t - Fix ProgressRing animation to be GPU-only (stroke-dashoffset violation)
**Category:** Performance
**Phase:** 1
**Est. Time:** 45 minutes

**Description:**
ProgressRing.vue:86 animates stroke-dashoffset which is NOT GPU-accelerated, violating the strict GPU-only animation constraint (transform/opacity only). This could cause frame drops on Pi 4. Need to either: 1) Accept this as necessary for SVG progress animation (document exception), or 2) Find alternative GPU-accelerated approach.

**Acceptance Criteria:**
- [ ] Investigate stroke-dashoffset performance on Pi 4
- [ ] If performance OK: Document as acceptable exception
- [ ] If performance bad: Find alternative (CSS conic-gradient?)
- [ ] Maintain smooth progress ring animation
- [ ] 60 FPS maintained during printing

**Note:** May require accepting this as necessary SVG animation exception.

---

### prusatouch-day - Implement virtual scrolling in FilesView for performance
**Category:** Performance
**Phase:** 4
**Est. Time:** 2 hours

**Description:**
FilesView currently renders all files at once (v-for over all sortedFiles). Spec requires virtual scrolling for lists >50 items to maintain 60 FPS on Pi 4. Need to implement virtual scrolling using library or custom solution. Must work with scroll control buttons and thumbnail lazy loading.

**Acceptance Criteria:**
- [ ] Virtual scrolling implemented in FilesView
- [ ] Only visible items + buffer are rendered
- [ ] Works with scroll control buttons (3-row jump)
- [ ] Thumbnail lazy loading still works
- [ ] 60 FPS maintained with 100+ files
- [ ] Scroll position maintained on file selection

**Note:** Consider using vue-virtual-scroller or custom implementation.

---

## 🟡 Priority 2: Components (6 Issues)

### prusatouch-7sl - Create ExpandedFileView modal component
**Category:** Component
**Phase:** 2
**Est. Time:** 2 hours

**Description:**
Full-screen modal for file details, triggered by tapping FileListItem. Slides up from bottom using translateY transform. Shows: large thumbnail, print time (largest text, orange), filament used (length/weight), print settings (layer height, nozzle size). Bottom actions: Print Now (primary) + Cancel (secondary) buttons, both 60px height.

**Acceptance Criteria:**
- [ ] ExpandedFileView.vue component created
- [ ] Slides up from bottom (translateY 100% → 0)
- [ ] Shows large thumbnail preview
- [ ] Shows print time in large orange text
- [ ] Shows filament length and weight
- [ ] Shows layer height and nozzle size
- [ ] PRINT NOW button starts print
- [ ] CANCEL button closes modal
- [ ] GPU-only animations
- [ ] Triggered by tapping FileListItem

---

### prusatouch-vrf - Style ExpandedFileView field labels in uppercase with proper formatting
**Category:** Component
**Phase:** 2
**Est. Time:** 30 minutes

**Description:**
Mockup shows ExpandedFileView data fields with specific formatting: All field labels in uppercase ("PRINT TIME", "FILAMENT", "LAYER HEIGHT", "NOZZLE SIZE"). Data formats: "1 HOUR 15 MIN" (time), "14.2 m = 6.5 g" (filament), "0.2 mm" (layer), "0.4 mm" (nozzle). Print time should be largest text in orange. Enhances prusatouch-7sl with specific styling requirements.

**Acceptance Criteria:**
- [ ] Field labels in uppercase
- [ ] Print time format: "X HOUR Y MIN" or "Y MIN"
- [ ] Filament format: "X.X m = Y.Y g"
- [ ] Layer/nozzle format: "X.X mm"
- [ ] Print time is largest text
- [ ] Print time uses --prusa-orange color

---

### prusatouch-d97 - Update ProgressRing to show thumbnail preview inside ring
**Category:** Component
**Phase:** 2
**Est. Time:** 1 hour

**Description:**
Enhance ProgressRing component to optionally display print thumbnail in center (matching mockup). Thumbnail should be centered inside the ring, with progress percentage overlaid or positioned appropriately. Must maintain GPU-only animations.

**Acceptance Criteria:**
- [ ] ProgressRing accepts thumbnail URL prop
- [ ] Thumbnail centered inside ring
- [ ] Percentage overlaid on thumbnail or below
- [ ] Graceful fallback if no thumbnail
- [ ] GPU-only animations maintained
- [ ] Thumbnail scales appropriately with ring size

---

### prusatouch-9nt - Create ConnectStatusIndicator component
_(Listed in Priority 1 section above)_

---

### prusatouch-au4 - Add storage tabs to FilesView (PrusaLink/SD Card)
**Category:** Files
**Phase:** 4
**Est. Time:** 1 hour

**Description:**
Replace breadcrumbs with horizontal storage tabs. Two tabs: 'PRUSALINK' and 'SD CARD'. Active tab uses orange color. Tabs positioned at top of FilesView, match mockup design.

**Acceptance Criteria:**
- [ ] Horizontal tabs at top of FilesView
- [ ] Two tabs: "PRUSALINK" and "SD CARD"
- [ ] Active tab uses --prusa-orange
- [ ] Tapping tab switches storage source
- [ ] Tab text uppercase
- [ ] Clean transition between tabs

---

### prusatouch-chc - Add scroll control buttons to FilesView
**Category:** Files
**Phase:** 4
**Est. Time:** 1 hour

**Description:**
Add fixed vertical scroll buttons in left/right columns of FilesView. Tap triggers 3-row jump (240px). Hold for 500ms initiates repeated jumps. Provides reliable touch-based scrolling alternative to swipe gestures. Must work with virtual scrolling.

**Acceptance Criteria:**
- [ ] Scroll buttons in left/right columns
- [ ] Tap jumps 3 rows (240px or 180px depending on row height)
- [ ] Hold for 500ms → continuous scroll
- [ ] Release stops scrolling
- [ ] Works with virtual scrolling
- [ ] Arrows visible but not intrusive
- [ ] Touch target ≥ 44px

---

## ✨ Priority 2: Visual Enhancement (5 Issues)

### prusatouch-6bj - Add box-shadow depth to all buttons for visual pop
**Category:** Styling
**Phase:** 3
**Est. Time:** 30 minutes

**Description:**
TouchButton.vue currently has no shadows, making buttons appear flat. Add subtle box-shadow to create depth/elevation matching mockup design. Must use GPU-friendly shadows (box-shadow is composited). Primary buttons should have stronger shadow, secondary/tertiary lighter. Consider adding subtle inset shadow on :active state for pressed effect.

**Acceptance Criteria:**
- [ ] All TouchButtons have box-shadow
- [ ] Primary buttons: stronger shadow
- [ ] Secondary/tertiary: lighter shadow
- [ ] Active state: inset shadow (pressed effect)
- [ ] Shadows are subtle, not overwhelming
- [ ] Performance maintained (60 FPS)

---

### prusatouch-1br - Enhance primary button with gradient or glow effect
**Category:** Styling
**Phase:** 3
**Est. Time:** 30 minutes

**Description:**
Primary buttons (especially 'Select File to Print' CTA) need more visual impact. Mockup shows more vibrant orange appearance. Consider: 1) Subtle linear gradient (lighter orange at top), or 2) Box-shadow glow effect, or 3) Combination. CSS gradients and box-shadow are GPU-accelerated. Should make primary actions more eye-catching.

**Acceptance Criteria:**
- [ ] Primary buttons stand out more
- [ ] Use gradient OR glow OR both
- [ ] Orange remains vibrant
- [ ] GPU-accelerated (CSS gradient/box-shadow)
- [ ] Matches mockup "pop"
- [ ] Works on Pi 4 display

---

### prusatouch-37y - Add depth to cards and panels with borders/shadows
**Category:** Styling
**Phase:** 3
**Est. Time:** 45 minutes

**Description:**
FileListItem, StatusBadge, and other card/panel components need more depth. Mockup shows pronounced borders or subtle shadows creating layered effect. Current design is too flat. Add: 1) Stronger borders on cards (maybe 2px instead of 1px), 2) Subtle box-shadow on elevated elements, 3) Ensure proper background color differentiation (bg-primary vs bg-secondary vs bg-tertiary).

**Acceptance Criteria:**
- [ ] FileListItem has visible depth
- [ ] StatusBadge has border or shadow
- [ ] Other cards/panels enhanced
- [ ] Background colors properly layered
- [ ] Shadows subtle but noticeable
- [ ] Creates visual hierarchy

---

### prusatouch-5eg - Increase typography weight and contrast for punchier text
**Category:** Typography
**Phase:** 3
**Est. Time:** 30 minutes

**Description:**
Mockup typography appears bolder with stronger weight differentiation. Review and update: 1) Headings to use font-weight: 700 (currently 600 in some places), 2) Important data (temps, progress %) to be bolder, 3) Ensure proper text-primary vs text-secondary contrast ratios. May need to adjust global.css and component-specific styles.

**Acceptance Criteria:**
- [ ] Headings use font-weight: 700
- [ ] Important data is bold (temps, progress, etc.)
- [ ] Text hierarchy is clear
- [ ] Contrast ratios meet WCAG standards
- [ ] Punchier, more readable appearance

---

### prusatouch-6n2 - Enhance StatusBadge prominence and styling
**Category:** Styling
**Phase:** 3
**Est. Time:** 30 minutes

**Description:**
StatusBadge in mockup has better visual presence. Current implementation is functional but subdued. Consider: 1) Stronger background color (less transparent), 2) Subtle border or shadow, 3) Bolder text weight, 4) Review animation intensities (breathing, blinking) to match mockup energy. Badge should be immediately noticeable in header.

**Acceptance Criteria:**
- [ ] StatusBadge more prominent
- [ ] Stronger background (less transparent)
- [ ] Border or shadow added
- [ ] Text weight increased
- [ ] Animations reviewed/adjusted
- [ ] Immediately noticeable in header

---

## 🟡 Priority 2: Status View Features (5 Issues)

### prusatouch-txq - Show recent uploads in StatusView idle state (4 most recent files)
**Category:** Status
**Phase:** 5
**Est. Time:** 45 minutes

**Description:**
Instead of tracking print history (which PrusaLink doesn't provide), show "Recent Uploads" based on file modification timestamps. Sort filesStore.sortedFiles by m_timestamp (descending), take top 4 for 2x2 grid. Display thumbnail + filename label. No localStorage needed - data comes directly from API. Label section as "Recent Uploads" or "Recent Files".

**Acceptance Criteria:**
- [ ] Sort files by m_timestamp descending
- [ ] Take top 4 files
- [ ] Display in 2x2 grid
- [ ] Show thumbnail + filename
- [ ] Label section "Recent Uploads"
- [ ] Tapping opens ExpandedFileView

**Dependencies:**
- Blocks: prusatouch-i8r (grid layout)
- Blocks: prusatouch-2mh (filename labels)

---

### prusatouch-i8r - Add 2x2 recent prints grid to StatusView idle state
**Category:** Status
**Phase:** 5
**Est. Time:** 30 minutes

**Description:**
In StatusView idle state (when not printing), show 2x2 grid of 4 most recent completed jobs below the 'Select File to Print' CTA. Thumbnails should be ~100px square. Tapping a recent print opens ExpandedFileView for that file.

**Acceptance Criteria:**
- [ ] 2x2 grid below CTA button
- [ ] Thumbnails ~100px square
- [ ] Grid uses CSS Grid layout
- [ ] Proper spacing between items
- [ ] Tapping thumbnail opens ExpandedFileView
- [ ] Shows "Recent Uploads" label

**Dependencies:**
- Blocked by: prusatouch-txq (data source)
- Blocked by: prusatouch-ab4 (KioskNav)

---

### prusatouch-2mh - Add filename labels to recent prints thumbnails in StatusView
**Category:** Status
**Phase:** 5
**Est. Time:** 15 minutes

**Description:**
Mockup shows each thumbnail in the 2x2 recent prints grid has a filename label below it (e.g., "Files", "Tensor"). Current prusatouch-i8r issue mentions the grid but not the labels. Each thumbnail should display the filename truncated if needed, below the image. Tapping anywhere on the thumbnail+label should open ExpandedFileView.

**Acceptance Criteria:**
- [ ] Filename label below each thumbnail
- [ ] Text truncated if too long
- [ ] Centered below thumbnail
- [ ] Readable text size
- [ ] Tapping label also opens ExpandedFileView

**Dependencies:**
- Blocked by: prusatouch-txq (data source)

---

### prusatouch-6cj - Refactor StatusView printing state to match mockup layout
**Category:** Status
**Phase:** 5
**Est. Time:** 1 hour

**Description:**
Update printing state to use split layout: Left 50% (ProgressRing with thumbnail), Right 50% (vertical stack of control buttons). Controls: PAUSE/RESUME (orange, primary), STOP (red, with confirmation), Speed/Flow Override (tertiary). All buttons 60px height.

**Acceptance Criteria:**
- [ ] 50/50 split layout
- [ ] Left: ProgressRing with thumbnail
- [ ] Right: Vertical button stack
- [ ] PAUSE/RESUME button (orange)
- [ ] STOP button (red)
- [ ] TUNE button (tertiary)
- [ ] All buttons 60px height
- [ ] STOP shows confirmation dialog

**Dependencies:**
- Blocked by: prusatouch-ab4 (KioskNav for layout)

---

### prusatouch-nja - Clarify control button labels: TUNE vs Speed/Flow Override
**Category:** Specification
**Phase:** 5
**Est. Time:** 15 minutes

**Description:**
Mockup shows third printing control button labeled "TUNE" but specification document mentions "Speed/Flow Override". Need to decide: 1) Use "TUNE" to match mockup (simpler, clearer), or 2) Use "Speed/Flow Override" (more descriptive). This affects prusatouch-6cj implementation. Recommendation: Use "TUNE" to match mockup and PrusaLink terminology.

**Decision:** Use "TUNE" (matches mockup)

**Acceptance Criteria:**
- [ ] Button labeled "TUNE"
- [ ] Opens tune/adjust controls
- [ ] Matches mockup design

---

## 🟡 Priority 2: Specifications (2 Issues)

### prusatouch-0qv - Resolve FileListItem height specification (60px vs 80px)
**Category:** Specification
**Phase:** 4
**Est. Time:** 15 minutes

**Description:**
FileListItem currently uses 80px height, but spec has conflicting values: touch-comfortable is 60px (standard), but mockup/written spec shows FileListItem at 80px. Need to clarify intended height and update component accordingly. This affects scroll jump calculations (3-row jump) and overall list density.

**Decision Needed:**
- 60px: More items visible, matches touch-comfortable standard
- 80px: More spacious, easier to read metadata

**Recommendation:** 80px (more spacious for file metadata)

**Acceptance Criteria:**
- [ ] Height decision made
- [ ] FileListItem updated
- [ ] Scroll jump calculation updated
- [ ] Looks good on device

---

### prusatouch-9j3 - Load IBM Plex Sans font for Prusa Core One aesthetic
**Category:** Typography
**Phase:** 3
**Est. Time:** 30 minutes

**Description:**
Spec references "Prusa Core One aesthetic" which uses IBM Plex Sans. Currently using system font stack. Need to: 1) Add IBM Plex Sans font loading (Google Fonts or self-hosted), 2) Update global.css font-family stack, 3) Ensure fallback fonts still work. Consider bundle size impact on 300KB budget.

**Acceptance Criteria:**
- [ ] IBM Plex Sans loaded (Google Fonts or self-hosted)
- [ ] global.css font-family updated
- [ ] Fallback fonts specified
- [ ] Bundle size checked (< 300KB)
- [ ] Font displays correctly on Pi 4

**Note:** Consider using font subsetting to reduce size.

---

## 📋 Quick Reference

### By Phase

**Phase 1 (Foundation):** 7 issues
- prusatouch-dj5, prusatouch-fhg, prusatouch-9nt, prusatouch-ab4, prusatouch-mfy, prusatouch-z8t, prusatouch-0qv (decision)

**Phase 2 (Components):** 3 issues
- prusatouch-7sl, prusatouch-vrf, prusatouch-d97

**Phase 3 (Visual):** 6 issues
- prusatouch-6bj, prusatouch-1br, prusatouch-37y, prusatouch-5eg, prusatouch-6n2, prusatouch-9j3

**Phase 4 (FilesView):** 4 issues
- prusatouch-au4, prusatouch-chc, prusatouch-day, prusatouch-0qv (implementation)

**Phase 5 (StatusView):** 5 issues
- prusatouch-txq, prusatouch-i8r, prusatouch-2mh, prusatouch-6cj, prusatouch-nja

### By Category

**Layout:** prusatouch-fhg, prusatouch-ab4, prusatouch-mfy
**Components:** prusatouch-7sl, prusatouch-vrf, prusatouch-d97, prusatouch-9nt
**Visual:** prusatouch-6bj, prusatouch-1br, prusatouch-37y, prusatouch-5eg, prusatouch-6n2
**Files:** prusatouch-au4, prusatouch-chc, prusatouch-day
**Status:** prusatouch-txq, prusatouch-i8r, prusatouch-2mh, prusatouch-6cj
**Specs:** prusatouch-0qv, prusatouch-nja
**Typography:** prusatouch-9j3
**Bug Fix:** prusatouch-dj5
**Performance:** prusatouch-z8t, prusatouch-day

---

## 🎯 Next Steps

1. Review this summary
2. Begin Phase 1 implementation
3. Track progress in BD: `bd list --labels redesign`
4. Update issue status as work completes

**All issues tracked in BD. Use `bd show prusatouch-XXX` for full details.**
