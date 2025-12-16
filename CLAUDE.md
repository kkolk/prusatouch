# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PrusaTouch** is a custom touch-optimized interface for PrusaLink, designed for Raspberry Pi 4 (1GB RAM) with HyperPixel 4 display (800x480). This is a showcase AI development project demonstrating modern web practices within hardware constraints.

**Design Philosophy:** Performance-first, touch-optimized, 60fps animations, <300KB bundle size, GPU-accelerated rendering only.

## Tech Stack

- **Framework:** Vue 3 (Composition API) - Lower memory footprint than React
- **Language:** TypeScript 5.x - Type safety from auto-generated OpenAPI client
- **Build Tool:** Vite 7.x - Fast builds, optimized dev server
- **Node.js:** 24.x LTS (Krypton) via nvm
- **State:** Pinia - Official Vue state management
- **API:** Auto-generated from OpenAPI spec via `openapi-typescript-codegen`
- **HTTP:** Axios with retry logic
- **Testing:** Vitest (unit), Playwright (E2E)
- **Styling:** Custom CSS with CSS Variables (no frameworks)

## Node.js Environment Setup

**Node.js:** 24.x LTS (Krypton) via nvm - Already configured and available globally.

**IMPORTANT:** Use `just` commands instead of direct npm/bash commands (see Task Runner section below).

## Task Runner: Just (CRITICAL - Use This!)

**IMPORTANT:** This project uses `just` as a task runner to save context and tokens in AI sessions.

**Why Just?**
- **Context Saving:** Encapsulates complex commands into simple recipes
- **Token Efficiency:** No need to explain long bash commands or npm scripts repeatedly
- **Knowledge Persistence:** Common paths, configurations, and workflows are baked in
- **Faster Development:** One command does everything (build, test, deploy, etc.)

**Core Principle:** Instead of writing or explaining commands, use `just <recipe>`.

### Quick Reference

View all available recipes:
```bash
just          # or: just --list
```

### Most Used Commands (Use These!)

**API & Type Checking:**
```bash
just api              # Regenerate API client from OpenAPI spec
just api-update       # Regenerate API + typecheck + test
just typecheck        # Run TypeScript type checking
just check            # Quick validation (typecheck + lint)
just ready            # Pre-commit check (typecheck + test + lint)
```

**Testing:**
```bash
just test             # Run unit tests (fastest)
just test-watch       # Run tests in watch mode
just test-e2e         # Run E2E tests
just ci               # Full CI validation (typecheck + test + build)
```

**Development:**
```bash
just dev              # Start dev server
just build            # Production build
just bundle-size      # Check bundle size vs 300KB target
just verify           # Full verification (typecheck + test + build + size)
```

**Code Discovery:**
```bash
just find "pattern"   # Search for pattern in source files
just todos            # Find all TODOs/FIXMEs
just stores           # List all Pinia stores
just components       # List all components
just recent           # Recently modified files (last 7 days)
```

**Deployment:**
```bash
just deploy           # Build and deploy to Pi
just deploy:full      # Build + deploy + restart services
just pi-status        # Check Pi service status
just pi-logs          # View Pi logs
just pi-restart       # Restart auth-helper service
```

**Git Workflows:**
```bash
just status           # Enhanced git status with counts
just commit feat "add new feature"  # Conventional commit
just save "quick fix" # Quick commit
just sync             # Pull rebase + push
```


### For AI Agents: Command Translation

**Old way (verbose):**
```bash
# AI has to explain: "I'll regenerate the API client"
npm run generate:api
# AI has to explain: "Now I'll run TypeScript type checking"
npx vue-tsc --noEmit
# AI has to explain: "Let me run the tests"
npm run test:unit
```

**New way (concise):**
```bash
just api-update
```

**Context saved:** ~100+ tokens per command sequence!

### Recipe Categories

Run `just --list` to see all recipes organized by:
- Quick Info & Status
- API Generation
- Type Checking & Linting
- Testing
- Development Server
- Build & Bundle
- Code Search & Discovery
- Deployment
- Raspberry Pi Remote Operations
- Kiosk Management
- Git Workflows
- Performance & Profiling
- Verification Commands

### When to Use Just

✅ **ALWAYS use just for:**
- API regeneration (`just api` not `npm run generate:api`)
- Type checking (`just typecheck` not `npx vue-tsc --noEmit`)
- Testing (`just test` not `npm run test:unit`)
- Deployment (`just deploy` not `./scripts/deploy-to-pi.sh`)
- Code search (`just find "pattern"` not `grep -rn...`)
- Git operations (`just commit feat "msg"` not manual git commands)

❌ **Don't use bash commands when just recipes exist:**
- ❌ `ssh pi@host "systemctl status..."`
- ✅ `just pi-status`

❌ **Don't explain commands when you can use just:**
- ❌ "I'll run npm run generate:api to regenerate the API client, then npx vue-tsc --noEmit to check types..."
- ✅ "Running `just api-update`"

### Adding New Recipes

If you find yourself explaining the same command multiple times, add it to `justfile`:

```just
# Quick description
recipe-name:
  command here
```

Then commit it so future sessions benefit!

## BD Issue Tracker

**BD (beads)** is a lightweight issue tracker with first-class dependency support, used for task management in this project.

### Quick Reference

**List issues:**
```bash
bd list                    # All issues
bd list --status open      # Open issues only
bd list --priority 1       # P1 issues
bd ready                   # Ready to work (no blockers)
```

**Create issues:**
```bash
bd create "Issue title"    # Simple creation
bd create "Title" \
  --priority 1 \
  --type bug \
  --labels "api,p1" \
  --description "Details here"
```

**View and update:**
```bash
bd show prusatouch-abc     # Show issue details
bd update prusatouch-abc --status closed
bd update prusatouch-abc --priority 2
```

**Comments:**
```bash
bd comment prusatouch-abc "Adding a comment"
bd comments prusatouch-abc  # View all comments
```

### Why BD?

- **Context-aware:** Issues are stored in `.beads/` and versioned with git
- **Dependencies:** Track blockers and relationships between issues
- **Lightweight:** No external services, works offline
- **AI-friendly:** Structured data, easy for agents to read/write

### Using BD with Code Review

When code reviewers find issues, they should use bd to track them:

```bash
# Create issue for code review finding
bd create "Type assertion in printer.ts line 81" \
  --priority 1 \
  --type bug \
  --labels "code-review,type-safety"
```

This creates a permanent record that can be referenced in commits and PRs.

### BD + Just Workflow

**Don't wrap bd in just** - bd is already optimized. Use bd commands directly:

```bash
# Good
bd list --status open

# Unnecessary
just bd-list  # Don't create wrappers
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
2. Run `just api`
3. Commit both the spec and generated files

### Authentication Architecture (Updated 2025-12-13)

**Kiosk Mode:** Authentication is handled server-side to prevent browser popups.

**Service Stack:**
```
Browser (no auth) → auth-helper:8080 → PrusaLink:80
```

**Auth Helper:** Node.js service that serves the SPA and transparently handles HTTP Digest authentication with PrusaLink. Credentials are stored in systemd service environment variables (not in browser bundle).

**Browser Side:**
- Makes simple HTTP requests to `/api/v1/*` (no auth credentials)
- Auth-helper serves static SPA files from `/opt/prusatouch/dist`
- Auth-helper proxies API requests to PrusaLink with digest auth
- Browser never sees authentication popups

**See:** `docs/deployment.md` for full architecture documentation and troubleshooting.

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

**Implementation Plans:**
- `docs/plans/2024-12-04-prusatouch-initial-setup.md` - Tasks 1-7 (Foundation)
- `docs/plans/2025-12-05-core-components-phase2.md` - Tasks 8-12 (Components)

**Progress tracking via git tags:**
```bash
git tag --list 'checkpoint-*'     # List all checkpoints
git show checkpoint-task-N        # View checkpoint details
```

**Implementation phases:**
- [x] Phase 1: Project setup + API + Stores (Tasks 1-7) ✅ COMPLETE
- [ ] Phase 2: Core components (Tasks 8-12) - IN PROGRESS
- [ ] Phase 3: Composables (Tasks 13-17)
- [ ] Phase 4: Views + Router (Tasks 18-25)
- [ ] Phase 5: Testing + Deployment (Tasks 26-32)

**Completed Components:**
- TouchButton (Task 7) - Primary/secondary/danger variants, loading states
- Printer Store - Adaptive polling, connection handling
- Job Store - Print control actions, job history
- Files Store - LRU thumbnail cache, file browser

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
just bundle-size
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
just deploy
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
3. Run `just api-update` (regenerates API + typechecks + tests)
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

**Full design specification:** `../prusatouch-design-doc.md` (parent directory)
**Implementation plans:**
- `docs/plans/2024-12-04-prusatouch-initial-setup.md` - Foundation (Tasks 1-7)
- `docs/plans/2025-12-05-core-components-phase2.md` - Components (Tasks 8-12)
**Deployment Guide:** `docs/deployment.md`
## Questions or Issues?

When uncertain about implementation details:
1. Check the design doc for architectural decisions
2. Check the implementation plan for step-by-step guidance
3. Check existing similar components for patterns
4. Verify against performance constraints (60fps, <300KB)
Use the bd tool instead of markdown for all new work, it's great
