# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PrusaTouch** is a custom touch-optimized interface for PrusaLink, designed for Raspberry Pi 4 (1GB RAM) with HyperPixel 4 display (800x480). This is a showcase AI development project demonstrating modern web practices within hardware constraints.

**Design Philosophy:** Performance-first, touch-optimized, 60fps animations, <300KB bundle size, GPU-accelerated rendering only.

## Tech Stack

- **Framework:** Vue 3 (Composition API) - Lower memory footprint than React
- **Language:** TypeScript 5.x - Type safety from auto-generated OpenAPI client
- **Build Tool:** Vite 5.x - Fast builds, optimized dev server
- **State:** Pinia - Official Vue state management
- **API:** Auto-generated from OpenAPI spec via `openapi-typescript-codegen`
- **HTTP:** Axios with retry logic
- **Testing:** Vitest (unit), Playwright (E2E)
- **Styling:** Custom CSS with CSS Variables (no frameworks)

## Common Commands

```bash
# Development
npm install                    # Install dependencies
npm run dev                    # Start dev server (http://localhost:5173)
npm run generate:api          # Regenerate API client from spec/openapi.yaml

# Testing
npm run test:unit             # Run all unit tests with Vitest
npm run test:unit -- <file>   # Run specific test file
npm run test:e2e              # Run E2E tests with Playwright

# Build
npm run build                 # Production build (outputs to dist/)
npm run preview               # Preview production build

# Type checking
vue-tsc --noEmit              # Check TypeScript types without emitting
```

## Architecture

### Directory Structure

```
src/
├── api/              # Auto-generated from OpenAPI (DO NOT EDIT)
├── components/       # Reusable Vue components
├── views/            # Page-level components
├── stores/           # Pinia stores (printer, job, files)
├── composables/      # Vue composables for shared logic
├── router/           # Vue Router configuration
├── styles/           # Global CSS (variables, animations, base)
└── assets/           # Static assets (icons, images)
```

### State Management Pattern

**Data Flow:**
```
User Interaction → Component → Composable → Pinia Store → API Service → PrusaLink
                                                 ↓
                                          Vue Reactivity → Component Re-render
```

**Three Core Stores:**

1. **printerStore** (`src/stores/printer.ts`)
   - Manages printer status polling
   - Adjusts interval: 2s when printing, 5s when idle
   - Handles connection errors with retry logic

2. **jobStore** (`src/stores/job.ts`)
   - Current print job state
   - Control actions: pause/resume/stop
   - Job history (last 10 prints)

3. **filesStore** (`src/stores/files.ts`)
   - File browser navigation
   - Thumbnail caching (LRU, max 50)
   - Storage management

### API Client

**IMPORTANT:** The `src/api/` directory is auto-generated. Never edit files directly.

**To update API:**
1. Edit `spec/openapi.yaml`
2. Run `npm run generate:api`
3. Commit both the spec and generated files

### Component Patterns

**All components follow:**
- Vue 3 Composition API with `<script setup>`
- TypeScript with explicit prop/emit types
- Scoped styles using CSS variables

**TouchButton Example:**
```vue
<TouchButton
  variant="primary|secondary|danger"
  size="medium|large"
  :loading="boolean"
  :disabled="boolean"
  @click="handler"
>
  Button Text
</TouchButton>
```

### Performance Constraints

**CRITICAL GPU Animation Rule:**

Only animate `transform` and `opacity`. NEVER animate:
- width, height, margin, padding
- color, background-color, border-color
- top, left, right, bottom (use transform instead)

**Why:** Pi 4's VideoCore VI GPU handles transform/opacity natively. Other properties trigger CPU layout/paint and kill performance.

**Good:**
```css
.slide-in {
  transform: translateY(0);
  transition: transform 0.3s;
}
```

**Bad:**
```css
.slide-in {
  top: 0;              /* Triggers layout on CPU */
  transition: top 0.3s;
}
```

### Polling Strategy

**Adaptive Polling:**
- Printing: 2000ms interval
- Idle: 5000ms interval
- Offline: Stop polling, retry every 5s

**Implementation in composables:**
```typescript
onMounted(() => store.startPolling())
onUnmounted(() => store.stopPolling())
```

### Error Handling

**Network Errors:**
1. First failure: Silent retry after 1s
2. Second failure: Retry after 2s, show toast
3. Third failure: Show "PrusaLink Offline" banner, stop polling
4. Recovery: Auto-resume when connection restored

**HTTP Status Codes:**
- 401: Show auth modal
- 404: Refresh file list
- 409: Show "Printer busy" toast
- 503: Show "PrusaLink updating" banner

## Design System

### CSS Variables

All colors, spacing, and timing defined in `src/styles/variables.css`:

**Key Variables:**
```css
--prusa-orange: #ff6600           /* Primary brand color */
--touch-comfortable: 60px         /* Standard touch target */
--transition-fast: 0.1s           /* Button feedback */
--transition-normal: 0.2s         /* Tab switches */
--transition-slow: 0.3s           /* Screen transitions */
```

### Touch Targets

**Minimum sizes:**
- Minimum: 44x44px (Apple HIG standard)
- Comfortable: 60px (default buttons)
- Large: 80px (primary actions)

### Prusa Core One Aesthetic

- **Primary accent:** Orange (#FF6600)
- **Theme:** Dark with high contrast
- **Typography:** System sans-serif stack
- **Icons:** Clean, minimal line style

## Testing Strategy

### Unit Tests (Vitest)

**TDD Workflow:**
1. Write failing test in `tests/unit/`
2. Run test, verify failure
3. Implement minimal code
4. Run test, verify pass
5. Commit

**Store Testing Pattern:**
```typescript
import { setActivePinia, createPinia } from 'pinia'
import { useMyStore } from '../../../src/stores/myStore'

beforeEach(() => {
  setActivePinia(createPinia())
})
```

### E2E Tests (Playwright)

**Critical flows to test:**
- Wake from kiosk → Select file → Start print
- Pause/resume print
- Stop print with confirmation
- File browser navigation
- Settings changes

## Current Implementation Status

**Checkpoint System:**

Check `docs/plans/2024-12-04-prusatouch-initial-setup.md` for the complete implementation plan.

**Progress tracking via git tags:**
```bash
git tag --list 'checkpoint-*'     # List all checkpoints
git show checkpoint-task-N        # View checkpoint details
```

**Implementation phases:**
- [ ] Phase 1: Project setup + API + Stores (Tasks 1-6)
- [ ] Phase 2: Core components (Tasks 7-15)
- [ ] Phase 3: Composables (Tasks 16-20)
- [ ] Phase 4: Views + Router (Tasks 21-28)
- [ ] Phase 5: Testing + Deployment (Tasks 29-35)

## Important Notes

### Bundle Size Target

**Goal:** <300KB gzipped

**Strategies:**
- Tree-shaking via Vite (automatic)
- Code splitting: Lazy load Settings and Files views
- No component libraries (custom components only)
- Minimal dependencies

**Check bundle size:**
```bash
npm run build
ls -lh dist/assets/*.js
```

### Memory Constraints

**Target:** <400MB RAM usage on Pi 4 (1GB total)

**Techniques:**
- LRU caching for thumbnails (max 50)
- Virtual scrolling for long file lists (>50 items)
- Limit temperature history (last 100 points)
- Cleanup intervals on component unmount

### Deployment to Raspberry Pi

**Build and deploy:**
```bash
npm run build
scp -r dist/* pi@prusa-mk3s.local:/var/www/html/prusatouch/
```

**Chromium kiosk mode:**
See `/home/pi/start-prusatouch.sh` on target Pi for launch configuration.

## Development Workflow

### Starting a New Task

1. Read task details in implementation plan
2. Create feature branch: `git checkout -b task-N-feature-name`
3. Write failing test
4. Implement minimal solution
5. Verify tests pass
6. Commit with conventional format: `feat: add feature X`
7. Create checkpoint tag: `git tag checkpoint-task-N`

### Conventional Commits

```
feat: add new feature
fix: bug fix
test: add/update tests
refactor: code refactoring
style: formatting changes
docs: documentation updates
chore: maintenance tasks
```

### Adding New API Endpoints

1. Edit `spec/openapi.yaml`
2. Add endpoint definition with request/response schemas
3. Run `npm run generate:api`
4. Update relevant store to use new service method
5. Add tests for new functionality
6. Commit spec + generated code together

## Common Pitfalls

### DO NOT:
- ❌ Edit files in `src/api/` directly (they're auto-generated)
- ❌ Animate anything except `transform` and `opacity`
- ❌ Add component libraries (breaks bundle size goal)
- ❌ Use `console.log` in production (removed by build)
- ❌ Poll faster than 2s (overloads Pi CPU)
- ❌ Cache API keys in localStorage (security risk)

### DO:
- ✅ Use CSS variables for all colors/spacing
- ✅ Test on actual Pi hardware before considering complete
- ✅ Clean up intervals/timers in `onUnmounted`
- ✅ Follow TDD: test first, then implement
- ✅ Keep components small and focused
- ✅ Use Pinia stores for shared state

## Reference Documentation

**Full design specification:** `docs/prusatouch-design-initial.md`
**Implementation plan:** `docs/plans/2024-12-04-prusatouch-initial-setup.md`

## Questions or Issues?

When uncertain about implementation details:
1. Check the design doc for architectural decisions
2. Check the implementation plan for step-by-step guidance
3. Check existing similar components for patterns
4. Verify against performance constraints (60fps, <300KB)
