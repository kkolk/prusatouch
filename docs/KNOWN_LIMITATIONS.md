# Known Limitations

This document tracks known limitations and missing features in PrusaTouch.

## Layer Information Not Available

**Status:** Documented Limitation
**Affected:** Home view during active print job
**Impact:** Layer progress (e.g., "Layer 15/120") is not displayed

### Background

The PrusaLink API does not expose layer information through its standard REST endpoints. Layer data would require one of the following approaches:

1. **GCODE Comment Parsing:** Parse GCODE file comments (`;LAYER:X` annotations added by slicers)
   - Requires uploading/caching GCODE files client-side
   - Adds significant complexity and memory overhead
   - May not work for all slicer configurations

2. **Extended Telemetry:** Use PrusaLink's extended telemetry features (if available)
   - May require WebSocket connection
   - Not documented in standard API
   - Version-dependent availability

3. **Custom Backend Service:** Implement server-side GCODE analysis
   - Adds deployment complexity
   - Requires persistent storage
   - Outside scope of lightweight kiosk interface

### Current Behavior

- Layer information section is hidden when data is unavailable (currentLayer = 0, totalLayers = 0)
- Print progress percentage and time remaining are still displayed (these come from PrusaLink)
- Print speed percentage is displayed

### Future Enhancement

If PrusaLink adds layer information to the `/api/v1/job` or `/api/v1/status` endpoints, the integration would be straightforward:

1. Update OpenAPI spec to include layer fields
2. Regenerate API client: `npm run generate:api`
3. Update `src/stores/job.ts` getters to read from API response
4. UI will automatically display layer info (conditional rendering already in place)

### Related Files

- `src/stores/job.ts` - Lines 40-56 (currentLayer and totalLayers getters)
- `src/views/HomeView.vue` - Lines 52-55 (conditional layer info display)
- `docs/KNOWN_LIMITATIONS.md` - This file

### Workaround

None available without significant architectural changes. Users can still monitor print progress via percentage complete and time remaining.

---

**Last Updated:** 2025-12-13
**Related Task:** prusatouch-vz7
