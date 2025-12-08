# PrusaTouch

Custom touch-optimized interface for PrusaLink, designed for Raspberry Pi 4 with HyperPixel 4 display (800x480).

## Deployment Status

✅ **Production Ready**

- ✅ 113+ unit tests passing
- ✅ 16+ E2E tests passing
- ✅ Bundle size: <300KB gzipped
- ✅ TypeScript: 0 errors
- ✅ Performance: 60fps animations
- ✅ Target: Raspberry Pi 4 (1GB RAM)

### Quick Deploy

```bash
# Verify production readiness
npm run verify:production

# Deploy to Raspberry Pi
./scripts/deploy-to-pi.sh prusa-mk3s.local

# Set up kiosk mode
./scripts/setup-kiosk.sh prusa-mk3s.local
```

See [docs/deployment.md](docs/deployment.md) for detailed instructions.

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run unit tests
npm run test:unit

# Run E2E tests
npm run test:e2e

# Build for production
npm run build

# Verify production readiness
npm run verify:production
```

## Tech Stack

- **Framework:** Vue 3 (Composition API)
- **Language:** TypeScript 5.x
- **Build Tool:** Vite 7.x
- **State:** Pinia
- **API:** Auto-generated from OpenAPI
- **Testing:** Vitest (unit), Playwright (E2E)

## Documentation

- [CLAUDE.md](CLAUDE.md) - AI development guidance
- [docs/deployment.md](docs/deployment.md) - Deployment guide
- [docs/plans/](docs/plans/) - Implementation plans

## License

ISC
