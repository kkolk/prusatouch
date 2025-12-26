# PrusaTouch Redesign - Implementation Plan

**Version:** 1.0
**Date:** December 26, 2025
**Status:** Ready for Implementation
**Total Issues:** 24

---

## 📋 Executive Summary

This plan outlines the recommended implementation order for the 24 redesign issues, organized into 5 phases with clear dependencies and parallelization opportunities.

**Estimated Total Effort:** 3-4 development days
**Critical Path:** Phase 1 → Phase 2 → Phase 4
**Parallelizable Work:** Phase 3 (Visual Polish) can run alongside Phase 2/4

---

## 🎯 Implementation Strategy

### Principles
1. **Foundation First** - Layout/structure before features
2. **Fix Bugs Early** - Critical fixes before new components
3. **Parallelize Visual Polish** - Styling can happen alongside feature work
4. **Test Incrementally** - Verify each phase on device before proceeding

### Dependencies
- Phase 1 blocks Phase 2 (layout changes affect all views)
- Phase 2 enables Phase 4 (components needed for features)
- Phase 3 is independent (can run in parallel)
- Phase 5 is final polish (after everything works)

---

## 📅 Phase 1: Foundation & Critical Fixes (Day 1)

**Goal:** Establish new layout structure and fix critical bugs
**Duration:** 4-6 hours
**Can Deploy:** No (breaking changes)

### Tasks

| Priority | Issue ID | Task | Est. Time | Notes |
|----------|----------|------|-----------|-------|
| 🔴 P1 | prusatouch-dj5 | Fix TouchButton variant/size props | 30 min | Quick fix, unblocks all button usage |
| 🔴 P1 | prusatouch-fhg | Extract KioskHeader component | 1.5 hrs | 3-column layout, persistent header |
| 🔴 P1 | prusatouch-9nt | Create ConnectStatusIndicator | 30 min | Simple dot/icon for header |
| 🔴 P1 | prusatouch-ab4 | Extract KioskNav component | 1 hr | 3-tab nav, orange underline |
| 🔴 P1 | prusatouch-mfy | Rename HomeView → StatusView | 45 min | File/route updates, imports |
| 🔴 P1 | prusatouch-z8t | Fix ProgressRing GPU animation | 45 min | Investigate stroke-dashoffset issue |

**Deliverable:** New layout working with 3 views (Files/Control/Status)

**Testing:**
- [ ] Header shows on all 3 views
- [ ] Bottom nav switches between Files/Control/Status
- [ ] Temps always visible in header
- [ ] Settings gear opens SettingsView
- [ ] All buttons render correctly (tertiary variant works)

---

## 📅 Phase 2: Core Components (Day 2 Morning)

**Goal:** Build missing components needed for features
**Duration:** 3-4 hours
**Can Deploy:** No (features incomplete)

### Tasks

| Priority | Issue ID | Task | Est. Time | Notes |
|----------|----------|------|-----------|-------|
| 🟡 P2 | prusatouch-7sl | Create ExpandedFileView modal | 2 hrs | Full-screen modal, slide-up animation |
| 🟡 P2 | prusatouch-vrf | Style ExpandedFileView labels | 30 min | Uppercase labels, data formatting |
| 🟡 P2 | prusatouch-d97 | Update ProgressRing (thumbnail inside) | 1 hr | Center thumbnail, overlay percentage |

**Deliverable:** ExpandedFileView and enhanced ProgressRing ready

**Testing:**
- [ ] Tapping file list item opens ExpandedFileView
- [ ] Modal slides up smoothly (GPU animation)
- [ ] Data fields show correct formats (1 HOUR 15 MIN, etc.)
- [ ] PRINT NOW button starts print
- [ ] CANCEL button closes modal
- [ ] ProgressRing shows thumbnail during printing

---

## 📅 Phase 3: Visual Polish (Day 2 Afternoon - PARALLEL)

**Goal:** Add depth, shadows, and visual enhancement
**Duration:** 2-3 hours
**Can Deploy:** Yes (incremental improvements)

**NOTE:** This phase can run in parallel with Phase 2/4 if multiple developers available.

### Tasks

| Priority | Issue ID | Task | Est. Time | Notes |
|----------|----------|------|-----------|-------|
| 🟡 P2 | prusatouch-6bj | Add box-shadow to all buttons | 30 min | Subtle depth on all TouchButtons |
| 🟡 P2 | prusatouch-1br | Enhance primary button gradient/glow | 30 min | Orange gradient or glow effect |
| 🟡 P2 | prusatouch-37y | Add depth to cards/panels | 45 min | Shadows on FileListItem, badges, etc. |
| 🟡 P2 | prusatouch-5eg | Increase typography weight | 30 min | Bolder headings, data values |
| 🟡 P2 | prusatouch-6n2 | Enhance StatusBadge prominence | 30 min | Stronger background, border, weight |
| 🟡 P2 | prusatouch-9j3 | Load IBM Plex Sans font | 30 min | Add font, update global.css |

**Deliverable:** UI matches mockup "pop" and visual depth

**Testing:**
- [ ] Buttons have subtle shadows
- [ ] Primary buttons stand out visually
- [ ] Cards have layered depth
- [ ] Text is punchier and more readable
- [ ] StatusBadge is immediately noticeable
- [ ] Font loads correctly (fallback works)

---

## 📅 Phase 4: FilesView Enhancements (Day 3 Morning)

**Goal:** Complete Files screen with tabs, scrolling, and recent uploads
**Duration:** 3-4 hours
**Can Deploy:** Partially (after each task)

### Tasks

| Priority | Issue ID | Task | Est. Time | Notes |
|----------|----------|------|-----------|-------|
| 🟡 P2 | prusatouch-au4 | Add storage tabs (PrusaLink/SD Card) | 1 hr | Horizontal tabs, active state |
| 🟡 P2 | prusatouch-chc | Add scroll control buttons | 1 hr | Left/right arrows, 3-row jump |
| 🔴 P1 | prusatouch-day | Implement virtual scrolling | 2 hrs | Performance for >50 files |
| 🟡 P2 | prusatouch-0qv | Resolve FileListItem height | 15 min | Decision: 60px or 80px |

**Deliverable:** Performant, complete Files view

**Testing:**
- [ ] Storage tabs switch between PrusaLink/SD Card
- [ ] Scroll arrows jump 3 rows (240px)
- [ ] Hold arrow for continuous scroll
- [ ] Virtual scrolling works with 100+ files
- [ ] File list maintains 60 FPS on Pi 4
- [ ] Thumbnail lazy loading still works

---

## 📅 Phase 5: StatusView Features (Day 3 Afternoon)

**Goal:** Complete Status view with recent uploads and printing controls
**Duration:** 2-3 hours
**Can Deploy:** Yes (final features)

### Tasks

| Priority | Issue ID | Task | Est. Time | Notes |
|----------|----------|------|-----------|-------|
| 🟡 P2 | prusatouch-txq | Show recent uploads (4 files) | 45 min | Sort by m_timestamp, 2x2 grid |
| 🟡 P2 | prusatouch-i8r | Add 2x2 recent prints grid layout | 30 min | Grid styling, spacing |
| 🟡 P2 | prusatouch-2mh | Add filename labels to thumbnails | 15 min | Truncate long names |
| 🟡 P2 | prusatouch-6cj | Refactor printing state layout | 1 hr | 50/50 split, button stack |
| 🟡 P2 | prusatouch-nja | Clarify TUNE vs Speed/Flow Override | 15 min | Decision: use "TUNE" |

**Deliverable:** Complete Status view matching mockup

**Testing:**
- [ ] Recent uploads show 4 most recent files
- [ ] Tapping recent upload opens ExpandedFileView
- [ ] Printing state shows progress ring + controls
- [ ] PAUSE/STOP/TUNE buttons work correctly
- [ ] Layout is 50% progress ring, 50% buttons
- [ ] All interactions feel smooth (60 FPS)

---

## 🎯 Recommended Implementation Order

### Scenario 1: Single Developer (Sequential)

**Day 1:**
1. Phase 1 (Foundation) - 4-6 hours
2. Start Phase 2 (Components) - 2 hours

**Day 2:**
3. Finish Phase 2 (Components) - 2 hours
4. Phase 3 (Visual Polish) - 2-3 hours
5. Start Phase 4 (FilesView) - 2 hours

**Day 3:**
6. Finish Phase 4 (FilesView) - 2 hours
7. Phase 5 (StatusView) - 2-3 hours
8. **Integration testing on Pi 4** - 1 hour

### Scenario 2: Parallel Development

**Developer A:**
- Day 1: Phase 1 (Foundation)
- Day 2: Phase 2 (Components)
- Day 3: Phase 4 (FilesView)

**Developer B:**
- Day 1: Wait for Phase 1
- Day 2: Phase 3 (Visual Polish)
- Day 3: Phase 5 (StatusView)

**Total Time:** 2 days instead of 3

---

## 🚀 Deployment Strategy

### Safe Deployment Points

1. **After Phase 1** - DO NOT deploy (breaking changes, incomplete)
2. **After Phase 2** - DO NOT deploy (features incomplete)
3. **After Phase 3** - CAN deploy (visual improvements only)
4. **After Phase 4** - CAN deploy (FilesView complete)
5. **After Phase 5** - SHOULD deploy (full redesign complete)

### Rollback Plan

Keep current `master` branch stable:
1. Create `feature/redesign` branch for all work
2. Deploy to Pi 4 for testing before merging
3. If issues found, revert to `master` via auth-helper restart

---

## ⚠️ Critical Success Factors

### Must Have Before Deployment

- [ ] **Performance verified on Pi 4** (60 FPS maintained)
- [ ] **All animations GPU-only** (transform/opacity)
- [ ] **Bundle size < 300KB** (check after Phase 3 font addition)
- [ ] **Virtual scrolling working** (test with 100+ files)
- [ ] **Touch targets ≥ 44px** (verify on actual device)

### Known Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| IBM Plex Sans increases bundle size | Medium | Use font subsetting or defer to later |
| Virtual scrolling breaks thumbnails | High | Test thoroughly, may need custom solution |
| ProgressRing GPU fix breaks animation | Medium | May need to accept stroke-dashoffset exception |
| Pi 4 performance degrades | High | Profile each phase, revert if FPS drops |

---

## 📊 Progress Tracking

Use BD to track progress:

```bash
# View all redesign issues
bd list --labels redesign --status open

# View current phase
bd list --labels phase-1 --status open

# Mark task complete
bd close prusatouch-dj5

# View blocked tasks
bd blocked --labels redesign
```

### Phase Completion Checklist

- [ ] **Phase 1 Complete** - New layout working, critical bugs fixed
- [ ] **Phase 2 Complete** - ExpandedFileView and ProgressRing ready
- [ ] **Phase 3 Complete** - Visual polish matches mockup
- [ ] **Phase 4 Complete** - FilesView performant and complete
- [ ] **Phase 5 Complete** - StatusView features implemented

---

## 🎓 Lessons Learned (Update After Completion)

_To be filled in during implementation:_

### What Worked Well
-

### Challenges Faced
-

### Would Do Differently
-

---

## 📚 References

- **Design Spec:** `docs/redesign-concepts.png`
- **Written Spec:** Design specification document (in user message)
- **Issue Tracker:** `bd list --labels redesign`
- **CLAUDE.md:** Project guidelines and constraints
- **API Spec:** `spec/openapi.yaml` and `spec/README.md`

---

**Next Steps:** Begin Phase 1 implementation in next session.
