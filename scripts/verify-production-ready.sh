#!/bin/bash
set -e

echo "✅ PrusaTouch Production Readiness Verification"
echo "================================================"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

FAILURES=0

# Function to run check
run_check() {
  local name=$1
  local command=$2

  echo "🔍 $name..."
  if eval $command > /tmp/check.log 2>&1; then
    echo -e "${GREEN}✓ $name passed${NC}"
  else
    echo -e "${RED}✗ $name failed${NC}"
    cat /tmp/check.log
    FAILURES=$((FAILURES + 1))
  fi
  echo ""
}

# 1. Unit Tests
run_check "Unit tests" "npm run test:unit"

# 2. E2E Tests
run_check "E2E tests" "npm run test:e2e"

# 3. TypeScript type check
run_check "TypeScript type check" "npx vue-tsc --noEmit"

# 4. Build
run_check "Production build" "npm run build"

# 5. Performance verification
run_check "Performance targets" "./scripts/verify-performance.sh"

# Summary
echo "================================================"
if [ $FAILURES -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed! Production ready.${NC}"
  echo ""
  echo "Ready to deploy:"
  echo "  ./scripts/deploy-to-pi.sh prusa-mk3s.local"
  echo "  ./scripts/setup-kiosk.sh prusa-mk3s.local"
  exit 0
else
  echo -e "${RED}❌ $FAILURES check(s) failed${NC}"
  echo "Fix issues before deploying to production"
  exit 1
fi
