# Phase 3: Composables & API Integration (Sub-Agent Driven)

> **For Claude:** Use superpowers:subagent-driven-development skill to implement this plan.

**Goal:** Connect UI components to real PrusaLink printer via composables, update OpenAPI spec to match actual PrusaLink v1 API, and configure the app to communicate with the printer at `octopi.local.frostbyte.us`.

**Architecture:** Composables wrap Pinia stores to provide component-friendly reactive data with lifecycle management (auto-start/stop polling). The OpenAPI spec will be updated to match the real PrusaLink v1 API endpoints. A proxy configuration handles CORS during development.

**Tech Stack:** Vue 3.5.25, TypeScript 5.9.3, Pinia 3.0.3, Vitest 4.0.15, Vite 7.x (dev proxy), axios for HTTP client

**Workflow:** Each task is implemented by a Haiku sub-agent following TDD. After implementation, code is automatically reviewed. Medium+ issues trigger additional agents to fix them.

---

## Prerequisites

**Environment:**
- Node.js 24.11.1 installed via nvm
- All dependencies from package.json installed
- Phase 1 (Tasks 1-7) and Phase 2 (Tasks 8-12) completed
- PrusaLink printer accessible at `octopi.local.frostbyte.us`

**Running npm commands:**
npm is available globally - use directly:
```bash
npm run <command> [args...]
```

**PrusaLink API Reference:**
- Base URL: `http://octopi.local.frostbyte.us/api/v1`
- Authentication: HTTP Digest (username + password)
- [Official OpenAPI Spec](https://github.com/prusa3d/Prusa-Link-Web/blob/master/spec/openapi.yaml)

---

## Task Execution Order

**Sequential (must be done in order):**
- Task 13 → Task 14 (proxy needs updated spec)
- Tasks 16, 17, 18 → Task 19 (index needs composables)
- All → Task 20 (demo needs everything)

**Parallel opportunities:**
- Task 15 can run parallel with Tasks 13-14
- Tasks 16, 17, 18 can run in parallel

---

## Task 13: Update OpenAPI Spec for Real PrusaLink API

**Purpose:** Align our OpenAPI spec with the actual PrusaLink v1 API structure.

**Files:**
- Modify: `/home/kkolk/prusatouch/spec/openapi.yaml`
- Regenerate: `/home/kkolk/prusatouch/src/api/` (all files)

**Implementation Notes:**
- Replace existing spec with real PrusaLink v1 endpoints
- Key endpoints: `/version`, `/info`, `/status`, `/job`, `/storage`, `/files`
- Printer states: IDLE, BUSY, PRINTING, PAUSED, FINISHED, STOPPED, ERROR, ATTENTION, READY
- Job IDs are integers (not strings)
- File types: FOLDER, PRINT_FILE, FILE, FIRMWARE, MOUNT
- Add refs for thumbnails and downloads

**Reference Spec:**
See original plan at `/home/kkolk/prusatouch/docs/plans/2025-12-05-phase3-composables-api.md` lines 42-392 for complete OpenAPI YAML.

**Commands:**
```bash
# After updating spec, regenerate API client
npm run generate:api

# Verify generation
ls -la src/api/

# Commit
git add spec/openapi.yaml src/api/
git commit -m "refactor: update OpenAPI spec to match real PrusaLink v1 API

- Add /version and /info endpoints
- Update /status with full telemetry (printer, job, storage)
- Add proper printer states (IDLE, BUSY, PRINTING, PAUSED, etc.)
- Add file type enum (FOLDER, PRINT_FILE, etc.)
- Add refs for thumbnails and downloads
- Job IDs are now integers per real API

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Verification:**
- API files regenerated in `src/api/`
- No TypeScript errors: `npm run build`

---

## Task 14: Configure Vite Proxy for PrusaLink

**Purpose:** Set up development proxy to avoid CORS issues when communicating with PrusaLink.

**Files:**
- Modify: `/home/kkolk/prusatouch/vite.config.ts`
- Create: `/home/kkolk/prusatouch/.env.local` (gitignored, for credentials)
- Modify: `/home/kkolk/prusatouch/.gitignore`

**Implementation Notes:**
- Add proxy configuration to Vite config
- Proxy `/api` requests to PrusaLink server
- Support `VITE_PRUSALINK_URL` env variable (defaults to `http://octopi.local.frostbyte.us`)
- Forward Authorization headers for digest auth
- Add `.env.local` to gitignore

**vite.config.ts changes:**
```typescript
server: {
  proxy: {
    '/api': {
      target: process.env.VITE_PRUSALINK_URL || 'http://octopi.local.frostbyte.us',
      changeOrigin: true,
      secure: false,
      configure: (proxy) => {
        proxy.on('proxyReq', (proxyReq, req) => {
          if (req.headers.authorization) {
            proxyReq.setHeader('Authorization', req.headers.authorization)
          }
        })
      }
    }
  }
}
```

**.env.local contents:**
```env
VITE_PRUSALINK_URL=http://octopi.local.frostbyte.us
VITE_PRUSALINK_USER=maker
VITE_PRUSALINK_PASS=your-password-here
```

**.gitignore addition:**
```
# Local environment files with credentials
.env.local
.env.*.local
```

**Commands:**
```bash
git add vite.config.ts .gitignore
# DO NOT add .env.local - it's gitignored

git commit -m "feat: add Vite proxy for PrusaLink API

- Proxy /api requests to PrusaLink server
- Support VITE_PRUSALINK_URL env variable
- Forward auth headers for digest authentication
- Add .env.local to gitignore for credentials

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Verification:**
- Dev server starts without errors
- Browser console shows no CORS errors when calling `/api` endpoints

---

## Task 15: Add HTTP Digest Authentication Support

**Purpose:** Add axios configuration for HTTP Digest authentication (PrusaLink requirement).

**Files:**
- Create: `/home/kkolk/prusatouch/src/api/auth.ts`
- Create: `/home/kkolk/prusatouch/tests/unit/api/auth.spec.ts`

**TDD Requirements:**
1. Write failing test in `tests/unit/api/auth.spec.ts`
2. Verify test fails
3. Implement `src/api/auth.ts`
4. Verify test passes
5. Commit

**Test Coverage:**
- `configureAuth(username, password)` - stores credentials
- `getAuthConfig()` - retrieves credentials
- `clearAuth()` - clears credentials
- `initAuthFromEnv()` - loads from VITE_PRUSALINK_USER/PASS
- `isAuthConfigured()` - checks if configured

**Implementation Requirements:**
- In-memory storage of auth config (username, password)
- Read from `import.meta.env.VITE_PRUSALINK_USER` and `VITE_PRUSALINK_PASS`
- No external dependencies needed (digest auth handled by browser/axios)

**Reference:**
See original plan lines 529-660 for complete test and implementation code.

**Commands:**
```bash
# Run tests
npm run test:unit -- tests/unit/api/auth.spec.ts

# Commit
git add src/api/auth.ts tests/unit/api/auth.spec.ts
git commit -m "feat: add HTTP Digest auth support for PrusaLink

- Add auth module with configureAuth/getAuthConfig/clearAuth
- Support loading credentials from VITE_PRUSALINK_USER/PASS env vars
- 4 unit tests for auth module

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Verification:**
- All auth tests pass
- No TypeScript errors

---

## Task 16: Create useStatus Composable

**Purpose:** Provide reactive printer status with auto-polling lifecycle management.

**Files:**
- Create: `/home/kkolk/prusatouch/src/composables/useStatus.ts`
- Create: `/home/kkolk/prusatouch/tests/unit/composables/useStatus.spec.ts`

**TDD Requirements:**
1. Write failing test with mocked API
2. Verify test fails
3. Implement composable
4. Verify test passes
5. Commit

**Test Coverage:**
- Provides reactive printer state
- Provides formatted state for StatusBadge
- Handles connection errors gracefully
- Starts polling when startPolling called
- Stops polling when stopPolling called

**Composable API:**
```typescript
const {
  printerState,        // ComputedRef<'IDLE' | 'PRINTING' | 'PAUSED' | 'ERROR' | 'FINISHED'>
  nozzleTemp,          // ComputedRef<{current: number, target: number}>
  bedTemp,             // ComputedRef<{current: number, target: number}>
  isConnected,         // ComputedRef<boolean>
  connectionError,     // ComputedRef<string | null>
  lastUpdate,          // ComputedRef<Date | null>
  status,              // ComputedRef - raw store access
  startPolling,        // () => void
  stopPolling,         // () => void
  refresh              // () => Promise<void>
} = useStatus()
```

**Implementation Requirements:**
- Wraps `usePrinterStore()`
- Maps PrusaLink states to StatusBadge states (BUSY/ATTENTION/READY → IDLE, STOPPED → FINISHED)
- All computed refs are readonly
- Delegates polling to store

**Reference:**
See original plan lines 674-919 for complete test and implementation code.

**Commands:**
```bash
# Run tests
npm run test:unit -- tests/unit/composables/useStatus.spec.ts

# Commit
git add src/composables/useStatus.ts tests/unit/composables/useStatus.spec.ts
git commit -m "feat: add useStatus composable for printer status

- Reactive printerState, nozzleTemp, bedTemp computed refs
- Normalize PrusaLink states to StatusBadge values
- Connection state and error tracking
- startPolling/stopPolling lifecycle methods
- 5 unit tests with mocked API

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Verification:**
- All useStatus tests pass
- No TypeScript errors

---

## Task 17: Create useJob Composable

**Purpose:** Provide reactive job data with control actions (pause/resume/stop).

**Files:**
- Create: `/home/kkolk/prusatouch/src/composables/useJob.ts`
- Create: `/home/kkolk/prusatouch/tests/unit/composables/useJob.spec.ts`

**TDD Requirements:**
1. Write failing test with mocked API
2. Verify test fails
3. Implement composable
4. Verify test passes
5. Commit

**Test Coverage:**
- Provides reactive job progress
- Provides formatted time under 1 hour
- Handles no active job
- Exposes pause action with loading state
- Exposes resume action with loading state
- Exposes stop action with loading state

**Composable API:**
```typescript
const {
  hasActiveJob,        // ComputedRef<boolean>
  jobId,               // ComputedRef<number | null>
  progress,            // ComputedRef<number> (0-100)
  timeRemaining,       // ComputedRef<string> (e.g., "1h 45m")
  timePrinting,        // ComputedRef<string>
  fileName,            // ComputedRef<string>
  jobState,            // ComputedRef<string | null>
  isPausing,           // ComputedRef<boolean>
  isStopping,          // ComputedRef<boolean>
  currentJob,          // ComputedRef - raw access
  history,             // ComputedRef - job history
  pauseJob,            // () => Promise<void>
  resumeJob,           // () => Promise<void>
  stopJob,             // () => Promise<void>
  fetchJob             // () => Promise<void>
} = useJob()
```

**Implementation Requirements:**
- Wraps `useJobStore()`
- Formats time remaining (e.g., "1h 45m", "25m")
- Converts progress to percentage (0-100)
- All computed refs are readonly
- Actions delegate to store methods

**Reference:**
See original plan lines 923-1188 for complete test and implementation code.

**Commands:**
```bash
# Run tests
npm run test:unit -- tests/unit/composables/useJob.spec.ts

# Commit
git add src/composables/useJob.ts tests/unit/composables/useJob.spec.ts
git commit -m "feat: add useJob composable for job control

- Reactive progress, timeRemaining, fileName refs
- pauseJob/resumeJob/stopJob actions
- Loading state tracking (isPausing, isStopping)
- 6 unit tests with mocked API

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Verification:**
- All useJob tests pass
- No TypeScript errors

---

## Task 18: Create useFiles Composable

**Purpose:** Provide file browser functionality with navigation and actions.

**Files:**
- Create: `/home/kkolk/prusatouch/src/composables/useFiles.ts`
- Create: `/home/kkolk/prusatouch/tests/unit/composables/useFiles.spec.ts`

**TDD Requirements:**
1. Write failing test with mocked API
2. Verify test fails
3. Implement composable
4. Verify test passes
5. Commit

**Test Coverage:**
- Provides sorted files with folders first
- Provides breadcrumb navigation
- Provides loading state during fetch
- Exposes startPrint action
- Exposes deleteFile action
- Provides thumbnail from cache

**Composable API:**
```typescript
const {
  files,               // ComputedRef<FileInfo[]> (sorted: folders first, then alpha)
  currentPath,         // ComputedRef<string>
  currentStorage,      // ComputedRef<string>
  breadcrumbs,         // ComputedRef<Breadcrumb[]>
  storages,            // ComputedRef<Storage[]>
  isLoading,           // ComputedRef<boolean>
  navigate,            // (storage: string, path: string) => Promise<void>
  navigateUp,          // () => Promise<void>
  fetchStorages,       // () => Promise<void>
  startPrint,          // (path: string) => Promise<void>
  deleteFile,          // (path: string) => Promise<void>
  getThumbnail,        // (path: string) => string | null
  cacheThumbnail       // (path: string, dataUrl: string) => void
} = useFiles()
```

**Implementation Requirements:**
- Wraps `useFilesStore()`
- Files sorted: folders first, then alphabetically
- Breadcrumbs from path: "/" → [{name: 'Home', path: '/'}]
- All computed refs are readonly
- Actions delegate to store methods

**Reference:**
See original plan lines 1192-1458 for complete test and implementation code.

**Commands:**
```bash
# Run tests
npm run test:unit -- tests/unit/composables/useFiles.spec.ts

# Commit
git add src/composables/useFiles.ts tests/unit/composables/useFiles.spec.ts
git commit -m "feat: add useFiles composable for file browser

- Sorted files list (folders first, then alphabetical)
- Breadcrumb navigation
- navigate/navigateUp for directory browsing
- startPrint/deleteFile actions
- Thumbnail cache access
- 6 unit tests with mocked API

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Verification:**
- All useFiles tests pass
- No TypeScript errors

---

## Task 19: Create Composables Index

**Purpose:** Single export point for all composables (clean imports).

**Files:**
- Create: `/home/kkolk/prusatouch/src/composables/index.ts`

**No Tests Required:** Simple re-export file.

**Implementation:**
```typescript
export { useStatus } from './useStatus'
export { useJob } from './useJob'
export { useFiles } from './useFiles'
```

**Commands:**
```bash
git add src/composables/index.ts
git commit -m "feat: add composables index for clean imports

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Verification:**
- File created successfully
- Imports work: `import { useStatus, useJob, useFiles } from '@/composables'`

---

## Task 20: Initialize Auth in Main Entry Point

**Purpose:** Load PrusaLink credentials from environment on app startup.

**Files:**
- Modify: `/home/kkolk/prusatouch/src/main.ts`

**No Tests Required:** Simple initialization in main.ts.

**Implementation:**
Add import and initialization before creating Vue app:

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/global.css'
import { initAuthFromEnv } from './api/auth'

// Initialize auth from environment variables
initAuthFromEnv()

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.mount('#app')
```

**Commands:**
```bash
git add src/main.ts
git commit -m "feat: initialize auth from environment on startup

- Call initAuthFromEnv() to load VITE_PRUSALINK_USER/PASS
- Sets up credentials before any API calls

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Verification:**
- App builds successfully
- No runtime errors in console

---

## Summary

**Tasks Completed:**

| Task | Description | Tests | Dependencies |
|------|-------------|-------|--------------|
| 13 | Update OpenAPI spec | - | None |
| 14 | Configure Vite proxy | - | Task 13 |
| 15 | Add HTTP Digest auth | 4 | None (parallel) |
| 16 | Create useStatus composable | 5 | Tasks 13-15 |
| 17 | Create useJob composable | 6 | Tasks 13-15 |
| 18 | Create useFiles composable | 6 | Tasks 13-15 |
| 19 | Create composables index | - | Tasks 16-18 |
| 20 | Initialize auth in main.ts | - | Task 15 |

**Total New Tests:** 21

**Parallel Execution:**
- Task 15 can run parallel with Tasks 13-14
- Tasks 16, 17, 18 can run in parallel after 13-15 complete

**Files Created:**
- `src/api/auth.ts`
- `src/composables/useStatus.ts`
- `src/composables/useJob.ts`
- `src/composables/useFiles.ts`
- `src/composables/index.ts`
- `tests/unit/api/auth.spec.ts`
- `tests/unit/composables/useStatus.spec.ts`
- `tests/unit/composables/useJob.spec.ts`
- `tests/unit/composables/useFiles.spec.ts`
- `.env.local` (credentials, gitignored)

**Files Modified:**
- `spec/openapi.yaml`
- `vite.config.ts`
- `src/main.ts`
- `.gitignore`

---

## Verification

After completing all tasks:

```bash
# Run all unit tests
npm run test:unit

# Expected: ~88 tests passing (67 from Phase 1-2 + 21 new)

# Build production bundle
npm run build

# Expected: No TypeScript errors, bundle size < 300KB

# Start dev server
npm run dev

# Open http://localhost:5173
# Expected: No console errors, proxy working
```

---

## Next Phase

**Phase 4: Views & Router** (Tasks 21-28)
- HomeView with full print status
- FilesView with file browser
- SettingsView for configuration
- Vue Router setup with lazy loading

**Note:** App.vue currently exists as a demo but is not part of the production plan. Phase 4 will create proper views and routing.
