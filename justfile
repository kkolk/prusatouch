# PrusaTouch Justfile - Context-Saving Task Runner
# This file encapsulates common workflows to save tokens and context in AI sessions.
# Instead of explaining complex commands, just use: `just <recipe>`

set shell := ["bash", "-euxo", "pipefail", "-c"]

# Project metadata
project_name := "PrusaTouch"
pi_host := env_var_or_default('PI_HOST', 'octopi.local.frostbyte.us')
pi_user := env_var_or_default('PI_USER', 'kkolk')

#
# Default: Show available recipes
#
default:
  @just --list

#
# Quick Info & Status
#
info:
  @echo "Project: {{project_name}}"
  @echo "Node:   $(node --version)"
  @echo "NPM:    $(npm --version)"
  @echo "PWD:    $PWD"
  @echo "Pi:     {{pi_user}}@{{pi_host}}"

# Git status with file counts
status:
  @git status --short
  @echo "---"
  @echo "Modified: $(git status --short | grep -c '^ M' || echo 0)"
  @echo "Untracked: $(git status --short | grep -c '^??' || echo 0)"

# Show current branch and recent commits
log:
  @git log --oneline --graph --decorate -10

# Show git diff
diff:
  @git diff

#
# Dependencies & Setup
#
deps:
  npm ci

#
# API Generation (Critical for PrusaTouch)
#
# Regenerate TypeScript API client from OpenAPI spec
api:
  @echo "Regenerating API client from spec/openapi.yaml..."
  npm run generate:api
  @echo "✓ API client regenerated"

# Update API and run quick validation
api-update:
  just api
  just typecheck
  just test

#
# Type Checking & Linting
#
# TypeScript type checking without emit
typecheck:
  @echo "Type checking..."
  npx vue-tsc --noEmit

# ESLint
lint:
  npm run lint

# Quick validation (typecheck + lint)
check:
  just typecheck
  just lint

# Full pre-commit check (typecheck + test + lint)
ready:
  @echo "Running pre-commit checks..."
  just typecheck
  just test
  just lint
  @echo "✓ Ready to commit!"

#
# Testing
#
# Run unit tests (fastest feedback)
test:
  npm run test:unit

# Run specific test file
test-file path:
  npm run test:unit {{path}}

# Run tests in watch mode
test-watch:
  npm run test:unit -- --watch

# Run E2E tests
test-e2e:
  npm run test:e2e

# Run full test suite
test-all:
  just test
  just test-e2e

# Run CI validation (typecheck + test + build)
ci:
  @echo "Running CI validation..."
  just typecheck
  just test
  just build
  @echo "✓ CI passed!"

#
# Development Server
#
dev:
  npm run dev

# Start dev server in background
dev-bg:
  npm run dev &

#
# Build & Bundle
#
build:
  npm run build

# Build and show bundle size
build-size:
  npm run build
  @echo "---"
  @echo "Bundle sizes:"
  @ls -lh dist/assets/*.js | awk '{print $5 "\t" $9}'

# Check bundle size (target: <300KB gzipped)
bundle-size:
  @echo "Checking bundle size (target: <300KB gzipped)..."
  @npm run build > /dev/null 2>&1
  @du -sh dist/assets/*.js
  @gzip -c dist/assets/index-*.js | wc -c | awk '{printf "Gzipped: %.1f KB\n", $1/1024}'

#
# Code Search & Discovery
#
# Search for pattern in source files
find pattern:
  @grep -rn --include="*.ts" --include="*.vue" --include="*.js" "{{pattern}}" src/ | head -50

# Find TODOs, FIXMEs, and HACKs
todos:
  @grep -rn --include="*.ts" --include="*.vue" --include="*.js" -E "(TODO|FIXME|XXX|HACK):" src/ tests/ | head -30

# Find files modified today
today:
  @find src/ tests/ -type f \( -name "*.ts" -o -name "*.vue" -o -name "*.js" \) -mtime 0

# Find files modified in last N days
recent n="7":
  @find src/ tests/ -type f \( -name "*.ts" -o -name "*.vue" -o -name "*.js" \) -mtime -{{n}} -exec ls -lt {} + | head -20

# List all Pinia stores
stores:
  @ls -1 src/stores/*.ts

# List all components
components:
  @find src/components -name "*.vue" | sort

# List all views
views:
  @find src/views -name "*.vue" | sort

# Show OpenAPI spec stats
api-stats:
  @echo "OpenAPI Spec Statistics:"
  @echo "Paths: $(grep -c '  /api' spec/openapi.yaml)"
  @echo "Schemas: $(grep -c '^  [A-Z].*:$' spec/openapi.yaml | head -1)"
  @echo "Total lines: $(wc -l < spec/openapi.yaml)"

#
# Deployment to Raspberry Pi
#
# Deploy to Pi (build + upload)
deploy:
  @echo "Deploying to {{pi_user}}@{{pi_host}}..."
  npm run build
  ./scripts/deploy-to-pi.sh

# Deploy auth-helper only
deploy-auth:
  ./scripts/deploy-auth-helper.sh

# Full deploy (build + upload + restart services)
deploy-full:
  just build
  just deploy
  just pi-restart

#
# Raspberry Pi Remote Operations
#
# Check Pi service status
pi-status:
  ssh {{pi_user}}@{{pi_host}} "systemctl status prusatouch-auth.service --no-pager"

# Restart auth-helper service on Pi
pi-restart:
  ssh {{pi_user}}@{{pi_host}} "sudo systemctl restart prusatouch-auth.service"

# View Pi logs
pi-logs:
  ssh {{pi_user}}@{{pi_host}} "journalctl -u prusatouch-auth.service -n 50 --no-pager"

# Tail Pi logs (follow)
pi-tail:
  ssh {{pi_user}}@{{pi_host}} "journalctl -u prusatouch-auth.service -f"

# Check Pi disk space
pi-disk:
  ssh {{pi_user}}@{{pi_host}} "df -h /opt/prusatouch"

# SSH into Pi
pi-ssh:
  ssh {{pi_user}}@{{pi_host}}

# Check if Pi is reachable
pi-ping:
  ping -c 3 {{pi_host}}

#
# Kiosk Management
#
kiosk-start:
  ssh {{pi_user}}@{{pi_host}} "sudo systemctl start prusatouch-kiosk.service"

kiosk-stop:
  ssh {{pi_user}}@{{pi_host}} "sudo systemctl stop prusatouch-kiosk.service"

kiosk-status:
  ssh {{pi_user}}@{{pi_host}} "systemctl status prusatouch-kiosk.service --no-pager"

#
# Git Workflows
#
# Stage all changes
stage:
  git add .

# Conventional commit helper (feat/fix/docs/etc)
commit type msg:
  git add .
  git commit -m "{{type}}: {{msg}}"

# Quick commit with message (auto-detects type)
save msg:
  git add .
  git commit -m "{{msg}}"

# Sync with remote
sync:
  git pull --rebase
  git push

#
# Database & Storage
#
# Show storage stats for local development
storage:
  @echo "dist/: $(du -sh dist 2>/dev/null | cut -f1 || echo 'not built')"
  @echo "node_modules/: $(du -sh node_modules 2>/dev/null | cut -f1 || echo 'not installed')"
  @echo ".git/: $(du -sh .git | cut -f1)"

#
# Cleanup
#
clean:
  rm -rf dist/

clean-all:
  rm -rf dist/ node_modules/

clean-cache:
  rm -rf node_modules/.vite/

#
#
# Documentation Helpers
#
# Show component documentation
docs-component name:
  @echo "Component: {{name}}"
  @grep -A 20 "export default" src/components/{{name}}.vue || echo "Not found"

# Count lines of code
loc:
  @echo "TypeScript/Vue:"
  @find src -name "*.ts" -o -name "*.vue" | xargs wc -l | tail -1
  @echo "Tests:"
  @find tests -name "*.ts" -o -name "*.spec.ts" | xargs wc -l | tail -1

#
# Performance & Profiling
#
# Profile build time
profile-build:
  time npm run build

# Profile test time
profile-test:
  time npm run test:unit

#
# Verification Commands (for AI agents)
#
# Verify everything works (full validation)
verify:
  @echo "=== Full Verification ==="
  just typecheck
  just test
  just build
  just bundle-size
  @echo "✓ All verifications passed!"

# Quick sanity check (fast validation)
sanity:
  just typecheck
  just test
  @echo "✓ Sanity check passed!"
