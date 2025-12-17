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

## Task Runner: Just

**CRITICAL:** Use `just` commands instead of npm/bash commands to save tokens.

**View all commands:** `just --list`

**Most used:**
- `just api-update` - Regenerate API + typecheck + test
- `just test` / `just test-e2e` - Run tests
- `just dev` / `just build` - Development/production
- `just deploy` - Build and deploy to Pi
- `just find "pattern"` - Search codebase
- `just pi-status` / `just pi-logs` - Check Pi status

**Core principle:** Use `just <recipe>` instead of explaining long command sequences.

## BD Issue Tracker

**BD (beads)** is the issue tracker for this project. Issues are stored in `.beads/` and versioned with git.

**Common commands:**
- `bd list` / `bd ready` - View issues
- `bd show prusatouch-xxx` - View details
- `bd create "Title" --priority 1 --type bug --labels "label1,label2"` - Create issue
- `bd --help` - Full command reference

**Code review workflow:** When reviewers find issues, use `bd create` to track them permanently.

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

### Core Stores

- **printerStore** - Printer status polling (2s printing, 5s idle)
- **jobStore** - Print job control and history
- **filesStore** - File browser with LRU thumbnail cache

### API Client

**CRITICAL:** `src/api/` is auto-generated. Never edit directly.

**To update API:**
1. Edit `spec/openapi.yaml`
2. Run `just api-update`
3. Commit spec + generated files together

### Authentication

**Kiosk Mode:** Server-side auth via auth-helper (Node.js proxy at :8080) handles HTTP Digest with PrusaLink. Browser makes unauthenticated requests to `/api/v1/*`.

**See:** `docs/deployment.md` for details.

### Performance Constraints

**CRITICAL GPU Animation Rule:**

Only animate `transform` and `opacity`. NEVER animate width, height, margin, padding, color, background, or position properties.

**Why:** Pi 4's VideoCore VI GPU handles transform/opacity natively. Other properties trigger CPU layout/paint and kill performance.

### Polling Strategy

- Printing: 2000ms interval
- Idle: 5000ms interval
- Offline: Stop polling, retry every 5s

### Error Handling

**HTTP Status:**
- 401: Show auth modal
- 404: Refresh file list
- 409: Show "Printer busy" toast
- 503: Show "PrusaLink updating" banner (non-fatal for movement commands)

## Design System

**Variables:** All colors, spacing, timing in `src/styles/variables.css`

**Touch targets:**
- Minimum: 44x44px
- Comfortable: 60px (default)
- Large: 80px (primary actions)

**Prusa aesthetic:** Orange accent (#FF6600), dark theme, high contrast

## Testing

**TDD Workflow:** Test → Fail → Implement → Pass → Commit

**Store testing:** Use `setActivePinia(createPinia())` in `beforeEach`

**E2E critical flows:** File selection → start print, pause/resume, stop with confirmation

## Performance Targets

- **Bundle:** <300KB gzipped (`just bundle-size`)
- **Memory:** <400MB RAM on Pi 4
- **FPS:** 60fps animations (GPU-only)

**Strategies:**
- Tree-shaking via Vite
- Code splitting for Settings/Files views
- LRU caching (thumbnails: max 50)
- Virtual scrolling (file lists >50 items)

## Common Pitfalls

**DO NOT:**
- ❌ Edit `src/api/` directly (auto-generated)
- ❌ Animate anything except `transform` and `opacity`
- ❌ Add component libraries (breaks bundle size)
- ❌ Poll faster than 2s (overloads Pi CPU)

**DO:**
- ✅ Use `just` commands not npm/bash
- ✅ Use CSS variables for all colors/spacing
- ✅ Clean up intervals/timers in `onUnmounted`
- ✅ Use `bd` for issue tracking
- ✅ Follow TDD workflow

## Development Workflow

1. Check `bd ready` for available tasks
2. Create feature branch
3. Write test → implement → verify
4. Run `just ready` before commit
5. Conventional commits: `feat:`, `fix:`, `test:`, `refactor:`, `docs:`

## Reference Documentation

- **Design spec:** `../prusatouch-design-doc.md`
- **Implementation plans:** `docs/plans/`
- **Deployment:** `docs/deployment.md`
- **Active issues:** `bd list`
