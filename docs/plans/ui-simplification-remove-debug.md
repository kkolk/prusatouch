# Implementation Plan: Simplify PrusaTouch UI

## Overview
Remove debug functionality, add printer status indicator to top bar, and simplify Settings page to show functional printer information.

## User Requirements
1. **Remove Debug UI**: Remove debug button (🐛), DebugView, debug route, debug functionality
2. **Add Status Indicator**: Show printer state (IDLE, PRINTING, etc.) and connection status in top bar
3. **Simplify Settings**: Remove display controls (brightness, screensaver), show printer firmware/network info
4. **Keep Console Logging**: Ensure console.log works in production for kiosk debugging

## Key Design Decisions

### Status Indicator
- **Location**: Top bar, center area (shown on non-Home, non-Control pages)
- **Content**: Connection dot (green=connected, red=offline) + user-friendly printer state text
- **Width**: ~150px max
- **State Formatting**: Map raw states to friendly labels (PRINTING → "Printing", IDLE → "Idle")

### Printer Info Data
- **Fetch strategy**: Fetch once in App.vue onMounted (before any components use it)
- **Composable**: `usePrinterInfo()` returns computed refs only, never fetches
- **Endpoints**: `/api/v1/info` and `/api/version`
- **Storage**: Add to existing `printerStore` with proper types
- **Error handling**: Graceful fallbacks to "Unknown" on fetch failure
- **Loading states**: Show "Loading..." while fetching initial data
- **Refresh**: Manual refresh button in Settings for stale data

### Settings Page
- **Remove**: Display controls section (brightness, screensaver), browser system info
- **Add**: Printer name, firmware, PrusaLink version, hostname, serial, location, nozzle diameter
- **Organization**:
  - "Printer" section: name, serial, firmware, PrusaLink, nozzle
  - "Network" section: hostname, location
- **Keep**: Action buttons (Clear Cache, Restart Interface, Reset to Defaults)

### Top Bar Layout
- **Current**: `space-between` layout with title, conditional content, actions
- **Updated**: Add center wrapper for position/temps/status to prevent layout shift
- **Flexibility**: Status shown on Settings/Files pages, position on Control, temps on Home

## Implementation Steps

### Phase 1: Add Printer Info Infrastructure

**File: `src/stores/printer.ts` (lines 3-4, 19-26, 284-307)**

Add imports after line 9:
```typescript
import type { Info } from '../api/models/Info'
import type { Version } from '../api/models/Version'
```

Add state after line 32 (temperatureHistory):
```typescript
const printerInfo = ref<Info | null>(null)
const version = ref<Version | null>(null)
const printerInfoLoading = ref(false)
```

Add actions before return statement (before line 284):
```typescript
async function fetchPrinterInfo() {
  try {
    printerInfoLoading.value = true
    const { DefaultService } = await import('../api')
    printerInfo.value = await DefaultService.getApiV1Info()
  } catch (error) {
    console.error('Failed to fetch printer info:', error)
    // Keep printerInfo as null - composable will use fallbacks
  } finally {
    printerInfoLoading.value = false
  }
}

async function fetchVersion() {
  try {
    const { DefaultService } = await import('../api')
    version.value = await DefaultService.getApiVersion()
  } catch (error) {
    console.error('Failed to fetch version:', error)
    // Keep version as null - composable will use fallbacks
  }
}
```

Add to return statement (before line 307):
```typescript
// State
printerInfo,
version,
printerInfoLoading,

// Actions
fetchPrinterInfo,
fetchVersion,
```

---

**File: `src/composables/usePrinterInfo.ts` (NEW)**
```typescript
import { computed, readonly } from 'vue'
import { usePrinterStore } from '../stores/printer'

/**
 * Composable for accessing printer information.
 *
 * IMPORTANT: This composable does NOT fetch data. Data must be fetched
 * in App.vue onMounted before any components use this composable.
 *
 * Returns computed refs with fallback values for missing data.
 */
export function usePrinterInfo() {
  const store = usePrinterStore()

  // Computed refs with fallbacks for template use
  const printerName = computed(() => store.printerInfo?.name || 'Unknown Printer')
  const firmware = computed(() => store.version?.firmware || 'Unknown')
  const prusaLink = computed(() => store.version?.text || 'Unknown')
  const hostname = computed(() => store.printerInfo?.hostname || 'Unknown')
  const serial = computed(() => store.printerInfo?.serial || 'Unknown')
  const location = computed(() => store.printerInfo?.location || 'Not Set')
  const nozzleDiameter = computed(() => store.printerInfo?.nozzle_diameter?.toString() || 'Unknown')
  const isLoading = computed(() => store.printerInfoLoading)

  return {
    printerName: readonly(printerName),
    firmware: readonly(firmware),
    prusaLink: readonly(prusaLink),
    hostname: readonly(hostname),
    serial: readonly(serial),
    location: readonly(location),
    nozzleDiameter: readonly(nozzleDiameter),
    isLoading: readonly(isLoading),
  }
}
```

---

**File: `src/App.vue` (lines 94-106)**

Add after line 105 (after notificationsStore):
```typescript
import { onMounted } from 'vue'

// Fetch printer info once on app mount (before any components use it)
onMounted(async () => {
  await Promise.all([
    printerStore.fetchPrinterInfo(),
    printerStore.fetchVersion()
  ])
})
```

---

### Phase 2: Add Status Indicator to Top Bar

**File: `src/App.vue`**

**Add state constants** (after line 112):
```typescript
// User-friendly state labels for status display
const STATE_LABELS: Record<string, string> = {
  'IDLE': 'Idle',
  'PRINTING': 'Printing',
  'PAUSED': 'Paused',
  'FINISHED': 'Complete',
  'STOPPED': 'Stopped',
  'ERROR': 'Error',
  'READY': 'Ready',
  'BUSY': 'Busy',
  'ATTENTION': 'Attention',
  'DISCONNECTED': 'Offline'
}

const isFilesView = computed(() => route.path === '/files')
const isSettingsView = computed(() => route.path === '/settings')
```

**Add displayState computed** (after line 145):
```typescript
// Status display text with user-friendly formatting
const displayState = computed(() => {
  const state = printerStore.status?.state || 'DISCONNECTED'
  return STATE_LABELS[state] || state
})
```

**Update template** - Replace top-bar-content section (lines 12-53):
```vue
<div class="top-bar-content">
  <h1 class="app-title">PrusaTouch</h1>

  <!-- Center content: Position, Temps, or Status -->
  <div class="top-bar-center">
    <!-- Position Display (Control View Only) -->
    <div v-if="isControlView" class="position-compact">
      <span class="pos-item">
        <span class="pos-label">X:</span>
        <span class="pos-value">{{ position.x.toFixed(1) }}</span>
      </span>
      <span class="pos-item">
        <span class="pos-label">Y:</span>
        <span class="pos-value">{{ position.y.toFixed(1) }}</span>
      </span>
      <span class="pos-item">
        <span class="pos-label">Z:</span>
        <span class="pos-value">{{ position.z.toFixed(1) }}</span>
      </span>
    </div>

    <!-- Temperature Display (Home View Only) -->
    <div v-else-if="isHomeView" class="temps-compact">
      <span class="temp-item">
        <span class="temp-icon">🔥</span>
        <span class="temp-value">{{ nozzleTemp.current }}°</span>
        <span class="temp-separator">/</span>
        <span class="temp-target">{{ nozzleTemp.target }}°</span>
      </span>
      <span class="temp-item">
        <span class="temp-icon">🛏️</span>
        <span class="temp-value">{{ bedTemp.current }}°</span>
        <span class="temp-separator">/</span>
        <span class="temp-target">{{ bedTemp.target }}°</span>
      </span>
    </div>

    <!-- Status Indicator (Files/Settings View) -->
    <div v-else class="status-indicator">
      <span
        class="connection-dot"
        :class="{ connected: printerStore.isConnected }"
        :aria-label="printerStore.isConnected ? 'Connected' : 'Offline'"
      ></span>
      <span class="status-text">{{ displayState }}</span>
    </div>
  </div>

  <div class="top-bar-actions">
    <button class="settings-btn" @click="goToSettings" aria-label="Settings">
      <span class="settings-icon">⚙️</span>
    </button>
  </div>
</div>
```

**Remove** (lines 159-161):
```typescript
// DELETE goToDebug function
function goToDebug() {
  router.push('/debug')
}
```

**Add CSS** (after line 205 - .app-title styles):
```css
/* Top Bar Center Content */
.top-bar-center {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 200px;
}

/* Status Indicator */
.status-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.connection-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--status-error);
  flex-shrink: 0;
}

.connection-dot.connected {
  background: var(--status-success);
}

.status-text {
  font-size: 12px;
  font-weight: bold;
  color: var(--text-primary);
  text-transform: uppercase;
}
```

---

### Phase 3: Simplify Settings Page

**File: `src/views/SettingsView.vue`**

**Replace entire <script setup>** (lines 1-69):
```typescript
<script setup lang="ts">
import { useSettingsStore } from '../stores/settings'
import { useFilesStore } from '../stores/files'
import { usePrinterStore } from '../stores/printer'
import { usePrinterInfo } from '../composables/usePrinterInfo'
import TouchButton from '../components/TouchButton.vue'

const settingsStore = useSettingsStore()
const filesStore = useFilesStore()
const printerStore = usePrinterStore()
const printerInfo = usePrinterInfo()

// Methods
async function handleRefreshInfo() {
  await Promise.all([
    printerStore.fetchPrinterInfo(),
    printerStore.fetchVersion()
  ])
}

function handleClearCache() {
  if (confirm('Clear all cached thumbnails?')) {
    filesStore.clearThumbnailCache()
    settingsStore.clearCache()
    alert('Cache cleared successfully')
  }
}

function handleRestartInterface() {
  if (confirm('Restart the interface? This will reload the page.')) {
    settingsStore.restartInterface()
  }
}

function handleResetDefaults() {
  if (confirm('Reset all settings to default values?')) {
    settingsStore.resetToDefaults()
  }
}
</script>
```

**Replace entire <template>** (lines 71-166):
```vue
<template>
  <div class="settings-view">
    <h1 class="settings-title">Settings</h1>

    <!-- Printer Information -->
    <section class="settings-section">
      <div class="section-header">
        <h2 class="section-title">Printer</h2>
        <TouchButton
          variant="secondary"
          size="small"
          @click="handleRefreshInfo"
          :disabled="printerInfo.isLoading"
        >
          {{ printerInfo.isLoading ? 'Refreshing...' : 'Refresh' }}
        </TouchButton>
      </div>

      <div v-if="printerInfo.isLoading" class="loading-state">
        Loading printer information...
      </div>
      <div v-else class="info-grid">
        <div class="info-item">
          <span class="info-label">Name:</span>
          <span class="info-value">{{ printerInfo.printerName }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Serial:</span>
          <span class="info-value">{{ printerInfo.serial }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Firmware:</span>
          <span class="info-value">{{ printerInfo.firmware }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">PrusaLink:</span>
          <span class="info-value">{{ printerInfo.prusaLink }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Nozzle:</span>
          <span class="info-value">{{ printerInfo.nozzleDiameter }}mm</span>
        </div>
      </div>
    </section>

    <!-- Network Information -->
    <section class="settings-section">
      <h2 class="section-title">Network</h2>

      <div v-if="printerInfo.isLoading" class="loading-state">
        Loading network information...
      </div>
      <div v-else class="info-grid">
        <div class="info-item">
          <span class="info-label">Hostname:</span>
          <span class="info-value">{{ printerInfo.hostname }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Location:</span>
          <span class="info-value">{{ printerInfo.location }}</span>
        </div>
      </div>
    </section>

    <!-- Actions -->
    <section class="settings-section">
      <h2 class="section-title">Actions</h2>

      <div class="action-buttons">
        <TouchButton variant="secondary" @click="handleClearCache">
          Clear Cache
        </TouchButton>
        <TouchButton variant="secondary" @click="handleRestartInterface">
          Restart Interface
        </TouchButton>
        <TouchButton variant="danger" @click="handleResetDefaults">
          Reset to Defaults
        </TouchButton>
      </div>
    </section>
  </div>
</template>
```

**Update <style>** - Add after .section-title (after line 196):
```css
/* Section Header (for refresh button) */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.section-header .section-title {
  margin: 0;
}

/* Loading State */
.loading-state {
  padding: var(--space-md);
  text-align: center;
  color: var(--text-secondary);
  font-style: italic;
}
```

---

**File: `src/stores/settings.ts`**

**Remove** from state interface and ref (around lines 10-30):
- `brightness: number`
- `screensaverTimeout: number`

**Remove** these actions (around lines 40-70):
- `setBrightness(value: number)`
- `setScreensaverTimeout(value: number)`

**Remove** from return statement exports

---

### Phase 4: Remove Debug Functionality

**Delete files**:
1. `src/views/DebugView.vue`
2. `src/stores/debugLog.ts`
3. `tests/unit/stores/debugLog.spec.ts`
4. `tests/unit/views/DebugView.spec.ts`

**File: `src/router/index.ts`**
- Remove import (line ~10): `const DebugView = () => import('../views/DebugView.vue')`
- Remove route configuration (lines ~37-42): debug route object

**File: `src/api/client.ts`** - Replace entire file:
```typescript
import axios, { AxiosInstance } from 'axios'

let axiosClient: AxiosInstance | null = null

/**
 * Get or create the axios client
 */
export function getAxiosClient(): AxiosInstance {
  if (axiosClient) {
    return axiosClient
  }

  axiosClient = axios.create()
  return axiosClient
}
```

---

### Phase 5: Update Tests

**File: `tests/unit/stores/printer.spec.ts`**

Add tests for new actions (after existing tests):
```typescript
describe('fetchPrinterInfo', () => {
  it('should fetch and store printer info', async () => {
    const mockInfo = {
      name: 'Test Printer',
      serial: 'TEST123',
      hostname: 'test-host',
      location: 'Workshop',
      nozzle_diameter: 0.4
    }

    vi.mocked(DefaultService.getApiV1Info).mockResolvedValue(mockInfo)

    await store.fetchPrinterInfo()

    expect(store.printerInfo).toEqual(mockInfo)
    expect(store.printerInfoLoading).toBe(false)
  })

  it('should handle fetch errors gracefully', async () => {
    vi.mocked(DefaultService.getApiV1Info).mockRejectedValue(new Error('Network error'))

    await store.fetchPrinterInfo()

    expect(store.printerInfo).toBeNull()
    expect(store.printerInfoLoading).toBe(false)
  })

  it('should set loading state during fetch', async () => {
    vi.mocked(DefaultService.getApiV1Info).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    )

    const fetchPromise = store.fetchPrinterInfo()
    expect(store.printerInfoLoading).toBe(true)

    await fetchPromise
    expect(store.printerInfoLoading).toBe(false)
  })
})

describe('fetchVersion', () => {
  it('should fetch and store version info', async () => {
    const mockVersion = {
      firmware: '3.13.3',
      text: 'PrusaLink 2.1.2',
      api: '2.0.0'
    }

    vi.mocked(DefaultService.getApiVersion).mockResolvedValue(mockVersion)

    await store.fetchVersion()

    expect(store.version).toEqual(mockVersion)
  })

  it('should handle version fetch errors gracefully', async () => {
    vi.mocked(DefaultService.getApiVersion).mockRejectedValue(new Error('Network error'))

    await store.fetchVersion()

    expect(store.version).toBeNull()
  })
})
```

---

**File: `tests/unit/composables/usePrinterInfo.spec.ts` (NEW)**
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePrinterInfo } from '../../../src/composables/usePrinterInfo'
import { usePrinterStore } from '../../../src/stores/printer'

describe('usePrinterInfo', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should return unknown values when store has no data', () => {
    const info = usePrinterInfo()

    expect(info.printerName.value).toBe('Unknown Printer')
    expect(info.firmware.value).toBe('Unknown')
    expect(info.prusaLink.value).toBe('Unknown')
    expect(info.hostname.value).toBe('Unknown')
    expect(info.serial.value).toBe('Unknown')
  })

  it('should return printer info when store has data', () => {
    const store = usePrinterStore()
    store.printerInfo = {
      name: 'My Printer',
      serial: 'ABC123',
      hostname: 'prusa-mk3s',
      location: 'Workshop',
      nozzle_diameter: 0.4
    } as any

    store.version = {
      firmware: '3.13.3',
      text: 'PrusaLink 2.1.2'
    } as any

    const info = usePrinterInfo()

    expect(info.printerName.value).toBe('My Printer')
    expect(info.firmware.value).toBe('3.13.3')
    expect(info.prusaLink.value).toBe('PrusaLink 2.1.2')
    expect(info.hostname.value).toBe('prusa-mk3s')
    expect(info.serial.value).toBe('ABC123')
  })

  it('should return readonly computed refs', () => {
    const info = usePrinterInfo()

    // TypeScript will prevent this at compile time, but we can verify at runtime
    expect(() => {
      (info.printerName as any).value = 'New Name'
    }).toThrow()
  })

  it('should reflect loading state from store', () => {
    const store = usePrinterStore()
    store.printerInfoLoading = true

    const info = usePrinterInfo()
    expect(info.isLoading.value).toBe(true)

    store.printerInfoLoading = false
    expect(info.isLoading.value).toBe(false)
  })
})
```

---

**File: `tests/unit/App.spec.ts`**

**Remove** (debug button test):
```typescript
// DELETE test for debug button navigation
it('should navigate to debug when debug button clicked', ...)
```

**Add** (status indicator tests):
```typescript
describe('Status Indicator', () => {
  it('should show status indicator on files view', async () => {
    await router.push('/files')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.status-indicator').exists()).toBe(true)
    expect(wrapper.find('.position-compact').exists()).toBe(false)
    expect(wrapper.find('.temps-compact').exists()).toBe(false)
  })

  it('should show status indicator on settings view', async () => {
    await router.push('/settings')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.status-indicator').exists()).toBe(true)
  })

  it('should show green dot when connected', async () => {
    printerStore.connection.connected = true
    await router.push('/files')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.connection-dot.connected').exists()).toBe(true)
  })

  it('should show red dot when disconnected', async () => {
    printerStore.connection.connected = false
    await router.push('/files')
    await wrapper.vm.$nextTick()

    const dot = wrapper.find('.connection-dot')
    expect(dot.exists()).toBe(true)
    expect(dot.classes()).not.toContain('connected')
  })

  it('should display formatted state text', async () => {
    printerStore.status = { state: 'PRINTING' } as any
    await router.push('/files')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.status-text').text()).toBe('Printing')
  })

  it('should show Offline when disconnected', async () => {
    printerStore.status = null
    await router.push('/files')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.status-text').text()).toBe('Offline')
  })
})

describe('Printer Info Fetching', () => {
  it('should fetch printer info and version on mount', async () => {
    const fetchPrinterInfoSpy = vi.spyOn(printerStore, 'fetchPrinterInfo')
    const fetchVersionSpy = vi.spyOn(printerStore, 'fetchVersion')

    // Create new wrapper to trigger onMounted
    const newWrapper = mount(App, {
      global: {
        plugins: [pinia, router],
        stubs: {
          RouterView: true,
          OfflineBanner: true,
          Toast: true
        }
      }
    })

    await newWrapper.vm.$nextTick()

    expect(fetchPrinterInfoSpy).toHaveBeenCalledOnce()
    expect(fetchVersionSpy).toHaveBeenCalledOnce()
  })
})
```

---

**File: `tests/unit/router/index.spec.ts`**

Add test:
```typescript
it('should not have debug route', () => {
  const routes = router.getRoutes()
  const debugRoute = routes.find(route => route.path === '/debug')

  expect(debugRoute).toBeUndefined()
})
```

---

**File: `tests/unit/views/SettingsView.spec.ts`**

**Remove** tests for:
- Brightness slider
- Screensaver select
- System info display

**Add** tests for:
```typescript
describe('Printer Info Display', () => {
  beforeEach(() => {
    const printerStore = usePrinterStore()
    printerStore.printerInfo = {
      name: 'Test Printer',
      serial: 'TEST123',
      hostname: 'test-host',
      location: 'Workshop',
      nozzle_diameter: 0.4
    } as any

    printerStore.version = {
      firmware: '3.13.3',
      text: 'PrusaLink 2.1.2'
    } as any

    printerStore.printerInfoLoading = false
  })

  it('should display printer name', () => {
    expect(wrapper.text()).toContain('Test Printer')
  })

  it('should display serial number', () => {
    expect(wrapper.text()).toContain('TEST123')
  })

  it('should display firmware version', () => {
    expect(wrapper.text()).toContain('3.13.3')
  })

  it('should display PrusaLink version', () => {
    expect(wrapper.text()).toContain('PrusaLink 2.1.2')
  })

  it('should display hostname', () => {
    expect(wrapper.text()).toContain('test-host')
  })

  it('should display location', () => {
    expect(wrapper.text()).toContain('Workshop')
  })

  it('should display nozzle diameter', () => {
    expect(wrapper.text()).toContain('0.4mm')
  })

  it('should show loading state while fetching', async () => {
    const printerStore = usePrinterStore()
    printerStore.printerInfoLoading = true

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Loading printer information')
  })

  it('should call refresh when refresh button clicked', async () => {
    const printerStore = usePrinterStore()
    const fetchPrinterInfoSpy = vi.spyOn(printerStore, 'fetchPrinterInfo')
    const fetchVersionSpy = vi.spyOn(printerStore, 'fetchVersion')

    const refreshBtn = wrapper.findAll('button').find(btn =>
      btn.text().includes('Refresh')
    )

    await refreshBtn?.trigger('click')

    expect(fetchPrinterInfoSpy).toHaveBeenCalledOnce()
    expect(fetchVersionSpy).toHaveBeenCalledOnce()
  })
})
```

---

### Phase 6: Final Verification

**Step 1: Search for remaining debugLog imports**
```bash
just find "debugLog"
```
Remove any remaining imports.

**Step 2: Run full test suite**
```bash
just test
```
All tests must pass.

**Step 3: Verify console logging in production**
```bash
just build
# Open dist/index.html in browser
# Open DevTools console
# Verify console.log statements appear
# Check vite.config.ts:26 has drop_console: false
```

**Step 4: Check bundle size**
```bash
just bundle-size
```
**Requirement:** Bundle must remain <300KB gzipped

**Step 5: Smoke test on Pi**
```bash
just deploy
# Verify:
# - Status indicator shows on Files/Settings pages
# - Settings displays real printer info
# - No debug button visible
# - Console logs work in DevTools
```

---

## Implementation Order

### Batch 1: Infrastructure (TDD)
1. Write tests for `fetchPrinterInfo()` and `fetchVersion()` actions
2. Implement actions in printerStore
3. Write tests for `usePrinterInfo()` composable
4. Implement composable
5. Add fetch calls to App.vue onMounted
6. Verify tests pass

### Batch 2: Status Indicator (TDD)
7. Write tests for status indicator display (App.spec.ts)
8. Add STATE_LABELS map and displayState computed
9. Update App.vue template with status indicator
10. Add CSS for status indicator and top-bar-center
11. Remove goToDebug function
12. Verify tests pass

### Batch 3: Settings Page (TDD)
13. Write tests for updated SettingsView
14. Update SettingsView script with usePrinterInfo
15. Update SettingsView template with printer/network info
16. Update SettingsView styles
17. Remove brightness/screensaver from settingsStore
18. Verify tests pass

### Batch 4: Remove Debug (TDD)
19. Update router test to verify no debug route
20. Remove debug route from router
21. Delete DebugView.vue, debugLog.ts, and their tests
22. Simplify API client
23. Search and remove remaining debugLog imports
24. Verify all tests pass

### Batch 5: Final Verification
25. Run `just test` - all tests must pass
26. Verify console logging in production build
27. Check bundle size <300KB
28. Deploy and smoke test on Pi

---

## Files Summary

### Files to Create (2)
- `src/composables/usePrinterInfo.ts`
- `tests/unit/composables/usePrinterInfo.spec.ts`

### Files to Modify (9)
- `src/stores/printer.ts` - Add printerInfo/version state and actions
- `src/App.vue` - Add status indicator, remove debug button, fetch on mount
- `src/views/SettingsView.vue` - Replace display controls with printer info
- `src/stores/settings.ts` - Remove brightness/screensaver
- `src/router/index.ts` - Remove debug route
- `src/api/client.ts` - Remove debug interceptors
- `tests/unit/stores/printer.spec.ts` - Add fetchPrinterInfo/fetchVersion tests
- `tests/unit/App.spec.ts` - Update for status indicator, remove debug tests
- `tests/unit/views/SettingsView.spec.ts` - Update for printer info display
- `tests/unit/router/index.spec.ts` - Verify no debug route

### Files to Delete (4)
- `src/views/DebugView.vue`
- `src/stores/debugLog.ts`
- `tests/unit/stores/debugLog.spec.ts`
- `tests/unit/views/DebugView.spec.ts`

---

## Success Criteria

1. ✅ Status indicator visible on Files/Settings pages showing printer state and connection
2. ✅ Settings page displays real printer info from `/api/v1/info` and `/api/version`
3. ✅ No debug UI anywhere in application (no button, route, view, store)
4. ✅ All tests pass (unit + E2E)
5. ✅ Bundle size remains <300KB gzipped
6. ✅ Console logs work in production build (DevTools accessible)
7. ✅ Loading states shown while fetching initial data
8. ✅ Error handling gracefully falls back to "Unknown" values
9. ✅ Manual refresh button works in Settings page
10. ✅ User-friendly state labels (Printing, Idle, Complete, etc.)
