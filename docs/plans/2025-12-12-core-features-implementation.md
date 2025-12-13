# PrusaTouch Core Features Implementation Plan

**Date:** 2025-12-12
**Status:** Design Complete, Ready for Implementation
**Goal:** Implement complete core functionality for touch-optimized printer control

## Executive Summary

This plan defines the core features for PrusaTouch based on PrusaLink's functionality, optimized for the HyperPixel 4 touch display (800x480). Focus is on intuitive touch interactions and essential printer control workflows.

## Design Principles

1. **Touch-First:** Large targets (60px+), tap-to-control interactions
2. **Workflow-Optimized:** Common tasks (filament change, print monitoring) are streamlined
3. **Safety-Focused:** Temperature checks, confirmations for destructive actions
4. **Performance:** 60fps animations, <300KB bundle, <400MB RAM
5. **No File Upload:** Interface is for monitoring and control, not file management

## Navigation Structure

**3 Main Tabs:**
- **Home** - Status monitoring and print control
- **Control** - Manual printer controls (movement, homing)
- **Settings** - App preferences and system info

**Overlays/Modals:**
- **File Browser** - Full-screen overlay for selecting files to print
- **Temperature Control** - Bottom sheet for setting nozzle/bed temperatures
- **Extruder Controls** - Bottom sheet for extrude/retract operations

## Feature Details

### 1. Home View

**When Printer is IDLE:**

```
┌─────────────────────────────────────────┐
│  [IDLE]           Settings ⚙️           │
├─────────────────────────────────────────┤
│                                         │
│  🔥 Nozzle: 14°C / 0°C  [Tappable]    │
│  🛏️  Bed:    14°C / 0°C  [Tappable]    │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │                                   │ │
│  │   📁 Select File to Print        │ │
│  │                                   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [Optional: Small temperature graph]   │
│                                         │
├─────────────────────────────────────────┤
│  🏠 Home    🎮 Control    ⚙️ Settings  │
└─────────────────────────────────────────┘
```

**When PRINTING:**

```
┌─────────────────────────────────────────┐
│  [PRINTING]       Settings ⚙️           │
├─────────────────────────────────────────┤
│  🔥 210°C/215°C  🛏️ 58°C/60°C [Tap]   │
│                                         │
│       ╔═══════════════╗                │
│       ║               ║                │
│       ║      47%      ║  Progress Ring │
│       ║               ║                │
│       ╚═══════════════╝                │
│                                         │
│       test_benchy.gcode                │
│       1h 23m remaining                 │
│       Layer 142/287                    │
│                                         │
│  ┌──────────┐  ┌──────────┐           │
│  │  ⏸ Pause │  │ ⏹ Stop   │           │
│  └──────────┘  └──────────┘           │
│                                         │
│  [Temperature graph - last 10 min]     │
├─────────────────────────────────────────┤
│  🏠 Home    🎮 Control    ⚙️ Settings  │
└─────────────────────────────────────────┘
```

**Interactions:**
- Tap temperature displays → Opens Temperature Control bottom sheet
- "Select File to Print" → Opens File Browser overlay
- Pause → Pauses print, button changes to "Resume"
- Stop → Shows confirmation dialog → Stops print

**Data Displayed:**
- Printer status (IDLE, PRINTING, PAUSED, ERROR, FINISHED)
- Current/target nozzle temperature
- Current/target bed temperature
- Print progress percentage (when printing)
- Time remaining (when printing)
- Current filename (when printing)
- Layer progress (when printing)
- Print speed percentage (optional)
- Temperature history graph

### 2. Temperature Control Bottom Sheet

**Triggered by:** Tapping nozzle or bed temperature display

```
┌─────────────────────────────────────────┐
│  Set Nozzle Temperature            [×]  │
├─────────────────────────────────────────┤
│                                         │
│  Current: 14°C  →  Target: 215°C       │
│                                         │
│  Quick Presets:                         │
│  ┌─────┐ ┌──────┐ ┌─────┐ ┌─────┐    │
│  │ PLA │ │ PETG │ │ ABS │ │ Off │    │
│  │215°C│ │ 240°C│ │255°C│ │  0°C│    │
│  └─────┘ └──────┘ └─────┘ └─────┘    │
│                                         │
│  Custom Temperature:                    │
│  ┌─────────────────┐                   │
│  │      215        │  [Number Pad]     │
│  └─────────────────┘                   │
│                                         │
│  ┌──────────┐  ┌──────────┐           │
│  │   Set    │  │  Cancel  │           │
│  └──────────┘  └──────────┘           │
└─────────────────────────────────────────┘
```

**Features:**
- Shows current and target temperature
- Quick preset buttons (PLA 215°C, PETG 240°C, ABS 255°C, Off 0°C)
- Custom temperature input with number pad
- Separate controls for nozzle vs. bed (context-aware based on what was tapped)
- Visual heating indicator when temperature is rising
- Set/Cancel buttons

### 3. File Browser Overlay

**Triggered by:** "Select File to Print" button on Home view

```
┌─────────────────────────────────────────┐
│  [←] Select File to Print          [×]  │
├─────────────────────────────────────────┤
│                                         │
│  Local Storage                    ▼     │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ [📷] benchy.gcode                 │ │
│  │      2.4 MB • Est. 1h 45m         │ │
│  ├───────────────────────────────────┤ │
│  │ [📷] calibration_cube.gcode       │ │
│  │      856 KB • Est. 23m            │ │
│  ├───────────────────────────────────┤ │
│  │ [📷] part_replacement.gcode       │ │
│  │      5.2 MB • Est. 3h 12m         │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [Pull to refresh]                      │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- Full-screen overlay (slides up from bottom)
- Storage selector dropdown (Local/SD Card if multiple available)
- File list with 80px tall rows
- Each row shows:
  - Thumbnail (64x64px, lazy loaded)
  - Filename
  - File size and estimated print time
- Tap file → Start print confirmation dialog
- Pull-to-refresh gesture
- Virtual scrolling for long lists (>50 items)
- Back button and close button return to Home
- Empty state: "No files found"

**Start Print Confirmation:**
```
┌─────────────────────────────────────────┐
│  Start Print?                           │
├─────────────────────────────────────────┤
│  File: benchy.gcode                     │
│  Size: 2.4 MB                           │
│  Est. Time: 1h 45m                      │
│                                         │
│  ┌──────────┐  ┌──────────┐           │
│  │  Start   │  │  Cancel  │           │
│  └──────────┘  └──────────┘           │
└─────────────────────────────────────────┘
```

### 4. Control View - Movement Panel

```
┌─────────────────────────────────────────┐
│  Printer Control          Settings ⚙️   │
├─────────────────────────────────────────┤
│  Position: X: 125.0  Y: 105.0  Z: 15.2  │
│                                         │
│              ┌───┐                      │
│              │ ▲ │         ┌───┐       │
│              └───┘         │ ▲ │  Z    │
│         ┌───┐   ┌───┐     └───┘       │
│         │ ◄ │   │ ► │                  │
│         └───┘   └───┘     ┌───┐       │
│              ┌───┐         │ ▼ │       │
│              │ ▼ │         └───┘       │
│              └───┘                      │
│                                         │
│  Move Step:                             │
│  ┌─────┐ ┌────┐ ┌─────┐ ┌──────┐      │
│  │ 0.1 │ │ 1  │ │ 10  │ │ 100  │ mm   │
│  └─────┘ └────┘ └─────┘ └──────┘      │
│                                         │
│  ┌──────────────┐ ┌─────────────────┐ │
│  │  Home All    │ │ Disable Steppers│ │
│  └──────────────┘ └─────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │     Extruder Controls             │ │
│  └───────────────────────────────────┘ │
├─────────────────────────────────────────┤
│  🏠 Home    🎮 Control    ⚙️ Settings  │
└─────────────────────────────────────────┘
```

**Features:**
- Current position display (X, Y, Z) - always visible at top
- Large directional pad for X/Y movement (80px+ touch targets)
- Separate Z-axis up/down buttons
- Move step selector (0.1mm, 1mm, 10mm, 100mm) - pill buttons
- "Home All" button - homes all axes
- Individual axis homing (optional - in submenu or long-press)
- "Disable Steppers" button - allows manual movement
- "Extruder Controls" button - opens bottom sheet

**API Endpoints:**
- `POST /api/v1/job/move` - Move axes
- `POST /api/v1/job/home` - Home axes
- `POST /api/v1/stepper/disable` - Disable stepper motors

### 5. Extruder Controls Bottom Sheet

**Triggered by:** "Extruder Controls" button on Control view

```
┌─────────────────────────────────────────┐
│  Extruder Controls                 [×]  │
├─────────────────────────────────────────┤
│                                         │
│  Nozzle: 215°C / 215°C ✓               │
│                                         │
│  Heat Nozzle:                           │
│  ┌─────┐ ┌──────┐ ┌─────┐ ┌─────┐    │
│  │ PLA │ │ PETG │ │ ABS │ │ Off │    │
│  │215°C│ │ 240°C│ │255°C│ │  0°C│    │
│  └─────┘ └──────┘ └─────┘ └─────┘    │
│                                         │
│  ┌───────────────┐  ┌───────────────┐ │
│  │   Extrude     │  │   Retract     │ │
│  │      ↓        │  │      ↑        │ │
│  └───────────────┘  └───────────────┘ │
│                                         │
│  Amount:                                │
│  ┌────┐ ┌────┐ ┌─────┐ ┌─────┐       │
│  │ 1  │ │ 5  │ │ 10  │ │ 25  │ mm    │
│  └────┘ └────┘ └─────┘ └─────┘       │
│                                         │
│  Speed: ───────●────── 100%            │
│                                         │
└─────────────────────────────────────────┘
```

**When Nozzle Too Cold (<170°C):**

```
┌─────────────────────────────────────────┐
│  Extruder Controls                 [×]  │
├─────────────────────────────────────────┤
│                                         │
│  ⚠️ Nozzle too cold - Heat to 170°C    │
│  Current: 14°C                          │
│                                         │
│  Heat Nozzle:                           │
│  ┌─────┐ ┌──────┐ ┌─────┐ ┌─────┐    │
│  │ PLA │ │ PETG │ │ ABS │ │ Off │    │
│  └─────┘ └──────┘ └─────┘ └─────┘    │
│                                         │
│  ┌───────────────┐  ┌───────────────┐ │
│  │   Extrude     │  │   Retract     │ │ ← DISABLED
│  │      ↓        │  │      ↑        │ │
│  └───────────────┘  └───────────────┘ │
│  (grayed out, disabled)                │
└─────────────────────────────────────────┘
```

**Features:**
- Current nozzle temperature display
- Temperature preset buttons (PLA 215°C, PETG 240°C, ABS 255°C, Off)
- Large Extrude/Retract buttons
- Amount selector (1mm, 5mm, 10mm, 25mm)
- Speed control slider (50-200%)
- **Safety: Extrude/Retract buttons LOCKED if temp < 170°C**
- Visual states:
  - **Cold (<170°C)**: Buttons disabled, warning visible
  - **Heating (170°C+, below target)**: Buttons enabled, orange indicator
  - **Ready (at target)**: Buttons enabled, green indicator

**API Endpoints:**
- `POST /api/v1/job/extrude` - Extrude filament
- `POST /api/v1/job/retract` - Retract filament
- Temperature setting uses same endpoint as Temperature Control bottom sheet

### 6. Settings View

```
┌─────────────────────────────────────────┐
│  Settings                               │
├─────────────────────────────────────────┤
│                                         │
│  Display                                │
│  ┌───────────────────────────────────┐ │
│  │ Brightness: ──────●──── 80%       │ │
│  │ Screensaver: 5 minutes       ▼    │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Network                                │
│  ┌───────────────────────────────────┐ │
│  │ IP Address: 192.168.1.100         │ │
│  │ Hostname: octopi.local            │ │
│  │ PrusaConnect: ● Linked            │ │
│  └───────────────────────────────────┘ │
│                                         │
│  System                                 │
│  ┌───────────────────────────────────┐ │
│  │ PrusaLink: v2.1.2                 │ │
│  │ PrusaTouch: v0.1.0                │ │
│  │ Hardware: Raspberry Pi 4 Model B  │ │
│  │ Memory: 245 MB / 1024 MB          │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌──────────────┐  ┌─────────────────┐ │
│  │ Clear Cache  │  │ Restart Interface│ │
│  └──────────────┘  └─────────────────┘ │
├─────────────────────────────────────────┤
│  🏠 Home    🎮 Control    ⚙️ Settings  │
└─────────────────────────────────────────┘
```

**Features:**

**Display Settings:**
- Brightness slider (20-100%)
- Screensaver timeout dropdown (1min, 5min, 10min, Never)

**Network Information (Read-only):**
- IP address
- Hostname
- PrusaConnect status (Linked/Not Linked)

**System Information (Read-only):**
- PrusaLink version
- PrusaTouch version
- Raspberry Pi model
- Memory usage

**Actions:**
- Clear Cache button - Clears file list cache, thumbnails
- Restart Interface button - Reloads the application

## API Requirements

### Existing API Endpoints (Already Implemented)

From `spec/openapi.yaml`:
- `GET /api/v1/status` - Printer status
- `GET /api/v1/job` - Current job info
- `GET /api/v1/files/{storage}` - File list
- `GET /api/v1/storage` - Available storage locations

### New API Endpoints Needed

**Print Control:**
- `POST /api/v1/job/{id}/pause` - Pause print
- `POST /api/v1/job/{id}/resume` - Resume print
- `DELETE /api/v1/job/{id}` - Stop print
- `POST /api/v1/files/{storage}/{path}` - Start print from file

**Movement Control:**
- `POST /api/v1/printer/printhead` - Move printhead (X, Y, Z)
- `POST /api/v1/printer/home` - Home axes
- `POST /api/v1/printer/stepper` - Enable/disable steppers

**Temperature Control:**
- `POST /api/v1/printer/tool` - Set nozzle temperature
- `POST /api/v1/printer/bed` - Set bed temperature

**Extruder Control:**
- `POST /api/v1/printer/tool/extrude` - Extrude filament
- `POST /api/v1/printer/tool/retract` - Retract filament

**Note:** Verify these endpoints against PrusaLink API documentation and update `spec/openapi.yaml` accordingly.

## Component Requirements

### New Components Needed

1. **ProgressRing.vue** - Circular progress indicator (from original design)
2. **BottomSheet.vue** - Modal overlay from bottom (from original design)
3. **TemperatureControl.vue** - Temperature setting panel
4. **ExtruderControl.vue** - Extruder operations panel
5. **FileBrowser.vue** - File selection overlay
6. **FileListItem.vue** - File row with thumbnail
7. **DirectionalPad.vue** - Movement control pad
8. **ConfirmDialog.vue** - Confirmation dialogs
9. **NumberPad.vue** - Numeric input (optional, could use native input)

### Enhanced Components

1. **TemperatureDisplay.vue** - Make tappable, add visual states
2. **StatusBadge.vue** - Add more states (ERROR, FINISHED)
3. **TouchButton.vue** - Already implemented, may need variants

## Store Enhancements

### printerStore

**Add actions:**
- `setNozzleTemp(target)` - Set nozzle target temperature
- `setBedTemp(target)` - Set bed target temperature
- `moveAxis(axis, distance)` - Move X/Y/Z axis
- `homeAxes(axes)` - Home one or more axes
- `disableSteppers()` - Disable stepper motors

### jobStore

**Add actions:**
- `pauseJob()` - Pause current print
- `resumeJob()` - Resume paused print
- `stopJob()` - Stop current print (with confirmation)
- `startPrint(storage, path)` - Start print from file

**Add getters:**
- `currentLayer` - Parse from job metadata
- `totalLayers` - Parse from job metadata
- `printSpeed` - Current print speed percentage

### filesStore

**Already implemented, ensure these work:**
- `fetchFiles(storage, path)` - Get file list
- `cacheThumbnail(path, dataUrl)` - Store thumbnail (LRU, max 50)

**Add if missing:**
- `getThumbnail(storage, path)` - Fetch file thumbnail
- `getFileDetails(storage, path)` - Get file metadata

## Implementation Phases

### Phase 1: Home View Enhancements
**Goal:** Complete print monitoring and basic control

**Tasks:**
1. Add print progress display (progress ring, time remaining, filename)
2. Implement pause/resume/stop buttons
3. Add layer info display
4. Implement temperature graph component
5. Add tappable temperature displays
6. Create Temperature Control bottom sheet

**Dependencies:** ProgressRing component, BottomSheet component, job control API endpoints

### Phase 2: File Browser
**Goal:** File selection and print starting

**Tasks:**
1. Create FileBrowser overlay component
2. Implement FileListItem with thumbnails
3. Add storage selector
4. Implement file thumbnail loading and caching
5. Add start print confirmation dialog
6. Wire up "Select File to Print" button

**Dependencies:** FileBrowser component, FileListItem component, ConfirmDialog component, start print API

### Phase 3: Control View - Movement
**Goal:** Manual printer control

**Tasks:**
1. Create DirectionalPad component
2. Implement move step selector
3. Add position display
4. Wire up movement API calls
5. Implement home buttons
6. Add disable steppers button

**Dependencies:** DirectionalPad component, movement API endpoints

### Phase 4: Extruder Controls
**Goal:** Filament change workflow

**Tasks:**
1. Create ExtruderControl bottom sheet
2. Implement temperature presets
3. Add extrude/retract buttons with safety checks
4. Implement amount selector
5. Add speed control
6. Wire up extruder API calls

**Dependencies:** ExtruderControl component, extrude/retract API endpoints

### Phase 5: Settings View
**Goal:** App configuration

**Tasks:**
1. Implement brightness slider
2. Add screensaver timeout selector
3. Display network information
4. Display system information
5. Implement clear cache action
6. Add restart interface action

**Dependencies:** System info API, localStorage for preferences

### Phase 6: Polish & Testing
**Goal:** Production readiness

**Tasks:**
1. Add loading states for all async operations
2. Implement error handling and offline behavior
3. Add animations and transitions
4. Test on actual hardware (HyperPixel 4)
5. Performance testing (60fps, memory usage)
6. E2E tests for critical workflows

## Success Criteria

- ✅ Can monitor print progress in real-time
- ✅ Can pause, resume, and stop prints
- ✅ Can select and start prints from file browser
- ✅ Can manually move printer axes
- ✅ Can set nozzle and bed temperatures
- ✅ Can extrude/retract filament safely
- ✅ Temperature controls are intuitive and safe
- ✅ All interactions work smoothly on touch screen
- ✅ Performance: 60fps animations, <300KB bundle, <400MB RAM
- ✅ Handles network errors gracefully
- ✅ Works offline with cached data

## Non-Goals (Future Enhancements)

- File upload (use PrusaSlicer or main PrusaLink interface)
- Camera live feed (Phase 2 feature)
- Print queue management
- Advanced statistics and analytics
- Multi-language support
- Custom themes

## Technical Constraints

**Performance Requirements:**
- 60fps animations on Pi 4
- Bundle size < 300KB gzipped
- Memory usage < 400MB
- Only animate `transform` and `opacity` (GPU-accelerated)

**Touch Requirements:**
- Minimum touch target: 44px
- Comfortable touch target: 60px
- Large action buttons: 80px

**Display:**
- Resolution: 800x480
- Orientation: Landscape only
- Always-on display with screensaver

## Questions for Implementation

1. Should we add haptic feedback for button presses (if supported)?
2. Should temperature presets be configurable or hardcoded?
3. Should we show a "heating" progress indicator when waiting for target temp?
4. Should individual axis homing be in a submenu or always visible?
5. Should we cache file list or always fetch fresh?
6. What should happen if network disconnects during a print?

## Next Steps

1. Review and approve this design
2. Create detailed implementation tasks in bd (beads)
3. Update OpenAPI spec with new endpoints
4. Begin Phase 1 implementation
5. Test each phase on actual hardware before proceeding
