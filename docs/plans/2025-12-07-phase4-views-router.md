# Phase 4: Views & Router Implementation Plan

> **For Claude:** Use executing-plans or subagent-driven-development skill to implement this plan.

**Goal:** Build the three main views (HomeView, FilesView, SettingsView) and configure Vue Router with lazy loading for code splitting, creating a complete navigable touch-optimized interface.

**Architecture:** Views compose existing components and composables. Router handles navigation with GPU-accelerated slide transitions. HomeView shows printer status/job control, FilesView provides file browsing, SettingsView manages configuration. Bottom navigation provides tab-based navigation.

**Tech Stack:** Vue 3.5.25, Vue Router 4.6.3, TypeScript 5.9.3, Vitest 4.0.15

**Prerequisites:**
- Phase 1-3 complete (91 tests passing)
- All 6 components ready: TouchButton, ProgressRing, TemperatureDisplay, FileListItem, StatusBadge, BottomSheet
- All 3 composables ready: useStatus, useJob, useFiles
- Display: 800x480px, layout: 60px top bar + 360px content + 60px bottom nav

---

## Task Execution Order

**Sequential dependencies:**
- Task 21 → Task 22 (App.vue needs router)
- Tasks 23, 24, 25 (views) can be parallel, but need router from Task 21
- All views → Task 26 (integration needs all views)

**Recommended order:**
1. Task 21: Router setup
2. Task 22: App.vue with layout structure
3. Tasks 23-25: Views (can be parallel)
4. Task 26: Integration verification

---

### Task 21: Router Configuration - Create router with lazy-loaded routes

**Context:** Vue Router provides navigation between views. Lazy loading FilesView and SettingsView reduces initial bundle size. HomeView is eagerly loaded as the default view.

**Files to Interact:**
- C: `src/router/index.ts` (Create)
- T: `tests/unit/router/index.spec.ts` (Test)

**Step 1: Write the failing test**

Create `tests/unit/router/index.spec.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { routes } from '../../../src/router'

describe('Router', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    router = createRouter({
      history: createMemoryHistory(),
      routes
    })
  })

  it('exports routes array', () => {
    expect(routes).toBeDefined()
    expect(Array.isArray(routes)).toBe(true)
  })

  it('has home route at root path', () => {
    const homeRoute = routes.find(r => r.path === '/')
    expect(homeRoute).toBeDefined()
    expect(homeRoute?.name).toBe('home')
  })

  it('has files route', () => {
    const filesRoute = routes.find(r => r.path === '/files')
    expect(filesRoute).toBeDefined()
    expect(filesRoute?.name).toBe('files')
  })

  it('has settings route', () => {
    const settingsRoute = routes.find(r => r.path === '/settings')
    expect(settingsRoute).toBeDefined()
    expect(settingsRoute?.name).toBe('settings')
  })

  it('navigates to home by default', async () => {
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('home')
  })

  it('navigates to files route', async () => {
    await router.push('/files')
    expect(router.currentRoute.value.name).toBe('files')
  })

  it('navigates to settings route', async () => {
    await router.push('/settings')
    expect(router.currentRoute.value.name).toBe('settings')
  })

  it('redirects unknown routes to home', async () => {
    await router.push('/unknown-route')
    expect(router.currentRoute.value.name).toBe('home')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/router/index.spec.ts`
Expected: FAIL with "Cannot find module '../../../src/router'"

**Step 3: Write minimal implementation**

Create `src/router/index.ts`:

```typescript
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

// Eagerly loaded (initial view)
import HomeView from '../views/HomeView.vue'

// Lazy loaded (code splitting)
const FilesView = () => import('../views/FilesView.vue')
const SettingsView = () => import('../views/SettingsView.vue')

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: 'Home' }
  },
  {
    path: '/files',
    name: 'files',
    component: FilesView,
    meta: { title: 'Files' }
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView,
    meta: { title: 'Settings' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
```

Create placeholder views so router can resolve imports:

Create `src/views/HomeView.vue`:
```vue
<template>
  <div class="home-view">HomeView placeholder</div>
</template>

<script setup lang="ts">
</script>
```

Create `src/views/FilesView.vue`:
```vue
<template>
  <div class="files-view">FilesView placeholder</div>
</template>

<script setup lang="ts">
</script>
```

Create `src/views/SettingsView.vue`:
```vue
<template>
  <div class="settings-view">SettingsView placeholder</div>
</template>

<script setup lang="ts">
</script>
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/router/index.spec.ts`
Expected: PASS (8 tests)

**Step 5: Review & Commit**

```bash
git add src/router/index.ts src/views/*.vue tests/unit/router/index.spec.ts
git commit -m "feat: add Vue Router with lazy-loaded routes

- Home route eagerly loaded (initial view)
- Files and Settings routes lazy loaded (code splitting)
- Catch-all redirect to home for unknown routes
- Placeholder views for component resolution

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 22: App.vue - Root component with layout and bottom navigation

**Context:** App.vue provides the shell layout: 60px top bar, router-view for content (360px), and 60px bottom navigation. Bottom nav enables tab switching between Home, Files, and Settings.

**Files to Interact:**
- C: `src/App.vue` (Create)
- M: `src/main.ts:1-21` (Modify to use router)
- T: `tests/unit/App.spec.ts` (Test)

**Step 1: Write the failing test**

Create `tests/unit/App.spec.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import App from '../../src/App.vue'
import { routes } from '../../src/router'

describe('App', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createMemoryHistory(),
      routes
    })
  })

  it('renders app container', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: { plugins: [router] }
    })
    expect(wrapper.find('.app').exists()).toBe(true)
  })

  it('renders top bar', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: { plugins: [router] }
    })
    expect(wrapper.find('.top-bar').exists()).toBe(true)
  })

  it('renders bottom navigation', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: { plugins: [router] }
    })
    expect(wrapper.find('.bottom-nav').exists()).toBe(true)
  })

  it('renders three nav tabs', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: { plugins: [router] }
    })
    const tabs = wrapper.findAll('.nav-tab')
    expect(tabs.length).toBe(3)
  })

  it('highlights active tab based on route', async () => {
    router.push('/files')
    await router.isReady()

    const wrapper = mount(App, {
      global: { plugins: [router] }
    })
    const activeTab = wrapper.find('.nav-tab.active')
    expect(activeTab.text()).toContain('Files')
  })

  it('navigates when tab is clicked', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: { plugins: [router] }
    })

    const filesTab = wrapper.findAll('.nav-tab')[1]
    await filesTab.trigger('click')

    expect(router.currentRoute.value.name).toBe('files')
  })

  it('renders router-view for content', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: { plugins: [router] }
    })
    expect(wrapper.find('.main-content').exists()).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/App.spec.ts`
Expected: FAIL with "Cannot find module '../../src/App.vue'" or component structure issues

**Step 3: Write minimal implementation**

Create `src/App.vue`:

```vue
<template>
  <div class="app">
    <!-- Top Bar -->
    <header class="top-bar">
      <div class="top-bar-content">
        <h1 class="app-title">PrusaTouch</h1>
        <button class="settings-btn" @click="goToSettings" aria-label="Settings">
          <span class="settings-icon">⚙️</span>
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Bottom Navigation -->
    <nav class="bottom-nav">
      <button
        v-for="tab in tabs"
        :key="tab.name"
        class="nav-tab"
        :class="{ active: isActive(tab.route) }"
        @click="navigate(tab.route)"
      >
        <span class="nav-icon">{{ tab.icon }}</span>
        <span class="nav-label">{{ tab.label }}</span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const tabs = [
  { name: 'home', route: '/', icon: '🏠', label: 'Home' },
  { name: 'files', route: '/files', icon: '📁', label: 'Files' },
  { name: 'settings', route: '/settings', icon: '⚙️', label: 'Settings' }
]

function isActive(path: string): boolean {
  return route.path === path
}

function navigate(path: string) {
  router.push(path)
}

function goToSettings() {
  router.push('/settings')
}
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  max-width: var(--display-width);
  max-height: var(--display-height);
  margin: 0 auto;
  background: var(--bg-primary);
  overflow: hidden;
}

/* Top Bar - 60px */
.top-bar {
  height: var(--touch-comfortable);
  min-height: var(--touch-comfortable);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--bg-tertiary);
  display: flex;
  align-items: center;
  padding: 0 var(--space-md);
}

.top-bar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.app-title {
  font-size: 24px;
  font-weight: bold;
  color: var(--prusa-orange);
  margin: 0;
}

.settings-btn {
  width: var(--touch-min);
  height: var(--touch-min);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--transition-fast);
}

.settings-btn:active {
  transform: scale(0.9);
}

.settings-icon {
  font-size: 24px;
}

/* Main Content - fills remaining space (360px on target display) */
.main-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Bottom Navigation - 60px */
.bottom-nav {
  height: var(--touch-comfortable);
  min-height: var(--touch-comfortable);
  background: var(--bg-secondary);
  border-top: 1px solid var(--bg-tertiary);
  display: flex;
  align-items: stretch;
}

.nav-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: transparent;
  border: none;
  border-top: 3px solid transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: transform var(--transition-fast);
  font-family: inherit;
}

.nav-tab:active {
  transform: scale(0.95);
}

.nav-tab.active {
  border-top-color: var(--prusa-orange);
  color: var(--prusa-orange);
}

.nav-icon {
  font-size: 20px;
}

.nav-label {
  font-size: 12px;
  font-weight: 500;
}

/* GPU-accelerated slide transitions */
.slide-enter-active,
.slide-leave-active {
  transition: transform var(--transition-normal), opacity var(--transition-normal);
}

.slide-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}
</style>
```

Update `src/main.ts` to use router:

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/global.css'
import { initAuthFromEnv } from './api/auth'

// Initialize auth from environment variables
initAuthFromEnv()

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)
app.mount('#app')
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/App.spec.ts`
Expected: PASS (7 tests)

**Step 5: Review & Commit**

```bash
git add src/App.vue src/main.ts tests/unit/App.spec.ts
git commit -m "feat: add App.vue with layout and bottom navigation

- 60px top bar with title and settings button
- Flexible main content area with router-view
- 60px bottom navigation with Home/Files/Settings tabs
- Active tab highlighting with orange border
- GPU-accelerated slide transitions between views

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 23: HomeView - Dashboard with status and job control

**Context:** HomeView is the main dashboard showing printer status (temperatures, state) when idle, and print progress with controls when printing. Uses useStatus and useJob composables.

**Files to Interact:**
- M: `src/views/HomeView.vue` (Modify placeholder)
- T: `tests/unit/views/HomeView.spec.ts` (Test)

**Step 1: Write the failing test**

Create `tests/unit/views/HomeView.spec.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HomeView from '../../../src/views/HomeView.vue'

// Mock composables
vi.mock('../../../src/composables', () => ({
  useStatus: () => ({
    printerState: { value: 'IDLE' },
    nozzleTemp: { value: { current: 25, target: 0 } },
    bedTemp: { value: { current: 22, target: 0 } },
    isConnected: { value: true },
    connectionError: { value: null },
    startPolling: vi.fn(),
    stopPolling: vi.fn()
  }),
  useJob: () => ({
    hasActiveJob: { value: false },
    progress: { value: 0 },
    timeRemaining: { value: '' },
    fileName: { value: '' },
    isPausing: { value: false },
    isStopping: { value: false },
    pauseJob: vi.fn(),
    resumeJob: vi.fn(),
    stopJob: vi.fn()
  })
}))

describe('HomeView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders home view container', () => {
    const wrapper = mount(HomeView)
    expect(wrapper.find('.home-view').exists()).toBe(true)
  })

  it('displays StatusBadge component', () => {
    const wrapper = mount(HomeView)
    expect(wrapper.findComponent({ name: 'StatusBadge' }).exists()).toBe(true)
  })

  it('displays temperature displays', () => {
    const wrapper = mount(HomeView)
    const tempDisplays = wrapper.findAllComponents({ name: 'TemperatureDisplay' })
    expect(tempDisplays.length).toBe(2) // nozzle and bed
  })

  it('shows idle state content when not printing', () => {
    const wrapper = mount(HomeView)
    expect(wrapper.find('.idle-content').exists()).toBe(true)
  })

  it('shows select file button when idle', () => {
    const wrapper = mount(HomeView)
    expect(wrapper.text()).toContain('Select File')
  })
})

describe('HomeView - Printing State', () => {
  beforeEach(() => {
    setActivePinia(createPinia())

    // Override mock for printing state
    vi.doMock('../../../src/composables', () => ({
      useStatus: () => ({
        printerState: { value: 'PRINTING' },
        nozzleTemp: { value: { current: 215, target: 215 } },
        bedTemp: { value: { current: 60, target: 60 } },
        isConnected: { value: true },
        connectionError: { value: null },
        startPolling: vi.fn(),
        stopPolling: vi.fn()
      }),
      useJob: () => ({
        hasActiveJob: { value: true },
        progress: { value: 45 },
        timeRemaining: { value: '1h 30m' },
        fileName: { value: 'benchy.gcode' },
        isPausing: { value: false },
        isStopping: { value: false },
        pauseJob: vi.fn(),
        resumeJob: vi.fn(),
        stopJob: vi.fn()
      })
    }))
  })

  it('shows ProgressRing when printing', async () => {
    // Re-import with new mock
    const { default: HomeViewPrinting } = await import('../../../src/views/HomeView.vue')
    const wrapper = mount(HomeViewPrinting)
    expect(wrapper.findComponent({ name: 'ProgressRing' }).exists()).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/views/HomeView.spec.ts`
Expected: FAIL - HomeView placeholder doesn't have expected structure

**Step 3: Write minimal implementation**

Update `src/views/HomeView.vue`:

```vue
<template>
  <div class="home-view">
    <!-- Status Header -->
    <div class="status-header">
      <StatusBadge :state="printerState" />
      <div class="temperatures">
        <TemperatureDisplay
          :current="nozzleTemp.current"
          :target="nozzleTemp.target"
          type="nozzle"
        />
        <TemperatureDisplay
          :current="bedTemp.current"
          :target="bedTemp.target"
          type="bed"
        />
      </div>
    </div>

    <!-- Connection Error Banner -->
    <div v-if="connectionError" class="error-banner">
      {{ connectionError }}
    </div>

    <!-- Idle State -->
    <div v-if="!hasActiveJob" class="idle-content">
      <div class="idle-message">
        <p class="idle-text">Printer Ready</p>
        <TouchButton
          variant="primary"
          size="large"
          @click="goToFiles"
        >
          Select File to Print
        </TouchButton>
      </div>
    </div>

    <!-- Printing State -->
    <div v-else class="printing-content">
      <div class="progress-container">
        <ProgressRing :progress="progress" :size="280" :stroke-width="12">
          <div class="progress-info">
            <span class="progress-percent">{{ progress }}%</span>
            <span class="progress-time">{{ timeRemaining }}</span>
          </div>
        </ProgressRing>
      </div>

      <div class="job-info">
        <p class="file-name">{{ fileName }}</p>
      </div>

      <div class="job-controls">
        <TouchButton
          v-if="printerState === 'PRINTING'"
          variant="secondary"
          :loading="isPausing"
          @click="handlePause"
        >
          Pause
        </TouchButton>
        <TouchButton
          v-if="printerState === 'PAUSED'"
          variant="primary"
          @click="handleResume"
        >
          Resume
        </TouchButton>
        <TouchButton
          variant="danger"
          :loading="isStopping"
          @click="showStopConfirm = true"
        >
          Stop
        </TouchButton>
      </div>
    </div>

    <!-- Stop Confirmation -->
    <BottomSheet
      :visible="showStopConfirm"
      title="Stop Print?"
      @close="showStopConfirm = false"
    >
      <p>This will cancel the current print job. This action cannot be undone.</p>
      <template #actions>
        <TouchButton
          variant="secondary"
          @click="showStopConfirm = false"
        >
          Cancel
        </TouchButton>
        <TouchButton
          variant="danger"
          :loading="isStopping"
          @click="handleStop"
        >
          Stop Print
        </TouchButton>
      </template>
    </BottomSheet>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStatus, useJob } from '../composables'
import StatusBadge from '../components/StatusBadge.vue'
import TemperatureDisplay from '../components/TemperatureDisplay.vue'
import ProgressRing from '../components/ProgressRing.vue'
import TouchButton from '../components/TouchButton.vue'
import BottomSheet from '../components/BottomSheet.vue'

const router = useRouter()

// Composables
const {
  printerState,
  nozzleTemp,
  bedTemp,
  connectionError,
  startPolling,
  stopPolling
} = useStatus()

const {
  hasActiveJob,
  progress,
  timeRemaining,
  fileName,
  isPausing,
  isStopping,
  pauseJob,
  resumeJob,
  stopJob
} = useJob()

// Local state
const showStopConfirm = ref(false)

// Lifecycle
onMounted(() => {
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})

// Actions
function goToFiles() {
  router.push('/files')
}

async function handlePause() {
  await pauseJob()
}

async function handleResume() {
  await resumeJob()
}

async function handleStop() {
  await stopJob()
  showStopConfirm.value = false
}
</script>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--space-md);
  gap: var(--space-md);
}

/* Status Header */
.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.temperatures {
  display: flex;
  gap: var(--space-lg);
}

/* Error Banner */
.error-banner {
  background: rgba(204, 0, 0, 0.2);
  color: var(--status-error);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  text-align: center;
  font-weight: bold;
}

/* Idle Content */
.idle-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.idle-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
}

.idle-text {
  font-size: 24px;
  color: var(--text-secondary);
  margin: 0;
}

/* Printing Content */
.printing-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

.progress-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.progress-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
}

.progress-percent {
  font-size: 48px;
  font-weight: bold;
  color: var(--text-primary);
}

.progress-time {
  font-size: 18px;
  color: var(--text-secondary);
}

.job-info {
  text-align: center;
}

.file-name {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.job-controls {
  display: flex;
  gap: var(--space-md);
  margin-top: var(--space-md);
}
</style>
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/views/HomeView.spec.ts`
Expected: PASS (5+ tests)

**Step 5: Review & Commit**

```bash
git add src/views/HomeView.vue tests/unit/views/HomeView.spec.ts
git commit -m "feat: implement HomeView with status and job control

- Status header with StatusBadge and temperatures
- Idle state with 'Select File' button
- Printing state with ProgressRing and job info
- Pause/Resume/Stop controls with loading states
- Stop confirmation via BottomSheet
- Polling lifecycle management

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 24: FilesView - File browser with navigation

**Context:** FilesView displays the file browser using useFiles composable. Shows breadcrumb navigation, file list with FileListItem components, and actions for starting prints.

**Files to Interact:**
- M: `src/views/FilesView.vue` (Modify placeholder)
- T: `tests/unit/views/FilesView.spec.ts` (Test)

**Step 1: Write the failing test**

Create `tests/unit/views/FilesView.spec.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import FilesView from '../../../src/views/FilesView.vue'
import { routes } from '../../../src/router'

// Mock useFiles composable
vi.mock('../../../src/composables', () => ({
  useFiles: () => ({
    files: { value: [
      { name: 'folder1', type: 'FOLDER', path: '/folder1' },
      { name: 'benchy.gcode', type: 'PRINT_FILE', path: '/benchy.gcode', size: 1024000 }
    ]},
    currentPath: { value: '/' },
    currentStorage: { value: 'local' },
    breadcrumbs: { value: [{ name: 'local', path: '/' }] },
    storages: { value: ['local'] },
    isLoading: { value: false },
    navigate: vi.fn(),
    navigateUp: vi.fn(),
    startPrint: vi.fn(),
    deleteFile: vi.fn(),
    getThumbnail: vi.fn(() => null),
    fetchStorages: vi.fn()
  })
}))

describe('FilesView', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createMemoryHistory(),
      routes
    })
  })

  it('renders files view container', async () => {
    router.push('/files')
    await router.isReady()

    const wrapper = mount(FilesView, {
      global: { plugins: [router] }
    })
    expect(wrapper.find('.files-view').exists()).toBe(true)
  })

  it('displays breadcrumbs', async () => {
    router.push('/files')
    await router.isReady()

    const wrapper = mount(FilesView, {
      global: { plugins: [router] }
    })
    expect(wrapper.find('.breadcrumbs').exists()).toBe(true)
  })

  it('displays file list', async () => {
    router.push('/files')
    await router.isReady()

    const wrapper = mount(FilesView, {
      global: { plugins: [router] }
    })
    expect(wrapper.find('.file-list').exists()).toBe(true)
  })

  it('renders FileListItem for each file', async () => {
    router.push('/files')
    await router.isReady()

    const wrapper = mount(FilesView, {
      global: { plugins: [router] }
    })
    const items = wrapper.findAllComponents({ name: 'FileListItem' })
    expect(items.length).toBe(2)
  })

  it('shows back button when not at root', async () => {
    router.push('/files')
    await router.isReady()

    // This will need adjustment based on actual path
    const wrapper = mount(FilesView, {
      global: { plugins: [router] }
    })
    // Back button should exist for navigation
    expect(wrapper.find('.back-btn').exists()).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/views/FilesView.spec.ts`
Expected: FAIL - FilesView placeholder doesn't have expected structure

**Step 3: Write minimal implementation**

Update `src/views/FilesView.vue`:

```vue
<template>
  <div class="files-view">
    <!-- Header with back button and breadcrumbs -->
    <div class="files-header">
      <button class="back-btn" @click="handleBack" aria-label="Go back">
        <span class="back-icon">←</span>
      </button>
      <div class="breadcrumbs">
        <span
          v-for="(crumb, index) in breadcrumbs"
          :key="crumb.path"
          class="breadcrumb"
        >
          <span
            v-if="index < breadcrumbs.length - 1"
            class="breadcrumb-link"
            @click="navigateTo(crumb.path)"
          >
            {{ crumb.name }}
          </span>
          <span v-else class="breadcrumb-current">{{ crumb.name }}</span>
          <span v-if="index < breadcrumbs.length - 1" class="breadcrumb-separator">/</span>
        </span>
      </div>
    </div>

    <!-- Loading indicator -->
    <div v-if="isLoading" class="loading">
      <span class="spinner"></span>
      <span>Loading...</span>
    </div>

    <!-- File list -->
    <div v-else class="file-list">
      <div v-if="files.length === 0" class="empty-state">
        <p>No files found</p>
      </div>
      <FileListItem
        v-for="file in files"
        :key="file.path"
        :file="file"
        :thumbnail-url="getThumbnail(file.path)"
        @click="handleFileClick(file)"
      />
    </div>

    <!-- Print Confirmation -->
    <BottomSheet
      :visible="showPrintConfirm"
      :title="`Print ${selectedFile?.name}?`"
      @close="showPrintConfirm = false"
    >
      <p>Start printing this file?</p>
      <template #actions>
        <TouchButton
          variant="secondary"
          @click="showPrintConfirm = false"
        >
          Cancel
        </TouchButton>
        <TouchButton
          variant="primary"
          @click="handleStartPrint"
        >
          Start Print
        </TouchButton>
      </template>
    </BottomSheet>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFiles } from '../composables'
import type { FileInfo } from '../api'
import FileListItem from '../components/FileListItem.vue'
import BottomSheet from '../components/BottomSheet.vue'
import TouchButton from '../components/TouchButton.vue'

const router = useRouter()

// Composable
const {
  files,
  currentPath,
  currentStorage,
  breadcrumbs,
  isLoading,
  navigate,
  navigateUp,
  startPrint,
  getThumbnail
} = useFiles()

// Local state
const showPrintConfirm = ref(false)
const selectedFile = ref<FileInfo | null>(null)

// Navigation
function handleBack() {
  if (currentPath.value === '/') {
    router.push('/')
  } else {
    navigateUp()
  }
}

function navigateTo(path: string) {
  navigate(currentStorage.value, path)
}

// File actions
function handleFileClick(file: FileInfo) {
  if (file.type === 'FOLDER') {
    navigate(currentStorage.value, file.path || `${currentPath.value}/${file.name}`)
  } else if (file.type === 'PRINT_FILE') {
    selectedFile.value = file
    showPrintConfirm.value = true
  }
}

async function handleStartPrint() {
  if (selectedFile.value) {
    const path = selectedFile.value.path || `${currentPath.value}/${selectedFile.value.name}`
    await startPrint(path)
    showPrintConfirm.value = false
    router.push('/')
  }
}
</script>

<style scoped>
.files-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Header */
.files-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--bg-tertiary);
  min-height: var(--touch-min);
}

.back-btn {
  width: var(--touch-min);
  height: var(--touch-min);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  transition: transform var(--transition-fast);
}

.back-btn:active {
  transform: scale(0.9);
}

.back-icon {
  font-size: 24px;
}

/* Breadcrumbs */
.breadcrumbs {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  overflow-x: auto;
  gap: var(--space-xs);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  white-space: nowrap;
}

.breadcrumb-link {
  color: var(--prusa-orange);
  cursor: pointer;
}

.breadcrumb-current {
  color: var(--text-primary);
  font-weight: bold;
}

.breadcrumb-separator {
  color: var(--text-tertiary);
}

/* Loading */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: var(--space-md);
  color: var(--text-secondary);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--bg-tertiary);
  border-top-color: var(--prusa-orange);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* File List */
.file-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
}
</style>
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/views/FilesView.spec.ts`
Expected: PASS (5 tests)

**Step 5: Review & Commit**

```bash
git add src/views/FilesView.vue tests/unit/views/FilesView.spec.ts
git commit -m "feat: implement FilesView with file browser

- Header with back button and breadcrumb navigation
- File list using FileListItem components
- Folder navigation via click
- Print file selection with BottomSheet confirmation
- Loading and empty state handling
- Navigate to home after starting print

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 25: SettingsView - Configuration screen

**Context:** SettingsView displays app settings and printer info. Shows network info, version, and configuration options. Uses simple form elements for settings.

**Files to Interact:**
- M: `src/views/SettingsView.vue` (Modify placeholder)
- T: `tests/unit/views/SettingsView.spec.ts` (Test)

**Step 1: Write the failing test**

Create `tests/unit/views/SettingsView.spec.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import SettingsView from '../../../src/views/SettingsView.vue'
import { routes } from '../../../src/router'

describe('SettingsView', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createMemoryHistory(),
      routes
    })
  })

  it('renders settings view container', async () => {
    router.push('/settings')
    await router.isReady()

    const wrapper = mount(SettingsView, {
      global: { plugins: [router] }
    })
    expect(wrapper.find('.settings-view').exists()).toBe(true)
  })

  it('displays settings header', async () => {
    router.push('/settings')
    await router.isReady()

    const wrapper = mount(SettingsView, {
      global: { plugins: [router] }
    })
    expect(wrapper.find('.settings-header').exists()).toBe(true)
  })

  it('displays settings sections', async () => {
    router.push('/settings')
    await router.isReady()

    const wrapper = mount(SettingsView, {
      global: { plugins: [router] }
    })
    expect(wrapper.findAll('.settings-section').length).toBeGreaterThan(0)
  })

  it('displays back button', async () => {
    router.push('/settings')
    await router.isReady()

    const wrapper = mount(SettingsView, {
      global: { plugins: [router] }
    })
    expect(wrapper.find('.back-btn').exists()).toBe(true)
  })

  it('navigates back when back button clicked', async () => {
    router.push('/settings')
    await router.isReady()

    const wrapper = mount(SettingsView, {
      global: { plugins: [router] }
    })

    await wrapper.find('.back-btn').trigger('click')
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('displays PrusaLink connection settings', async () => {
    router.push('/settings')
    await router.isReady()

    const wrapper = mount(SettingsView, {
      global: { plugins: [router] }
    })
    expect(wrapper.text()).toContain('PrusaLink')
  })

  it('displays about section', async () => {
    router.push('/settings')
    await router.isReady()

    const wrapper = mount(SettingsView, {
      global: { plugins: [router] }
    })
    expect(wrapper.text()).toContain('About')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/views/SettingsView.spec.ts`
Expected: FAIL - SettingsView placeholder doesn't have expected structure

**Step 3: Write minimal implementation**

Update `src/views/SettingsView.vue`:

```vue
<template>
  <div class="settings-view">
    <!-- Header -->
    <div class="settings-header">
      <button class="back-btn" @click="goBack" aria-label="Go back">
        <span class="back-icon">←</span>
      </button>
      <h2 class="settings-title">Settings</h2>
    </div>

    <!-- Settings Content -->
    <div class="settings-content">
      <!-- PrusaLink Section -->
      <section class="settings-section">
        <h3 class="section-title">PrusaLink Connection</h3>

        <div class="setting-item">
          <div class="setting-label">
            <span class="label-text">Status</span>
          </div>
          <div class="setting-value">
            <span :class="['status-indicator', isConnected ? 'connected' : 'disconnected']">
              {{ isConnected ? 'Connected' : 'Disconnected' }}
            </span>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span class="label-text">Host</span>
          </div>
          <div class="setting-value">
            <span class="value-text">{{ prusalinkHost }}</span>
          </div>
        </div>
      </section>

      <!-- Display Section -->
      <section class="settings-section">
        <h3 class="section-title">Display</h3>

        <div class="setting-item">
          <div class="setting-label">
            <span class="label-text">Screen Timeout</span>
          </div>
          <div class="setting-value">
            <select v-model="screenTimeout" class="setting-select">
              <option value="60">1 minute</option>
              <option value="300">5 minutes</option>
              <option value="600">10 minutes</option>
              <option value="0">Never</option>
            </select>
          </div>
        </div>
      </section>

      <!-- About Section -->
      <section class="settings-section">
        <h3 class="section-title">About</h3>

        <div class="setting-item">
          <div class="setting-label">
            <span class="label-text">PrusaTouch Version</span>
          </div>
          <div class="setting-value">
            <span class="value-text">{{ appVersion }}</span>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span class="label-text">Display</span>
          </div>
          <div class="setting-value">
            <span class="value-text">800 x 480</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStatus } from '../composables'

const router = useRouter()

// Composable for connection status
const { isConnected } = useStatus()

// Settings state (would be persisted in real app)
const screenTimeout = ref('300')

// App info
const appVersion = '1.0.0'
const prusalinkHost = computed(() => {
  // In real app, this would come from config
  return import.meta.env.VITE_PRUSALINK_HOST || 'octopi.local.frostbyte.us'
})

function goBack() {
  router.push('/')
}
</script>

<style scoped>
.settings-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Header */
.settings-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--bg-tertiary);
  min-height: var(--touch-comfortable);
}

.back-btn {
  width: var(--touch-min);
  height: var(--touch-min);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  transition: transform var(--transition-fast);
}

.back-btn:active {
  transform: scale(0.9);
}

.back-icon {
  font-size: 24px;
}

.settings-title {
  font-size: 20px;
  font-weight: bold;
  color: var(--text-primary);
  margin: 0;
}

/* Content */
.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-md);
}

/* Sections */
.settings-section {
  margin-bottom: var(--space-lg);
}

.section-title {
  font-size: 14px;
  font-weight: bold;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 var(--space-sm) 0;
  padding-bottom: var(--space-xs);
  border-bottom: 1px solid var(--bg-tertiary);
}

/* Setting Items */
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: var(--touch-comfortable);
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--bg-tertiary);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  flex: 1;
}

.label-text {
  font-size: 16px;
  color: var(--text-primary);
}

.setting-value {
  display: flex;
  align-items: center;
}

.value-text {
  font-size: 16px;
  color: var(--text-secondary);
}

/* Status indicator */
.status-indicator {
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: bold;
}

.status-indicator.connected {
  background: rgba(0, 255, 0, 0.2);
  color: var(--status-success);
}

.status-indicator.disconnected {
  background: rgba(204, 0, 0, 0.2);
  color: var(--status-error);
}

/* Select dropdown */
.setting-select {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: none;
  border-radius: var(--radius-sm);
  padding: var(--space-sm) var(--space-md);
  font-size: 16px;
  font-family: inherit;
  cursor: pointer;
  min-height: var(--touch-min);
}

.setting-select:focus {
  outline: 2px solid var(--prusa-orange);
  outline-offset: 2px;
}
</style>
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/views/SettingsView.spec.ts`
Expected: PASS (7 tests)

**Step 5: Review & Commit**

```bash
git add src/views/SettingsView.vue tests/unit/views/SettingsView.spec.ts
git commit -m "feat: implement SettingsView with configuration options

- Header with back button navigation
- PrusaLink connection status section
- Display settings with screen timeout
- About section with version info
- Touch-optimized form controls

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 26: Integration Verification - Full app test and build

**Context:** Final verification that all views work together with routing, composables connect to stores properly, and the app builds within size constraints.

**Files to Interact:**
- T: `tests/unit/integration/app.spec.ts` (Test)

**Step 1: Write integration tests**

Create `tests/unit/integration/app.spec.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import App from '../../../src/App.vue'
import { routes } from '../../../src/router'

// Mock all composables
vi.mock('../../../src/composables', () => ({
  useStatus: () => ({
    printerState: { value: 'IDLE' },
    nozzleTemp: { value: { current: 25, target: 0 } },
    bedTemp: { value: { current: 22, target: 0 } },
    isConnected: { value: true },
    connectionError: { value: null },
    startPolling: vi.fn(),
    stopPolling: vi.fn()
  }),
  useJob: () => ({
    hasActiveJob: { value: false },
    progress: { value: 0 },
    timeRemaining: { value: '' },
    fileName: { value: '' },
    isPausing: { value: false },
    isStopping: { value: false },
    pauseJob: vi.fn(),
    resumeJob: vi.fn(),
    stopJob: vi.fn()
  }),
  useFiles: () => ({
    files: { value: [] },
    currentPath: { value: '/' },
    currentStorage: { value: 'local' },
    breadcrumbs: { value: [{ name: 'local', path: '/' }] },
    storages: { value: ['local'] },
    isLoading: { value: false },
    navigate: vi.fn(),
    navigateUp: vi.fn(),
    startPrint: vi.fn(),
    deleteFile: vi.fn(),
    getThumbnail: vi.fn(() => null),
    fetchStorages: vi.fn()
  })
}))

describe('App Integration', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createMemoryHistory(),
      routes
    })
  })

  it('renders app and navigates to home by default', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: { plugins: [router] }
    })

    await flushPromises()

    expect(wrapper.find('.app').exists()).toBe(true)
    expect(wrapper.find('.home-view').exists()).toBe(true)
  })

  it('navigates to files view via bottom nav', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: { plugins: [router] }
    })

    await flushPromises()

    // Click Files tab
    const tabs = wrapper.findAll('.nav-tab')
    await tabs[1].trigger('click')

    await flushPromises()

    expect(router.currentRoute.value.name).toBe('files')
  })

  it('navigates to settings view via bottom nav', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: { plugins: [router] }
    })

    await flushPromises()

    // Click Settings tab
    const tabs = wrapper.findAll('.nav-tab')
    await tabs[2].trigger('click')

    await flushPromises()

    expect(router.currentRoute.value.name).toBe('settings')
  })

  it('shows correct active tab indicator', async () => {
    router.push('/files')
    await router.isReady()

    const wrapper = mount(App, {
      global: { plugins: [router] }
    })

    await flushPromises()

    const activeTab = wrapper.find('.nav-tab.active')
    expect(activeTab.text()).toContain('Files')
  })

  it('back button from settings returns to home', async () => {
    router.push('/settings')
    await router.isReady()

    const wrapper = mount(App, {
      global: { plugins: [router] }
    })

    await flushPromises()

    const backBtn = wrapper.find('.settings-view .back-btn')
    await backBtn.trigger('click')

    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/')
  })
})
```

**Step 2: Run all tests**

Run: `npm run test:unit`
Expected: All tests pass (should be ~100+ tests total)

**Step 3: Verify build size**

Run: `npm run build`
Expected: Build succeeds, bundle size under 300KB gzipped

**Step 4: Manual verification checklist**

```bash
# Start dev server
npm run dev

# Test in browser at http://localhost:5173
# Verify:
# - [ ] Home view loads by default
# - [ ] Bottom nav shows Home/Files/Settings tabs
# - [ ] Clicking tabs navigates between views
# - [ ] Active tab has orange border
# - [ ] Back button works in Files and Settings
# - [ ] Slide transitions between views
# - [ ] All touch targets are 44px+ minimum
```

**Step 5: Commit**

```bash
git add tests/unit/integration/app.spec.ts
git commit -m "test: add integration tests for app navigation

- Full app mount with router
- Bottom nav tab navigation
- Active tab indicator
- Back button navigation from views
- Route transitions

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Verification

After all tasks complete:

1. Run full test suite: `npm run test:unit`
2. Verify build: `npm run build`
3. Check bundle size: `ls -lh dist/assets/*.js`
4. Type check: `npx vue-tsc --noEmit`
5. Manual test in browser: `npm run dev`

**Expected outcomes:**
- 100+ unit tests passing
- Bundle size < 300KB gzipped
- No TypeScript errors
- Smooth 60fps navigation transitions
- All touch targets meet minimum size requirements
