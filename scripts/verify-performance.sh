#!/bin/bash
set -e

echo "🔍 Performance Verification for PrusaTouch"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Build production bundle
echo "📦 Building production bundle..."
npm run build

# Check if dist exists
if [ ! -d "dist" ]; then
  echo -e "${RED}❌ Build failed - dist directory not found${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Build successful${NC}"
echo ""

# Analyze bundle size
echo "📊 Bundle Size Analysis:"
echo "------------------------"

# Find main JS bundle (largest .js file)
MAIN_BUNDLE=$(ls -S dist/assets/*.js | head -1)
BUNDLE_SIZE=$(stat -f%z "$MAIN_BUNDLE" 2>/dev/null || stat -c%s "$MAIN_BUNDLE")
BUNDLE_SIZE_KB=$((BUNDLE_SIZE / 1024))

# Check gzipped size
gzip -c "$MAIN_BUNDLE" > /tmp/bundle.js.gz
GZIP_SIZE=$(stat -f%z /tmp/bundle.js.gz 2>/dev/null || stat -c%s /tmp/bundle.js.gz)
GZIP_SIZE_KB=$((GZIP_SIZE / 1024))
rm /tmp/bundle.js.gz

echo "Main bundle: ${BUNDLE_SIZE_KB}KB (${GZIP_SIZE_KB}KB gzipped)"

# Target: <300KB gzipped
if [ $GZIP_SIZE_KB -lt 300 ]; then
  echo -e "${GREEN}✓ Bundle size within target (<300KB gzipped)${NC}"
else
  echo -e "${RED}❌ Bundle size exceeds target: ${GZIP_SIZE_KB}KB > 300KB${NC}"
  exit 1
fi

echo ""

# Check for lazy-loaded chunks
echo "🔀 Code Splitting Verification:"
echo "--------------------------------"
CHUNK_COUNT=$(ls dist/assets/*.js | wc -l | tr -d ' ')
echo "Total JS chunks: $CHUNK_COUNT"

if [ $CHUNK_COUNT -gt 1 ]; then
  echo -e "${GREEN}✓ Code splitting enabled (lazy loading working)${NC}"
else
  echo -e "${YELLOW}⚠ No code splitting detected${NC}"
fi

echo ""

# List all chunks with sizes
echo "📄 All chunks:"
ls -lh dist/assets/*.js | awk '{print "  " $9 " - " $5}'

echo ""

# CSS size
echo "🎨 CSS Bundle:"
echo "--------------"
CSS_FILES=$(ls dist/assets/*.css 2>/dev/null || echo "")
if [ -n "$CSS_FILES" ]; then
  CSS_SIZE=$(cat dist/assets/*.css | wc -c | tr -d ' ')
  CSS_SIZE_KB=$((CSS_SIZE / 1024))
  echo "Total CSS: ${CSS_SIZE_KB}KB"

  if [ $CSS_SIZE_KB -lt 50 ]; then
    echo -e "${GREEN}✓ CSS size acceptable${NC}"
  else
    echo -e "${YELLOW}⚠ CSS larger than expected: ${CSS_SIZE_KB}KB${NC}"
  fi
else
  echo "No CSS files found"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Performance verification complete${NC}"
echo ""
echo "Summary:"
echo "  • Main bundle: ${GZIP_SIZE_KB}KB gzipped (target: <300KB)"
echo "  • Code splitting: $CHUNK_COUNT chunks"
echo "  • Ready for Raspberry Pi deployment"
