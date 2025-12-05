# PrusaTouch Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a touch-optimized Vue 3 interface for PrusaLink on Raspberry Pi 4 with HyperPixel 4 display

**Architecture:** Vue 3 (Composition API) + TypeScript + Vite + Pinia for state management. Auto-generated API client from OpenAPI spec. Custom CSS with GPU-accelerated animations. Target <300KB bundle, 60fps on Pi 4.

**Tech Stack:** Vue 3, TypeScript 5.x, Vite 5.x, Pinia, Axios, openapi-typescript-codegen, Vitest, Playwright

**Prerequisites:** Node.js 24.x LTS (Krypton) - Latest LTS as of December 2025

---

## Prerequisites: Node.js Installation

**Required:** Node.js 24.x LTS (Krypton)

**Verify Node.js version:**

Run: `node --version`
Expected: v24.x.x

**If Node.js 24.x is not installed:**

Using nvm (recommended):
```bash
# Install nvm if not already installed
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js 24 LTS
nvm install 24
nvm use 24
nvm alias default 24
```

Or download from: https://nodejs.org/

**Verify installation:**

Run: `node --version && npm --version`
Expected: Node v24.x.x and npm 10.x.x

---

## Task 1: Project Initialization

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `.gitignore`

**Step 1: Initialize npm project**

Run: `npm init -y`
Expected: Creates package.json

**Step 2: Install core dependencies**

Run:
```bash
npm install vue@^3.4.0 pinia@^2.1.0 axios@^1.6.0 vue-router@^4.2.0
```
Expected: Dependencies installed

**Step 3: Install dev dependencies**

Run:
```bash
npm install -D @vitejs/plugin-vue@^5.0.0 vite@^5.0.0 typescript@^5.3.0 vue-tsc@^1.8.0 vitest@^1.1.0 @playwright/test@^1.40.0 @vue/test-utils@^2.4.0 happy-dom@^12.10.0
```
Expected: Dev dependencies installed

**Step 4: Install OpenAPI code generator**

Run:
```bash
npm install -D openapi-typescript-codegen@^0.27.0
```
Expected: Codegen tool installed

**Step 5: Update package.json scripts**

Edit `package.json` to add scripts:

```json
{
  "name": "prusatouch",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview",
    "test:unit": "vitest",
    "test:e2e": "playwright test",
    "generate:api": "openapi --input ./spec/openapi.yaml --output ./src/api --client axios"
  }
}
```

**Step 6: Create Vite configuration**

Create `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],

  build: {
    target: 'es2020',
    minify: 'terser',
    cssCodeSplit: true,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-vue': ['vue', 'pinia', 'vue-router'],
          'vendor-api': ['axios']
        }
      }
    }
  },

  optimizeDeps: {
    include: ['vue', 'pinia', 'axios', 'vue-router']
  },

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
```

**Step 7: Create TypeScript configuration**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,

    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",

    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Step 8: Create Node TypeScript config**

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

**Step 9: Create .gitignore**

Create `.gitignore`:

```
node_modules
dist
dist-ssr
*.local
.DS_Store
coverage
playwright-report
test-results
src/api/
```

**Step 10: Create directory structure**

Run:
```bash
mkdir -p src/{components,views,stores,composables,router,styles,assets/icons,api} spec tests/{unit,e2e} public
```
Expected: All directories created

**Step 11: Commit initial setup**

Run:
```bash
git add .
git commit -m "feat: initial project setup with Vite, Vue 3, and TypeScript"
```
Expected: Initial commit created

---

## Task 2: OpenAPI Spec and API Client Generation

**Files:**
- Create: `spec/openapi.yaml`
- Generate: `src/api/*` (auto-generated)

**Step 1: Create OpenAPI spec directory**

Run: `mkdir -p spec`
Expected: Directory created

**Step 2: Create PrusaLink OpenAPI spec**

Create `spec/openapi.yaml`:

```yaml
openapi: 3.0.0
info:
  title: PrusaLink API
  version: 1.0.0
  description: API for controlling Prusa 3D printers

servers:
  - url: /api/v1

paths:
  /status:
    get:
      summary: Get printer status
      operationId: getStatus
      responses:
        '200':
          description: Printer status
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StatusResponse'

  /job:
    get:
      summary: Get current job
      operationId: getJob
      responses:
        '200':
          description: Current job information
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/JobResponse'

  /job/{id}/pause:
    put:
      summary: Pause print job
      operationId: pauseJob
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: Job paused

  /job/{id}/resume:
    put:
      summary: Resume print job
      operationId: resumeJob
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: Job resumed

  /job/{id}:
    delete:
      summary: Stop print job
      operationId: stopJob
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: Job stopped

  /storage:
    get:
      summary: Get available storage locations
      operationId: getStorages
      responses:
        '200':
          description: List of storages
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Storage'

  /files/{storage}/{path}:
    get:
      summary: List files
      operationId: getFiles
      parameters:
        - name: storage
          in: path
          required: true
          schema:
            type: string
        - name: path
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: File list
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FileListResponse'
    post:
      summary: Start print
      operationId: startPrint
      parameters:
        - name: storage
          in: path
          required: true
          schema:
            type: string
        - name: path
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: Print started
    delete:
      summary: Delete file
      operationId: deleteFile
      parameters:
        - name: storage
          in: path
          required: true
          schema:
            type: string
        - name: path
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: File deleted

components:
  schemas:
    StatusResponse:
      type: object
      properties:
        printer:
          $ref: '#/components/schemas/PrinterStatus'

    PrinterStatus:
      type: object
      properties:
        state:
          type: string
          enum: [IDLE, PRINTING, PAUSED, FINISHED, ERROR]
        temp_nozzle:
          type: number
        temp_bed:
          type: number
        target_nozzle:
          type: number
        target_bed:
          type: number

    JobResponse:
      type: object
      properties:
        id:
          type: string
        state:
          type: string
        progress:
          type: number
        time_remaining:
          type: number
        time_printing:
          type: number
        file:
          $ref: '#/components/schemas/FileInfo'

    FileInfo:
      type: object
      properties:
        name:
          type: string
        path:
          type: string
        size:
          type: number
        m_timestamp:
          type: number

    Storage:
      type: object
      properties:
        path:
          type: string
        name:
          type: string
        read_only:
          type: boolean

    FileListResponse:
      type: object
      properties:
        children:
          type: array
          items:
            $ref: '#/components/schemas/FileInfo'
```

**Step 3: Generate API client**

Run: `npm run generate:api`
Expected: API client generated in `src/api/`

**Step 4: Verify generated files**

Run: `ls -la src/api/`
Expected: See `index.ts`, `models/`, `services/` directories

**Step 5: Commit API setup**

Run:
```bash
git add spec/
git commit -m "feat: add PrusaLink OpenAPI specification"
```
Expected: Commit created

---

## Task 3: Design System - CSS Variables and Base Styles

**Files:**
- Create: `src/styles/variables.css`
- Create: `src/styles/animations.css`
- Create: `src/styles/global.css`
- Create: `index.html`

**Step 1: Create CSS variables**

Create `src/styles/variables.css`:

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

  /* Display Specs */
  --display-width: 800px;
  --display-height: 480px;
}
```

**Step 2: Create GPU-accelerated animations**

Create `src/styles/animations.css`:

```css
/* Only animate transform and opacity for GPU acceleration */

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes slide-down {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(100%);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.pulse {
  animation: pulse 2s ease-in-out infinite;
}

.fade-in {
  animation: fade-in var(--transition-normal) ease-out;
}

.shimmer {
  position: relative;
  overflow: hidden;
}

.shimmer::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  animation: shimmer 2s infinite;
}
```

**Step 3: Create global styles**

Create `src/styles/global.css`:

```css
@import './variables.css';
@import './animations.css';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Touch optimization */
button, a, [role="button"] {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--bg-tertiary);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--prusa-orange);
}

/* Disable text selection on UI elements */
.no-select {
  user-select: none;
  -webkit-user-select: none;
}

/* Loading skeleton */
.skeleton {
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
}

.skeleton-thumbnail {
  width: 64px;
  height: 64px;
}

.skeleton-text {
  width: 200px;
  height: 20px;
}
```

**Step 4: Create index.html**

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="mobile-web-app-capable" content="yes">
  <title>PrusaTouch</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

**Step 5: Commit styles**

Run:
```bash
git add src/styles/ index.html
git commit -m "feat: add design system with CSS variables and animations"
```
Expected: Commit created

---

## Task 4: Pinia Stores - Printer Store

**Files:**
- Create: `src/stores/printer.ts`
- Create: `tests/unit/stores/printer.spec.ts`

**Step 1: Write the failing test**

Create `tests/unit/stores/printer.spec.ts`:

```typescript
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePrinterStore } from '../../../src/stores/printer'

describe('printerStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with null status', () => {
    const store = usePrinterStore()
    expect(store.status).toBeNull()
    expect(store.connection.connected).toBe(false)
  })

  it('starts polling when startPolling is called', () => {
    const store = usePrinterStore()
    store.startPolling()
    expect(store.polling.enabled).toBe(true)
  })

  it('stops polling when stopPolling is called', () => {
    const store = usePrinterStore()
    store.startPolling()
    store.stopPolling()
    expect(store.polling.enabled).toBe(false)
  })

  it('updates status on successful fetch', async () => {
    const store = usePrinterStore()
    const mockStatus = {
      printer: {
        state: 'IDLE',
        temp_nozzle: 25,
        temp_bed: 22,
        target_nozzle: 0,
        target_bed: 0
      }
    }

    // Mock API call
    vi.mock('../../../src/api', () => ({
      StatusService: {
        getStatus: vi.fn().mockResolvedValue(mockStatus)
      }
    }))

    await store.fetchStatus()
    expect(store.status).toEqual(mockStatus.printer)
    expect(store.connection.connected).toBe(true)
  })

  it('returns isPrinting true when state is PRINTING', () => {
    const store = usePrinterStore()
    store.status = { state: 'PRINTING', temp_nozzle: 210, temp_bed: 60, target_nozzle: 215, target_bed: 60 }
    expect(store.isPrinting).toBe(true)
  })

  it('returns isPrinting false when state is IDLE', () => {
    const store = usePrinterStore()
    store.status = { state: 'IDLE', temp_nozzle: 25, temp_bed: 22, target_nozzle: 0, target_bed: 0 }
    expect(store.isPrinting).toBe(false)
  })

  it('adjusts polling interval based on printer state', () => {
    const store = usePrinterStore()

    store.status = { state: 'PRINTING', temp_nozzle: 210, temp_bed: 60, target_nozzle: 215, target_bed: 60 }
    expect(store.pollingInterval).toBe(2000)

    store.status = { state: 'IDLE', temp_nozzle: 25, temp_bed: 22, target_nozzle: 0, target_bed: 0 }
    expect(store.pollingInterval).toBe(5000)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- printer.spec.ts`
Expected: Tests FAIL with "Cannot find module" errors

**Step 3: Write minimal implementation**

Create `src/stores/printer.ts`:

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PrinterStatus } from '../api/models/PrinterStatus'

export const usePrinterStore = defineStore('printer', () => {
  // State
  const status = ref<PrinterStatus | null>(null)
  const connection = ref({
    connected: false,
    lastUpdate: null as Date | null,
    retryCount: 0
  })
  const polling = ref({
    interval: 5000,
    enabled: false,
    timerId: null as number | null
  })

  // Getters
  const isConnected = computed(() => connection.value.connected)
  const isPrinting = computed(() => status.value?.state === 'PRINTING')
  const pollingInterval = computed(() => {
    return isPrinting.value ? 2000 : 5000
  })

  // Actions
  async function fetchStatus() {
    try {
      // Import API service
      const { StatusService } = await import('../api')
      const response = await StatusService.getStatus()

      status.value = response.printer
      connection.value.connected = true
      connection.value.lastUpdate = new Date()
      connection.value.retryCount = 0
    } catch (error) {
      connection.value.connected = false
      connection.value.retryCount++
      console.error('Failed to fetch status:', error)
    }
  }

  function startPolling() {
    polling.value.enabled = true

    // Start immediate fetch
    fetchStatus()

    // Setup interval
    const poll = () => {
      if (!polling.value.enabled) return

      fetchStatus().finally(() => {
        if (polling.value.enabled) {
          polling.value.timerId = window.setTimeout(poll, pollingInterval.value)
        }
      })
    }

    polling.value.timerId = window.setTimeout(poll, pollingInterval.value)
  }

  function stopPolling() {
    polling.value.enabled = false
    if (polling.value.timerId) {
      clearTimeout(polling.value.timerId)
      polling.value.timerId = null
    }
  }

  return {
    // State
    status,
    connection,
    polling,

    // Getters
    isConnected,
    isPrinting,
    pollingInterval,

    // Actions
    fetchStatus,
    startPolling,
    stopPolling
  }
})
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- printer.spec.ts`
Expected: Tests PASS

**Step 5: Commit printer store**

Run:
```bash
git add src/stores/printer.ts tests/unit/stores/printer.spec.ts
git commit -m "feat: add printer store with status polling"
```
Expected: Commit created

---

## Task 5: Pinia Stores - Job Store

**Files:**
- Create: `src/stores/job.ts`
- Create: `tests/unit/stores/job.spec.ts`

**Step 1: Write the failing test**

Create `tests/unit/stores/job.spec.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useJobStore } from '../../../src/stores/job'

describe('jobStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with null currentJob', () => {
    const store = useJobStore()
    expect(store.currentJob).toBeNull()
    expect(store.history).toEqual([])
  })

  it('calculates progress percentage correctly', () => {
    const store = useJobStore()
    store.currentJob = {
      id: '123',
      state: 'PRINTING',
      progress: 0.45,
      time_remaining: 1800,
      time_printing: 900,
      file: { name: 'test.gcode', path: '/test.gcode', size: 1024, m_timestamp: Date.now() }
    }
    expect(store.progressPercent).toBe(45)
  })

  it('formats time remaining correctly', () => {
    const store = useJobStore()
    store.currentJob = {
      id: '123',
      state: 'PRINTING',
      progress: 0.45,
      time_remaining: 3665, // 1h 1m 5s
      time_printing: 900,
      file: { name: 'test.gcode', path: '/test.gcode', size: 1024, m_timestamp: Date.now() }
    }
    expect(store.timeRemainingFormatted).toBe('1h 1m')
  })

  it('adds completed job to history', () => {
    const store = useJobStore()
    const job = {
      id: '123',
      state: 'FINISHED',
      progress: 1,
      time_remaining: 0,
      time_printing: 3600,
      file: { name: 'test.gcode', path: '/test.gcode', size: 1024, m_timestamp: Date.now() }
    }

    store.addToHistory(job)
    expect(store.history).toHaveLength(1)
    expect(store.history[0]).toEqual(job)
  })

  it('limits history to 10 items', () => {
    const store = useJobStore()

    for (let i = 0; i < 15; i++) {
      store.addToHistory({
        id: `${i}`,
        state: 'FINISHED',
        progress: 1,
        time_remaining: 0,
        time_printing: 3600,
        file: { name: `test${i}.gcode`, path: `/test${i}.gcode`, size: 1024, m_timestamp: Date.now() }
      })
    }

    expect(store.history).toHaveLength(10)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- job.spec.ts`
Expected: Tests FAIL

**Step 3: Write minimal implementation**

Create `src/stores/job.ts`:

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { JobResponse } from '../api/models/JobResponse'

export const useJobStore = defineStore('job', () => {
  // State
  const currentJob = ref<JobResponse | null>(null)
  const history = ref<JobResponse[]>([])
  const control = ref({
    pauseInProgress: false,
    stopInProgress: false
  })

  // Getters
  const progressPercent = computed(() => {
    if (!currentJob.value) return 0
    return Math.round(currentJob.value.progress * 100)
  })

  const timeRemainingFormatted = computed(() => {
    if (!currentJob.value || !currentJob.value.time_remaining) return ''

    const seconds = currentJob.value.time_remaining
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  })

  // Actions
  async function fetchJob() {
    try {
      const { JobService } = await import('../api')
      const response = await JobService.getJob()
      currentJob.value = response
    } catch (error) {
      console.error('Failed to fetch job:', error)
    }
  }

  async function pauseJob(id: string) {
    try {
      control.value.pauseInProgress = true
      const { JobService } = await import('../api')
      await JobService.pauseJob(id)
      await fetchJob()
    } catch (error) {
      console.error('Failed to pause job:', error)
    } finally {
      control.value.pauseInProgress = false
    }
  }

  async function resumeJob(id: string) {
    try {
      const { JobService } = await import('../api')
      await JobService.resumeJob(id)
      await fetchJob()
    } catch (error) {
      console.error('Failed to resume job:', error)
    }
  }

  async function stopJob(id: string) {
    try {
      control.value.stopInProgress = true
      const { JobService } = await import('../api')
      await JobService.stopJob(id)

      // Add to history before clearing
      if (currentJob.value) {
        addToHistory(currentJob.value)
      }

      currentJob.value = null
    } catch (error) {
      console.error('Failed to stop job:', error)
    } finally {
      control.value.stopInProgress = false
    }
  }

  function addToHistory(job: JobResponse) {
    history.value.unshift(job)

    // Keep only last 10
    if (history.value.length > 10) {
      history.value = history.value.slice(0, 10)
    }
  }

  return {
    // State
    currentJob,
    history,
    control,

    // Getters
    progressPercent,
    timeRemainingFormatted,

    // Actions
    fetchJob,
    pauseJob,
    resumeJob,
    stopJob,
    addToHistory
  }
})
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- job.spec.ts`
Expected: Tests PASS

**Step 5: Commit job store**

Run:
```bash
git add src/stores/job.ts tests/unit/stores/job.spec.ts
git commit -m "feat: add job store with print control actions"
```
Expected: Commit created

---

## Task 6: Pinia Stores - Files Store

**Files:**
- Create: `src/stores/files.ts`
- Create: `tests/unit/stores/files.spec.ts`

**Step 1: Write the failing test**

Create `tests/unit/stores/files.spec.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFilesStore } from '../../../src/stores/files'

describe('filesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with empty state', () => {
    const store = useFilesStore()
    expect(store.files).toEqual([])
    expect(store.currentPath).toBe('/')
    expect(store.loading).toBe(false)
  })

  it('generates breadcrumbs from current path', () => {
    const store = useFilesStore()
    store.currentPath = '/folder1/folder2/folder3'

    expect(store.breadcrumbs).toEqual([
      { name: 'Home', path: '/' },
      { name: 'folder1', path: '/folder1' },
      { name: 'folder2', path: '/folder1/folder2' },
      { name: 'folder3', path: '/folder1/folder2/folder3' }
    ])
  })

  it('sorts files by type then name', () => {
    const store = useFilesStore()
    store.files = [
      { name: 'zebra.gcode', path: '/zebra.gcode', size: 100, m_timestamp: 1000 },
      { name: 'apple', path: '/apple', size: 0, m_timestamp: 1000 },
      { name: 'banana.gcode', path: '/banana.gcode', size: 200, m_timestamp: 1000 }
    ]

    const sorted = store.sortedFiles
    expect(sorted[0].name).toBe('apple') // Folders first
    expect(sorted[1].name).toBe('banana.gcode')
    expect(sorted[2].name).toBe('zebra.gcode')
  })

  it('caches thumbnails with LRU policy', () => {
    const store = useFilesStore()

    store.cacheThumbnail('/file1.gcode', 'data:image/png;base64,ABC')
    expect(store.getThumbnail('/file1.gcode')).toBe('data:image/png;base64,ABC')
  })

  it('limits thumbnail cache to 50 items', () => {
    const store = useFilesStore()

    for (let i = 0; i < 60; i++) {
      store.cacheThumbnail(`/file${i}.gcode`, `data${i}`)
    }

    // First 10 should be evicted
    expect(store.getThumbnail('/file0.gcode')).toBeNull()
    expect(store.getThumbnail('/file50.gcode')).toBe('data50')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- files.spec.ts`
Expected: Tests FAIL

**Step 3: Write minimal implementation**

Create `src/stores/files.ts`:

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FileInfo } from '../api/models/FileInfo'
import type { Storage } from '../api/models/Storage'

export const useFilesStore = defineStore('files', () => {
  // State
  const storages = ref<Storage[]>([])
  const currentPath = ref('/')
  const currentStorage = ref('local')
  const files = ref<FileInfo[]>([])
  const thumbnailCache = ref(new Map<string, string>())
  const loading = ref(false)

  // Getters
  const breadcrumbs = computed(() => {
    const parts = currentPath.value.split('/').filter(Boolean)
    const crumbs = [{ name: 'Home', path: '/' }]

    let buildPath = ''
    for (const part of parts) {
      buildPath += '/' + part
      crumbs.push({
        name: part,
        path: buildPath
      })
    }

    return crumbs
  })

  const sortedFiles = computed(() => {
    return [...files.value].sort((a, b) => {
      // Folders first
      const aIsFolder = !a.name.includes('.')
      const bIsFolder = !b.name.includes('.')

      if (aIsFolder && !bIsFolder) return -1
      if (!aIsFolder && bIsFolder) return 1

      // Then alphabetically
      return a.name.localeCompare(b.name)
    })
  })

  // Actions
  async function fetchStorages() {
    try {
      const { StorageService } = await import('../api')
      storages.value = await StorageService.getStorages()
    } catch (error) {
      console.error('Failed to fetch storages:', error)
    }
  }

  async function fetchFiles(storage: string, path: string) {
    try {
      loading.value = true
      const { FilesService } = await import('../api')
      const response = await FilesService.getFiles(storage, path)
      files.value = response.children || []
      currentPath.value = path
      currentStorage.value = storage
    } catch (error) {
      console.error('Failed to fetch files:', error)
    } finally {
      loading.value = false
    }
  }

  async function startPrint(storage: string, path: string) {
    try {
      const { FilesService } = await import('../api')
      await FilesService.startPrint(storage, path)
    } catch (error) {
      console.error('Failed to start print:', error)
      throw error
    }
  }

  async function deleteFile(storage: string, path: string) {
    try {
      const { FilesService } = await import('../api')
      await FilesService.deleteFile(storage, path)

      // Refresh file list
      await fetchFiles(storage, currentPath.value)
    } catch (error) {
      console.error('Failed to delete file:', error)
      throw error
    }
  }

  function cacheThumbnail(path: string, dataUrl: string) {
    // LRU cache: Remove oldest if at capacity
    if (thumbnailCache.value.size >= 50) {
      const firstKey = thumbnailCache.value.keys().next().value
      thumbnailCache.value.delete(firstKey)
    }
    thumbnailCache.value.set(path, dataUrl)
  }

  function getThumbnail(path: string): string | null {
    return thumbnailCache.value.get(path) || null
  }

  return {
    // State
    storages,
    currentPath,
    currentStorage,
    files,
    loading,

    // Getters
    breadcrumbs,
    sortedFiles,

    // Actions
    fetchStorages,
    fetchFiles,
    startPrint,
    deleteFile,
    cacheThumbnail,
    getThumbnail
  }
})
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- files.spec.ts`
Expected: Tests PASS

**Step 5: Commit files store**

Run:
```bash
git add src/stores/files.ts tests/unit/stores/files.spec.ts
git commit -m "feat: add files store with browser and caching"
```
Expected: Commit created

---

## Task 7: Core Component - TouchButton

**Files:**
- Create: `src/components/TouchButton.vue`
- Create: `tests/unit/components/TouchButton.spec.ts`

**Step 1: Write the failing test**

Create `tests/unit/components/TouchButton.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TouchButton from '../../../src/components/TouchButton.vue'

describe('TouchButton', () => {
  it('renders with default props', () => {
    const wrapper = mount(TouchButton, {
      slots: { default: 'Click me' }
    })
    expect(wrapper.text()).toBe('Click me')
    expect(wrapper.classes()).toContain('touch-button')
  })

  it('applies primary variant class', () => {
    const wrapper = mount(TouchButton, {
      props: { variant: 'primary' }
    })
    expect(wrapper.classes()).toContain('touch-button--primary')
  })

  it('applies secondary variant class', () => {
    const wrapper = mount(TouchButton, {
      props: { variant: 'secondary' }
    })
    expect(wrapper.classes()).toContain('touch-button--secondary')
  })

  it('applies danger variant class', () => {
    const wrapper = mount(TouchButton, {
      props: { variant: 'danger' }
    })
    expect(wrapper.classes()).toContain('touch-button--danger')
  })

  it('applies large size class', () => {
    const wrapper = mount(TouchButton, {
      props: { size: 'large' }
    })
    expect(wrapper.classes()).toContain('touch-button--large')
  })

  it('shows loading spinner when loading', () => {
    const wrapper = mount(TouchButton, {
      props: { loading: true }
    })
    expect(wrapper.find('.spinner').exists()).toBe(true)
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('is disabled when disabled prop is true', () => {
    const wrapper = mount(TouchButton, {
      props: { disabled: true }
    })
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(TouchButton)
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('does not emit click when disabled', async () => {
    const wrapper = mount(TouchButton, {
      props: { disabled: true }
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- TouchButton.spec.ts`
Expected: Tests FAIL

**Step 3: Write minimal implementation**

Create `src/components/TouchButton.vue`:

```vue
<template>
  <button
    class="touch-button"
    :class="[
      `touch-button--${variant}`,
      `touch-button--${size}`,
      { 'touch-button--loading': loading }
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="spinner"></span>
    <span v-else class="touch-button__content">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'medium' | 'large'
  loading?: boolean
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'medium',
  loading: false,
  disabled: false
})

const emit = defineEmits<{
  click: []
}>()

function handleClick() {
  emit('click')
}
</script>

<style scoped>
.touch-button {
  min-height: var(--touch-comfortable);
  padding: 15px 30px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: transform var(--transition-fast);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  font-family: inherit;
}

.touch-button:active:not(:disabled) {
  transform: scale(0.95);
}

.touch-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.touch-button--primary {
  background: var(--prusa-orange);
  color: white;
}

.touch-button--primary:hover:not(:disabled) {
  background: var(--prusa-orange-hover);
}

.touch-button--primary:active:not(:disabled) {
  background: var(--prusa-orange-active);
}

.touch-button--secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.touch-button--secondary:hover:not(:disabled) {
  background: var(--bg-tertiary);
}

.touch-button--danger {
  background: var(--status-error);
  color: white;
}

.touch-button--danger:hover:not(:disabled) {
  background: #ff0000;
}

.touch-button--large {
  min-height: var(--touch-large);
  font-size: 20px;
  padding: 20px 40px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.touch-button__content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
}
</style>
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- TouchButton.spec.ts`
Expected: Tests PASS

**Step 5: Commit TouchButton**

Run:
```bash
git add src/components/TouchButton.vue tests/unit/components/TouchButton.spec.ts
git commit -m "feat: add TouchButton component with variants and loading state"
```
Expected: Commit created

---

## Next Steps

This plan continues with:
- Task 8-15: Remaining core components (ProgressRing, TemperatureDisplay, FileListItem, StatusBadge, BottomSheet)
- Task 16-20: Composables (useStatus, useJob, useFiles, useToast, useConnection)
- Task 21-25: Views (HomeView, KioskMode, FilesView, SettingsView)
- Task 26-28: Router setup and main app initialization
- Task 29-32: E2E tests
- Task 33-35: Build optimization and deployment scripts

**Would you like me to continue with the remaining tasks, or would you prefer to start implementing these first tasks?**
