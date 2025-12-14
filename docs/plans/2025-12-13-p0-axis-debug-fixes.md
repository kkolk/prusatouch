# P0 Fixes: Axis Controls and Debug Log Viewer

**Created:** 2025-12-13
**Priority:** P0 (Critical - Blocking development)
**Issues:** prusatouch-5wl, prusatouch-6fx

## Overview

Two critical issues blocking development and testing:
1. Axis controls in ControlView are failing with API errors
2. Need API debug log viewer to diagnose and track API integration issues

## Tasks

### Task 1: Debug and Fix Axis Control API Failures (prusatouch-5wl)

**Lines: 37-95**

**Problem:**
Movement controls (X/Y/Z axes) in ControlView show error messages like "Failed to move Z axis. Please try again."

**Investigation Steps:**
1. Read `src/views/ControlView.vue` to understand current implementation
2. Check what API calls are being made for movement
3. Test actual API endpoint manually or check browser console
4. Identify root cause (API endpoint issue, request format, auth, etc.)

**Implementation:**
1. Fix the API integration based on findings
2. Verify API calls use correct endpoints from OpenAPI spec
3. Ensure proper error handling with informative messages
4. Test on actual hardware if possible

**Verification:**
- [ ] Axis movement buttons make correct API calls
- [ ] Movement commands execute successfully on printer
- [ ] Error handling provides useful feedback
- [ ] No console errors during operation

**Files:**
- `src/views/ControlView.vue` (likely needs fixes)
- `src/stores/printer.ts` (may need movement methods)
- OpenAPI spec for reference

**Commit:** `fix: resolve axis control API failures in ControlView`

---

### Task 2: Implement API Debug Log Viewer (prusatouch-6fx)

**Lines: 97-195**

**Goal:**
Create a debug log viewer to display all API requests, responses, and errors for development troubleshooting.

**Requirements:**
1. **Log Storage:**
   - Create `src/stores/debugLog.ts` Pinia store
   - Store API requests/responses with timestamps
   - Limit to last 100 entries (LRU)
   - Include: timestamp, method, endpoint, status, error message

2. **API Interceptor:**
   - Add Axios interceptor in `src/api/client.ts` (or create if needed)
   - Log all requests before sending
   - Log all responses (success and error)
   - Store in debugLog store

3. **Debug View Component:**
   - Create `src/views/DebugView.vue`
   - Display log entries in reverse chronological order
   - Show: timestamp, HTTP method, endpoint, status code, error details
   - Color code: success (green), error (red), pending (yellow)
   - Include "Clear logs" button
   - Touch-optimized (60px touch targets)

4. **Router Integration:**
   - Add `/debug` route to router
   - Add navigation link from Settings or main nav

**Implementation Pattern:**
Follow existing store patterns from `src/stores/printer.ts`:
- Pinia store with typed state
- Composable for easy access
- Reactive updates to UI

**TDD Approach:**
1. Write tests for debugLog store (add, limit to 100, clear)
2. Implement store
3. Write tests for DebugView component
4. Implement component
5. Test interceptor manually (verify logs appear)

**Files to Create:**
- `src/stores/debugLog.ts`
- `src/views/DebugView.vue`
- `tests/unit/stores/debugLog.spec.ts`
- `tests/unit/views/DebugView.spec.ts`

**Files to Modify:**
- `src/api/client.ts` (add interceptor) - may need to create
- `src/router/index.ts` (add debug route)
- `src/App.vue` or navigation (add debug link)

**Verification:**
- [ ] All API requests logged to debugLog store
- [ ] DebugView displays logs in real-time
- [ ] Logs include all required information
- [ ] Clear button works
- [ ] LRU limit enforced (max 100 entries)
- [ ] Touch targets meet 60px standard
- [ ] Tests passing

**Commit:** `feat: add API debug log viewer for development`

---

## Success Criteria

1. Axis controls work correctly without errors
2. Debug log viewer accessible and functional
3. All API requests/errors visible in debug view
4. All tests passing
5. No TypeScript errors
6. Clean git commits with conventional format

## Dependencies

- Existing ControlView component
- Axios for HTTP interceptors
- Pinia for state management
- Vue Router for debug route

## Notes

- Debug viewer is development tool, can be hidden in production builds later
- Keep debug viewer simple and functional - polish later
- Focus on getting axis controls working first (blocking user testing)
