# PrusaTouch - Custom Touch Interface for PrusaLink

**Date:** December 3, 2024  
**Target Hardware:** Raspberry Pi 4 Model B (1GB RAM) with HyperPixel 4 (800x480)  
**Printer:** Prusa MK3S+  
**Project Type:** Showcase AI Development Project

## Executive Summary

PrusaTouch is a custom-built touchscreen interface for PrusaLink, optimized for the HyperPixel 4 display. This project demonstrates modern web development practices while working within the constraints of Raspberry Pi 4 hardware. The interface is inspired by OctoDash's workflow patterns and styled after the Prusa Core One aesthetic.

## Project Goals

1. **Primary Goal:** Create a touch-optimized interface for PrusaLink to control Prusa MK3S+ locally
2. **Secondary Goal:** Showcase AI-assisted development from architecture to implementation
3. **Technical Goal:** Achieve 60fps performance on Pi 4 with 1GB RAM
4. **Design Goal:** Match Prusa Core One visual aesthetic (orange accent, dark theme, clean typography)

## Architecture Overview

### Tech Stack

| Component | Technology | Justification |
|-----------|-----------|---------------|
| Framework | Vue 3 (Composition API) | Lower memory footprint than React, efficient reactivity system |
| Build Tool | Vite 5.x | 5-6x faster builds than Webpack, optimized for development |
| Language | TypeScript 5.x | Type safety from OpenAPI spec auto-generation |
| Styling | Custom CSS + CSS Variables | No framework overhead, GPU-accelerated animations only |
| State Management | Pinia | Official Vue state management, lightweight |
| API Client | openapi-typescript-codegen | Auto-generated from PrusaLink OpenAPI spec |
| HTTP | Axios | Retry logic, interceptors for auth |
| Testing | Vitest + Playwright | Fast unit tests, reliable E2E |

### Why This Stack for Pi 4?

This combination prioritizes:
- **Bundle size:** Target < 300KB gzipped
- **Memory efficiency:** Vue's reactivity uses less RAM than React's Virtual DOM
- **Build speed:** Vite's dev server starts in < 1s
- **Performance:** CSS animations leverage Pi 4's VideoCore VI GPU

### Project Structure

```
prusatouch/
├── src/
│   ├── api/              # Auto-generated from OpenAPI spec
│   │   ├── client.ts
│   │   ├── models/
│   │   └── services/
│   ├── assets/
│   │   ├── icons/        # Prusa-styled icons
│   │   └── images/
│   ├── components/
│   │   ├── TouchButton.vue
│   │   ├── ProgressRing.vue
│   │   ├── TemperatureDisplay.vue
│   │   ├── FileListItem.vue
│   │   ├── StatusBadge.vue
│   │   └── BottomSheet.vue
│   ├── views/
│   │   ├── KioskMode.vue
│   │   ├── HomeView.vue
│   │   ├── FilesView.vue
│   │   └── SettingsView.vue
│   ├── composables/
│   │   ├── useStatus.ts      # Printer status polling
│   │   ├── useJob.ts         # Job management
│   │   ├── useFiles.ts       # File browser logic
│   │   ├── useToast.ts       # Notifications
│   │   └── useConnection.ts  # Network health
│   ├── stores/
│   │   ├── printer.ts        # printerStore
│   │   ├── job.ts            # jobStore
│   │   └── files.ts          # filesStore
│   ├── styles/
│   │   ├── variables.css     # Design tokens
│   │   ├── animations.css    # GPU-accelerated only
│   │   └── global.css
│   ├── router/
│   │   └── index.ts
│   ├── App.vue
│   └── main.ts
├── spec/
│   └── openapi.yaml          # PrusaLink OpenAPI spec
├── tests/
│   ├── unit/
│   └── e2e/
├── public/
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## UI/UX Design

### Target Display Specifications

- **Resolution:** 800x480 pixels
- **Size:** 4.0 inches diagonal
- **Touch:** Capacitive multi-touch
- **Refresh Rate:** 60 FPS
- **Orientation:** Landscape only

### Design Principles

1. **Touch-First:** Minimum 44x44px touch targets (Apple HIG standard)
2. **Information Density:** Balance at-a-glance status with detailed control
3. **Prusa Aesthetic:** Orange (#FF6600) accent, dark theme, clean sans-serif
4. **Performance:** 60fps animations, instant touch feedback

### Screen Modes

#### 1. Kiosk Mode (Screensaver/Idle)
**Purpose:** Always-on display showing basic status

**Layout:**
- Full-screen printer status
- Large printer name: "Prusa MK3S+"
- Current temperatures (nozzle/bed) in orange
- Prusa logo watermark (30% opacity)
- "Tap to wake" hint at bottom

**Behavior:**
- Activates after 5 minutes of inactivity
- Dims screen to 20% brightness
- Shows clock and temps only
- Single tap anywhere wakes to Home screen

#### 2. Home Screen (Active State)
**Purpose:** Main control interface

**Top Bar (60px):**
- Status badge (IDLE/PRINTING/PAUSED with icon)
- Current temps: Nozzle (🔥) and Bed (🛏️) in orange
- PrusaConnect indicator (WiFi icon, green when connected)
- Settings gear icon (top right)

**Main Content (360px):**

**When Idle:**
- Large "Select File to Print" button (250x80px, orange)
- "Recent Prints" section with 4 thumbnail grid (120x120px each)

**When Printing:**
- Print preview thumbnail (300x300px)
- Progress ring around preview showing percentage
- Large percentage text (48px) in center
- Time remaining below (18px)
- Current filename (20px, truncated if needed)

**Bottom Navigation (60px):**
- Three equal tabs: Files | Control | Status
- Active tab has orange top border (3px)
- Icons with labels
- Smooth slide animation on tab change

#### 3. Print Control Screen
**Accessed via:** Control tab while printing

**Layout:**
- Print preview at top
- Progress ring with percentage
- Time remaining (large, center)
- Control buttons:
  - Pause/Resume (left, orange when active)
  - Stop (right, red, requires confirmation)
- Live stats grid below:
  - Current layer / Total layers
  - Nozzle temp (current/target)
  - Bed temp (current/target)
  - Print speed %
  - Flow rate %
- Small temperature history graph (last 10 minutes)

#### 4. File Browser Screen
**Purpose:** Navigate and select G-code files

**Top Bar:**
- Back button (← arrow)
- Breadcrumb path: "Files / Local Storage / examples"

**Main Content:**
- File list with 80px tall rows
- Each row shows:
  - Thumbnail (64x64px, lazy loaded)
  - Filename (18px, bold)
  - File size and estimated print time (14px, gray)
- Pull-to-refresh gesture
- Long-press (500ms) for context menu:
  - Print
  - Delete (with confirmation)
  - View Details

**Bottom:**
- Storage selector if multiple available (SD/Local/USB)
- Same bottom nav as Home screen

#### 5. Settings Screen
**Purpose:** Configuration and info

**Layout:**
- Back button in top bar
- List of settings items (70px tall each):
  - Screen Brightness (slider, 20-100%)
  - Screensaver Timeout (dropdown: 1/5/10/never)
  - PrusaConnect Status (indicator)
  - Network Info (IP address, hostname)
  - PrusaLink Version
  - Check for Updates button
  - About section (hardware info, Pi model, memory)

### Navigation Flow

**Screen Transitions:**
- Swipe left/right between Files/Control/Status tabs
- Tap top bar to return to Home from any screen
- Settings accessible via gear icon from any screen
- Browser back button (if available) for navigation history

**Animations:**
- Screen transitions: 300ms slide with fade
- Tab switches: 200ms slide indicator
- Button press: 100ms scale to 0.95
- All use `transform` and `opacity` only (GPU-accelerated)

## State Management

### Pinia Stores

#### printerStore
**Responsibility:** Core printer telemetry and status

**State:**
```typescript
{
  status: StatusPrinter | null,
  connection: {
    connected: boolean,
    lastUpdate: Date | null,
    retryCount: number
  },
  polling: {
    interval: number,  // 2000ms printing, 5000ms idle
    enabled: boolean
  }
}
```

**Actions:**
- `fetchStatus()` - GET /api/v1/status
- `startPolling()` - Begin auto-refresh
- `stopPolling()` - Stop auto-refresh
- `handleError()` - Connection error recovery

**Getters:**
- `isConnected` - Boolean connection state
- `isPrinting` - Derived from state === 'PRINTING'
- `secondsSinceUpdate` - Time since last successful fetch

#### jobStore
**Responsibility:** Active print job management

**State:**
```typescript
{
  currentJob: Job | null,
  history: Job[],  // Last 10 completed jobs
  control: {
    pauseInProgress: boolean,
    stopInProgress: boolean
  }
}
```

**Actions:**
- `fetchJob()` - GET /api/v1/job
- `pauseJob(id)` - PUT /api/v1/job/{id}/pause
- `resumeJob(id)` - PUT /api/v1/job/{id}/resume
- `stopJob(id)` - DELETE /api/v1/job/{id} (with confirmation)
- `addToHistory(job)` - Store completed job

**Getters:**
- `progressPercent` - Job progress as number
- `timeRemainingFormatted` - "1h 23m" format
- `currentLayer` - Parse from job metadata

#### filesStore
**Responsibility:** File system navigation

**State:**
```typescript
{
  storages: Storage[],
  currentPath: string,
  currentStorage: string,
  files: FileInfo[],
  thumbnailCache: Map<string, string>,  // path -> data URL
  loading: boolean
}
```

**Actions:**
- `fetchStorages()` - GET /api/v1/storage
- `fetchFiles(storage, path)` - GET /api/v1/files/{storage}/{path}
- `startPrint(storage, path)` - POST /api/v1/files/{storage}/{path}
- `deleteFile(storage, path)` - DELETE /api/v1/files/{storage}/{path}
- `cacheThumbnail(path, dataUrl)` - Store in memory (LRU, max 50)

**Getters:**
- `breadcrumbs` - Array of path segments for navigation
- `sortedFiles` - Files sorted by type, then name

### Data Flow Pattern

```
User Interaction
      ↓
  Component
      ↓
  Composable (useStatus, useJob, useFiles)
      ↓
  Pinia Store Action
      ↓
  API Client (auto-generated)
      ↓
  Axios HTTP Request
      ↓
  PrusaLink Backend
      ↓
  Response → Store State Update → Vue Reactivity → Component Re-render
```

### Key Composables

#### useStatus()
```typescript
// Polls /api/v1/status with smart interval
export function useStatus() {
  const store = usePrinterStore()
  
  onMounted(() => store.startPolling())
  onUnmounted(() => store.stopPolling())
  
  return {
    status: computed(() => store.status),
    isConnected: computed(() => store.isConnected),
    lastUpdate: computed(() => store.connection.lastUpdate)
  }
}
```

#### useJob()
```typescript
// Manages active job with control actions
export function useJob() {
  const store = useJobStore()
  
  const pause = async () => {
    if (!store.currentJob) return
    await store.pauseJob(store.currentJob.id)
  }
  
  const stop = async () => {
    // Show confirmation dialog first
    const confirmed = await showConfirmDialog('Stop print?')
    if (confirmed && store.currentJob) {
      await store.stopJob(store.currentJob.id)
    }
  }
  
  return {
    job: computed(() => store.currentJob),
    progress: computed(() => store.progressPercent),
    pause,
    stop
  }
}
```

#### useFiles()
```typescript
// File browser logic with navigation
export function useFiles() {
  const store = useFilesStore()
  
  const navigate = (path: string) => {
    store.currentPath = path
    store.fetchFiles(store.currentStorage, path)
  }
  
  const goUp = () => {
    const parts = store.currentPath.split('/')
    parts.pop()
    navigate(parts.join('/') || '/')
  }
  
  return {
    files: computed(() => store.sortedFiles),
    path: computed(() => store.currentPath),
    breadcrumbs: computed(() => store.breadcrumbs),
    navigate,
    goUp,
    loading: computed(() => store.loading)
  }
}
```

## Component Design

### Design Tokens (CSS Variables)

```css
:root {
  /* Prusa Core One Colors */
  --prusa-orange: #ff6600;
  --prusa-orange-hover: #ff8833;
  --prusa-orange-active: #cc5200;
  
  /* Dark Theme Base */
  --bg-primary: #1a1a1a;
  --bg-secondary: #2a2a2a;
  --bg-tertiary: #3a3a3a;
  --bg-overlay: rgba(0, 0, 0, 0.8);
  
  /* Text Colors */
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-tertiary: rgba(255, 255, 255, 0.5);
  
  /* Status Colors */
  --status-success: #00ff00;
  --status-warning: #ffaa00;
  --status-error: #cc0000;
  --status-info: #0099ff;
  
  /* Touch Targets */
  --touch-min: 44px;
  --touch-comfortable: 60px;
  --touch-large: 80px;
  
  /* Spacing */
  --space-xs: 5px;
  --space-sm: 10px;
  --space-md: 20px;
  --space-lg: 40px;
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  
  /* Transitions */
  --transition-fast: 0.1s;
  --transition-normal: 0.2s;
  --transition-slow: 0.3s;
}
```

### GPU-Accelerated Animation Rules

**CRITICAL:** Only these properties may be animated:
- `transform` (translate, scale, rotate)
- `opacity`

**NEVER animate:**
- width, height, margin, padding
- color, background-color, border-color
- top, left, right, bottom (use transform instead)

**Rationale:** These trigger layout/paint on CPU. Pi 4's VideoCore VI GPU handles transform/opacity natively.

### Core Components

#### TouchButton.vue
**Purpose:** Large, touch-friendly button with visual feedback

**Props:**
```typescript
{
  variant: 'primary' | 'secondary' | 'danger'
  size: 'medium' | 'large'
  loading: boolean
  disabled: boolean
}
```

**Behavior:**
- Active state: scale(0.95) for 100ms
- Loading: Shows spinner, disabled for interaction
- Minimum 44px height, 60px for comfortable, 80px for large

**Styles:**
```css
.touch-button {
  min-height: var(--touch-comfortable);
  padding: 15px 30px;
  border-radius: var(--radius-md);
  font-size: 18px;
  font-weight: bold;
  transition: transform var(--transition-fast);
}

.touch-button:active:not(:disabled) {
  transform: scale(0.95);
}

.touch-button--primary {
  background: var(--prusa-orange);
  color: white;
}

.touch-button--primary:hover {
  background: var(--prusa-orange-hover);
}
```

#### ProgressRing.vue
**Purpose:** Circular progress indicator for print progress

**Props:**
```typescript
{
  progress: number  // 0-100
  size: number      // diameter in pixels
  strokeWidth: number
  color: string
}
```

**Implementation:**
- SVG circle with animated `stroke-dasharray`
- Center slot for content (percentage, time)
- Smooth transition on progress updates (300ms)

**SVG Technique:**
```html
<svg :width="size" :height="size">
  <circle
    :r="radius"
    :cx="size / 2"
    :cy="size / 2"
    fill="none"
    :stroke="backgroundColor"
    :stroke-width="strokeWidth"
  />
  <circle
    :r="radius"
    :cx="size / 2"
    :cy="size / 2"
    fill="none"
    :stroke="color"
    :stroke-width="strokeWidth"
    :stroke-dasharray="dashArray"
    stroke-linecap="round"
    :style="{ transition: 'stroke-dasharray 0.3s' }"
    transform="rotate(-90)"
    transform-origin="center"
  />
</svg>
```

#### TemperatureDisplay.vue
**Purpose:** Show current/target temperature with visual state

**Props:**
```typescript
{
  current: number
  target: number
  type: 'nozzle' | 'bed'
  icon: string
}
```

**Visual States:**
- **Cold** (< 40°C): Gray text
- **Heating** (current < target): Orange text, pulsing opacity
- **At Target** (within 2°C): Green text
- **Cooling** (current > target): Blue text

**Pulsing Animation:**
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.temp-heating {
  color: var(--prusa-orange);
  animation: pulse 2s ease-in-out infinite;
}
```

#### FileListItem.vue
**Purpose:** Touch-friendly file row with thumbnail and metadata

**Props:**
```typescript
{
  file: FileInfo | PrintFileInfo
  thumbnailUrl: string | null
}
```

**Behavior:**
- Tap: Select/navigate
- Long press (500ms): Show context menu
- Swipe left: Quick delete (with undo toast)

**Layout:**
```
[ 64x64 Thumbnail ] [ Filename (18px bold)      ] [ > ]
                     [ Size • Est. time (14px) ]
```

Height: 80px with 10px margin-bottom

#### StatusBadge.vue
**Purpose:** Animated printer state indicator

**Props:**
```typescript
{
  state: 'IDLE' | 'PRINTING' | 'PAUSED' | 'ERROR' | 'FINISHED'
}
```

**Animations:**
- **PRINTING:** Breathing animation (opacity pulse)
- **PAUSED:** Blinking orange dot
- **ERROR:** Shake animation on state change
- **FINISHED:** Fade-in green checkmark

#### BottomSheet.vue
**Purpose:** Modal overlay from bottom for confirmations

**Props:**
```typescript
{
  visible: boolean
  title: string
}
```

**Behavior:**
- Slides up from bottom (transform: translateY)
- Semi-transparent backdrop (opacity: 0.8)
- Dismiss on backdrop click or ESC key
- Trap focus within sheet when open

**Animation:**
```css
.bottom-sheet-enter-active,
.bottom-sheet-leave-active {
  transition: transform var(--transition-slow);
}

.bottom-sheet-enter-from,
.bottom-sheet-leave-to {
  transform: translateY(100%);
}
```

## Error Handling & Offline Behavior

### Connection States

1. **Connected:** Green indicator, normal polling
2. **Retrying:** Yellow indicator, exponential backoff (1s, 2s, 4s)
3. **Offline:** Red indicator, stop polling, show last known values

### Error Handling Strategy

#### API Call Failures

**Network Errors (ECONNREFUSED, timeout):**
1. First failure: Silent retry after 1s
2. Second failure: Retry after 2s, show toast "Connection issue..."
3. Third failure: Show banner "PrusaLink Offline", stop polling
4. Recovery: Auto-resume polling when connection restored

**Implementation:**
```typescript
async function fetchWithRetry(fn: () => Promise<any>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await sleep(Math.pow(2, i) * 1000)  // 1s, 2s, 4s
      if (i === 1) showToast('Connection issue, retrying...')
    }
  }
}
```

**HTTP Status Codes:**

| Code | Meaning | User Feedback | Action |
|------|---------|---------------|--------|
| 401 | Unauthorized | "Authentication Required" modal | Prompt for API key |
| 404 | Not Found | "File not found" toast | Refresh file list |
| 409 | Conflict | "Printer is busy" toast | Refresh status |
| 503 | Service Unavailable | "PrusaLink is updating" banner | Wait and retry |

### Offline UI Behavior

**Top Banner:**
```
⚠️ PrusaLink Offline - Last update 32s ago
```

**Display State:**
- Show last known values in dimmed/gray color
- Disable all control actions (buttons grayed out)
- File browser shows cached list with "Can't refresh while offline"
- Temperature displays show "---" if data stale (> 60s)

**Auto-Recovery:**
- Background ping every 5s to detect reconnection
- When connection restored: Show "Connected" toast, resume normal polling
- Refresh all data immediately on reconnection

### Local Storage Caching

**Cached Data:**
```typescript
localStorage.setItem('prusatouch:lastStatus', JSON.stringify({
  status: printer.status,
  timestamp: Date.now()
}))

localStorage.setItem('prusatouch:preferences', JSON.stringify({
  brightness: 80,
  screensaverTimeout: 300000,  // 5 minutes
  theme: 'dark'
}))

localStorage.setItem('prusatouch:jobHistory', JSON.stringify(
  jobs.slice(0, 10)  // Last 10 jobs
))
```

**TTL Strategy:**
- Status cache: 30 seconds
- File list cache: 5 minutes
- Preferences: No expiry
- Job history: No expiry

**Security Note:** Never cache API keys in localStorage. Use browser's credential storage or prompt on startup if needed.

### Loading States

Every async operation shows immediate feedback:

**File List Loading:**
```html
<!-- Skeleton rows while loading -->
<div class="file-item-skeleton">
  <div class="skeleton-thumbnail shimmer"></div>
  <div class="skeleton-text shimmer"></div>
</div>
```

**Button Actions:**
```html
<TouchButton :loading="pauseInProgress">
  {{ pauseInProgress ? 'Pausing...' : 'Pause' }}
</TouchButton>
```

**Status Polling:**
- Subtle pulse on connection indicator (opacity 0.6 to 1.0)
- No intrusive spinners for background polling

## Performance Optimization

### Bundle Size Target

**Goal:** < 300KB gzipped JavaScript

**Strategy:**
1. Tree-shaking: Vite automatically removes unused code
2. Code splitting: Lazy load Settings and Files views
3. No component libraries: Custom components only
4. Minimal dependencies: Vue + Pinia + Axios only

### Vite Configuration

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [vue()],
  
  build: {
    target: 'es2020',
    minify: 'terser',
    cssCodeSplit: true,
    terserOptions: {
      compress: {
        drop_console: true,  // Remove console.log in production
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-vue': ['vue', 'pinia'],
          'vendor-api': ['axios'],
          'views-lazy': [
            './src/views/FilesView.vue',
            './src/views/SettingsView.vue'
          ]
        }
      }
    }
  },
  
  optimizeDeps: {
    include: ['vue', 'pinia', 'axios']
  },
  
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',  // PrusaLink backend
        changeOrigin: true
      }
    }
  }
})
```

### Lazy Loading

```typescript
// router/index.ts
const router = createRouter({
  routes: [
    {
      path: '/',
      component: () => import('../views/HomeView.vue')
    },
    {
      path: '/files',
      component: () => import('../views/FilesView.vue')  // Lazy loaded
    },
    {
      path: '/settings',
      component: () => import('../views/SettingsView.vue')  // Lazy loaded
    }
  ]
})
```

### Image Optimization

**Thumbnail Loading:**
```typescript
// Lazy load thumbnails as user scrolls
<img 
  :src="thumbnailUrl" 
  loading="lazy"
  @error="handleThumbnailError"
/>

// LRU cache for thumbnails (max 50 items)
const thumbnailCache = new Map<string, string>()

function cacheThumbnail(path: string, dataUrl: string) {
  if (thumbnailCache.size >= 50) {
    const firstKey = thumbnailCache.keys().next().value
    thumbnailCache.delete(firstKey)
  }
  thumbnailCache.set(path, dataUrl)
}
```

### DOM Optimization

**Virtual Scrolling:**
For file lists > 50 items, use virtual scrolling:
```typescript
// Only render visible items + buffer
const visibleFiles = computed(() => {
  const start = Math.max(0, scrollTop - bufferSize)
  const end = Math.min(files.length, scrollTop + viewportHeight + bufferSize)
  return files.slice(start, end)
})
```

**Avoid Re-renders:**
```typescript
// Memoize expensive computations
const formattedTime = computed(() => {
  if (!job.value) return ''
  return formatDuration(job.value.time_remaining)
})

// Use v-once for static content
<div v-once>{{ printerModel }}</div>
```

### Memory Management

**Cleanup on Component Unmount:**
```typescript
onMounted(() => {
  const interval = setInterval(fetchStatus, 2000)
  
  onUnmounted(() => {
    clearInterval(interval)
    store.stopPolling()
  })
})
```

**Limit Historical Data:**
```typescript
// Temperature graph: Keep last 100 data points only
const tempHistory = ref<TempReading[]>([])

function addTempReading(reading: TempReading) {
  tempHistory.value.push(reading)
  if (tempHistory.value.length > 100) {
    tempHistory.value.shift()
  }
}
```

### Browser Configuration for Pi

**Chromium Kiosk Mode:**
```bash
#!/bin/bash
# /home/pi/start-prusatouch.sh

# Wait for network
sleep 10

# Start Chromium in kiosk mode
chromium-browser \
  --kiosk \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --disable-features=TranslateUI \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --check-for-update-interval=604800 \
  --enable-gpu-rasterization \
  --disable-smooth-scrolling \
  --disable-background-timer-throttling \
  http://localhost:8080
```

**Autostart Configuration:**
```bash
# ~/.config/lxsession/LXDE-pi/autostart
@xset s off
@xset -dpms
@xset s noblank
@/home/pi/start-prusatouch.sh
```

### Performance Monitoring

**Development Tools:**
```typescript
// Performance marks for key operations
performance.mark('status-fetch-start')
await fetchStatus()
performance.mark('status-fetch-end')
performance.measure('status-fetch', 'status-fetch-start', 'status-fetch-end')

// Log slow operations in dev
if (import.meta.env.DEV) {
  const measures = performance.getEntriesByType('measure')
  measures.forEach(m => {
    if (m.duration > 100) {
      console.warn(`Slow operation: ${m.name} took ${m.duration}ms`)
    }
  })
}
```

**Production Monitoring:**
- Monitor frame rate with `requestAnimationFrame`
- Alert if FPS < 45 for > 3 seconds
- Automatically disable complex animations if performance degrades

**Hardware Monitoring:**
```bash
# Monitor Pi temperature
vcgencmd measure_temp

# Monitor memory usage
free -h

# Target: Stay under 70°C and < 400MB RAM usage
```

## Testing Strategy

### Unit Tests (Vitest)

**Store Tests:**
```typescript
// tests/unit/stores/printer.spec.ts
describe('printerStore', () => {
  it('starts polling on mount', async () => {
    const store = usePrinterStore()
    store.startPolling()
    expect(store.polling.enabled).toBe(true)
  })
  
  it('handles connection errors gracefully', async () => {
    const store = usePrinterStore()
    const mockError = new Error('Network error')
    vi.spyOn(api, 'getStatus').mockRejectedValue(mockError)
    
    await store.fetchStatus()
    
    expect(store.connection.connected).toBe(false)
    expect(store.connection.retryCount).toBe(1)
  })
  
  it('updates polling interval based on printer state', () => {
    const store = usePrinterStore()
    
    store.status = { state: 'PRINTING' }
    expect(store.polling.interval).toBe(2000)
    
    store.status = { state: 'IDLE' }
    expect(store.polling.interval).toBe(5000)
  })
})
```

**Component Tests:**
```typescript
// tests/unit/components/TouchButton.spec.ts
describe('TouchButton', () => {
  it('applies scale transform on active state', async () => {
    const wrapper = mount(TouchButton, {
      props: { variant: 'primary' }
    })
    
    await wrapper.trigger('mousedown')
    expect(wrapper.element.style.transform).toBe('scale(0.95)')
  })
  
  it('shows loading spinner when loading prop is true', () => {
    const wrapper = mount(TouchButton, {
      props: { loading: true }
    })
    
    expect(wrapper.find('.spinner').exists()).toBe(true)
    expect(wrapper.attributes('disabled')).toBeDefined()
  })
})
```

**Composable Tests:**
```typescript
// tests/unit/composables/useStatus.spec.ts
describe('useStatus', () => {
  it('starts polling on mount and stops on unmount', () => {
    const { unmount } = mount({
      setup() {
        useStatus()
        return () => h('div')
      }
    })
    
    const store = usePrinterStore()
    expect(store.polling.enabled).toBe(true)
    
    unmount()
    expect(store.polling.enabled).toBe(false)
  })
})
```

### E2E Tests (Playwright)

**Critical User Flows:**
```typescript
// tests/e2e/print-workflow.spec.ts
test('complete print workflow', async ({ page }) => {
  await page.goto('http://localhost:8080')
  
  // Wake from kiosk mode
  await page.click('body')
  await expect(page.locator('text=Select File to Print')).toBeVisible()
  
  // Navigate to files
  await page.click('text=Files')
  await expect(page.locator('.file-list-item').first()).toBeVisible()
  
  // Select a file
  await page.click('.file-list-item:first-child')
  
  // Verify print started (mock backend would return PRINTING state)
  await expect(page.locator('text=PRINTING')).toBeVisible()
  await expect(page.locator('.progress-ring')).toBeVisible()
})

test('pause and resume print', async ({ page }) => {
  // Setup: Already printing
  await page.goto('http://localhost:8080')
  
  await page.click('button:has-text("Pause")')
  await expect(page.locator('text=PAUSED')).toBeVisible()
  
  await page.click('button:has-text("Resume")')
  await expect(page.locator('text=PRINTING')).toBeVisible()
})

test('stop print with confirmation', async ({ page }) => {
  await page.goto('http://localhost:8080')
  
  await page.click('button:has-text("Stop")')
  
  // Confirmation dialog appears
  await expect(page.locator('text=Stop print?')).toBeVisible()
  await page.click('button:has-text("Confirm")')
  
  await expect(page.locator('text=IDLE')).toBeVisible()
})
```

**Performance Tests:**
```typescript
// tests/e2e/performance.spec.ts
test('maintains 60fps during animations', async ({ page }) => {
  await page.goto('http://localhost:8080')
  
  // Start performance monitoring
  await page.evaluate(() => {
    let frameCount = 0
    let lastTime = performance.now()
    
    function countFrames() {
      frameCount++
      const now = performance.now()
      if (now - lastTime >= 1000) {
        window.fps = frameCount
        frameCount = 0
        lastTime = now
      }
      requestAnimationFrame(countFrames)
    }
    countFrames()
  })
  
  // Trigger navigation animation
  await page.click('text=Files')
  await page.waitForTimeout(1000)
  
  const fps = await page.evaluate(() => window.fps)
  expect(fps).toBeGreaterThanOrEqual(50) // Allow some margin, target is 60
})

test('file list scrolls smoothly with 100 items', async ({ page }) => {
  // Mock API to return 100 files
  await page.route('**/api/v1/files/**', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({
        children: Array(100).fill(null).map((_, i) => ({
          name: `file_${i}.gcode`,
          type: 'PRINT_FILE',
          size: 1024 * 1024,
          m_timestamp: Date.now()
        }))
      })
    })
  })
  
  await page.goto('http://localhost:8080')
  await page.click('text=Files')
  
  // Scroll to bottom and measure performance
  const scrollTime = await page.evaluate(() => {
    const start = performance.now()
    window.scrollTo(0, document.body.scrollHeight)
    return performance.now() - start
  })
  
  expect(scrollTime).toBeLessThan(500) // Should be nearly instant
})
```

### Manual Testing Checklist

**On Target Hardware (Raspberry Pi 4 with HyperPixel 4):**

- [ ] Kiosk mode activates after 5 minutes of inactivity
- [ ] Touch targets are easily tappable (no mis-taps)
- [ ] Animations run smoothly at ~60fps
- [ ] Screen brightness control works
- [ ] Long-press gesture triggers context menu (500ms)
- [ ] Swipe gestures navigate between tabs
- [ ] Temperature updates reflect real printer state
- [ ] File thumbnails load without blocking UI
- [ ] Large file lists (100+) scroll smoothly
- [ ] Print progress ring animates smoothly
- [ ] Network disconnection shows offline banner
- [ ] Reconnection auto-resumes polling
- [ ] Memory usage stays under 400MB during extended use
- [ ] Pi temperature stays under 70°C
- [ ] Interface remains responsive after 24h uptime

## Deployment

### Build Process

```bash
# Development
npm install
npm run dev

# Production build
npm run build

# Output: dist/ directory with optimized static files
```

### Deployment to Raspberry Pi

**Option 1: Serve with PrusaLink (Recommended)**

PrusaLink can serve static files. Place build output in PrusaLink's web directory:

```bash
# Build on development machine
npm run build

# Copy to Pi
scp -r dist/* pi@prusa-mk3s.local:/usr/share/prusalink/web/

# PrusaLink serves from http://localhost:8080/
```

**Option 2: Separate Web Server**

If PrusaLink doesn't serve static files well, use nginx:

```bash
# Install nginx
sudo apt install nginx

# Copy build output
sudo cp -r dist/* /var/www/html/prusatouch/

# Configure nginx
sudo nano /etc/nginx/sites-available/prusatouch
```

**nginx.conf:**
```nginx
server {
  listen 80;
  server_name localhost;
  
  root /var/www/html/prusatouch;
  index index.html;
  
  # Proxy API requests to PrusaLink
  location /api/ {
    proxy_pass http://localhost:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
  
  # Serve static files
  location / {
    try_files $uri $uri/ /index.html;
  }
  
  # Cache static assets
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

### Autostart Configuration

**Launch Chromium in Kiosk Mode on Boot:**

```bash
# Create startup script
nano /home/pi/start-prusatouch.sh
```

**start-prusatouch.sh:**
```bash
#!/bin/bash

# Wait for X server and network
sleep 10

# Disable screen blanking
xset s off
xset -dpms
xset s noblank

# Hide mouse cursor after 3s of inactivity
unclutter -idle 3 -root &

# Start Chromium in kiosk mode
chromium-browser \
  --kiosk \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --disable-features=TranslateUI \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-suggestions-service \
  --disable-translate \
  --disable-save-password-bubble \
  --disable-session-crashed-bubble \
  --check-for-update-interval=604800 \
  --enable-gpu-rasterization \
  --enable-features=VaapiVideoDecoder \
  --disable-smooth-scrolling \
  --disable-background-timer-throttling \
  http://localhost:8080
```

```bash
chmod +x /home/pi/start-prusatouch.sh
```

**Autostart Entry:**
```bash
nano ~/.config/lxsession/LXDE-pi/autostart
```

Add:
```
@/home/pi/start-prusatouch.sh
```

### System Optimization

**Reduce Memory Usage:**
```bash
# Edit config.txt
sudo nano /boot/config.txt

# Reduce GPU memory (we need more for system)
gpu_mem=128

# Overclock slightly (optional, monitor temps)
over_voltage=2
arm_freq=1750
```

**Disable Unnecessary Services:**
```bash
# Disable Bluetooth if not needed
sudo systemctl disable bluetooth

# Disable unused services
sudo systemctl disable triggerhappy
sudo systemctl disable avahi-daemon
```

## Maintenance & Updates

### Updating PrusaTouch

```bash
# Pull latest code
git pull origin main

# Rebuild
npm run build

# Copy to Pi
scp -r dist/* pi@prusa-mk3s.local:/var/www/html/prusatouch/

# Clear browser cache
# (Touch settings icon → Clear cache, or restart Chromium)
```

### Monitoring

**System Health Script:**
```bash
#!/bin/bash
# /home/pi/health-check.sh

echo "=== PrusaTouch Health Check ==="
echo "Date: $(date)"
echo ""

echo "CPU Temperature:"
vcgencmd measure_temp

echo ""
echo "Memory Usage:"
free -h | grep Mem

echo ""
echo "Disk Usage:"
df -h | grep root

echo ""
echo "PrusaLink Status:"
systemctl status prusalink | grep Active

echo ""
echo "Chromium Process:"
ps aux | grep chromium | head -1
```

Run periodically:
```bash
# Add to crontab
crontab -e

# Check every hour
0 * * * * /home/pi/health-check.sh >> /home/pi/health.log
```

### Troubleshooting

**Issue: Touch not responsive**
- Check HyperPixel 4 driver installation
- Verify `dtoverlay=hyperpixel4` in `/boot/config.txt`
- Test with: `evtest /dev/input/event0`

**Issue: Slow performance**
- Check CPU temperature: `vcgencmd measure_temp`
- Monitor processes: `htop`
- Verify GPU acceleration: Chrome DevTools → Performance

**Issue: Can't connect to PrusaLink**
- Verify PrusaLink is running: `systemctl status prusalink`
- Check network: `ping localhost`
- Review nginx logs: `sudo tail -f /var/log/nginx/error.log`

**Issue: Screen stays blank**
- Check X server: `echo $DISPLAY`
- Verify autostart script: `cat ~/.config/lxsession/LXDE-pi/autostart`
- Test Chromium manually: `/home/pi/start-prusatouch.sh`

## Future Enhancements

**Phase 2 Features (Post-MVP):**
1. **Camera Integration**
   - Live preview from `/api/v1/cameras/snap`
   - Timelapse viewer
   - Snapshot capture button

2. **Advanced Print Control**
   - Z-offset adjustment during print
   - Fan speed control
   - Flow rate adjustment
   - Temperature override

3. **Statistics Dashboard**
   - Print time totals
   - Filament usage tracking
   - Success rate graphs
   - Most-printed files

4. **File Management**
   - WiFi file upload from phone
   - Drag-and-drop file sorting
   - Folder organization
   - Print queue

5. **Notifications**
   - Print completion alerts (on-screen + sound)
   - Temperature warnings
   - Filament runout detection
   - Error notifications

6. **Multi-Language Support**
   - i18n integration
   - Language selector in settings
   - RTL support if needed

7. **Themes**
   - Light mode option
   - Custom color schemes
   - High-contrast accessibility mode

8. **Remote Access**
   - QR code for mobile browser access
   - Shared control mode (multiple users)
   - Read-only guest mode

## Conclusion

PrusaTouch is designed as a high-performance, touch-optimized interface for PrusaLink that respects the hardware constraints of the Raspberry Pi 4 while delivering a modern, polished user experience inspired by the Prusa Core One aesthetic.

**Key Success Factors:**
- **Performance-First:** GPU-accelerated animations, aggressive bundle optimization
- **Touch-Optimized:** Large targets, intuitive gestures, immediate feedback
- **Reliable:** Robust error handling, offline support, auto-recovery
- **Maintainable:** Clean architecture, type safety, comprehensive tests
- **Showcase-Worthy:** Modern tech stack, AI-assisted development, production-ready code

**Next Steps:**
1. Set up development environment
2. Initialize project with Vite + Vue 3 + TypeScript
3. Generate API client from OpenAPI spec
4. Build core components
5. Implement state management
6. Create main views
7. Add animations and polish
8. Test on target hardware
9. Deploy to Raspberry Pi
10. Iterate based on real-world usage

This design document serves as the blueprint for building PrusaTouch. All architectural decisions are documented with rationale, and the implementation path is clear.