# P1 Tasks: Extruder Controls and File Selection Workflow

**Created:** 2025-12-13
**Priority:** P1 (High - Core functionality)
**Issues:** prusatouch-55z, prusatouch-ojf

## Overview

Complete core PrusaTouch functionality by wiring up extruder controls and implementing the file selection workflow.

## Lessons from Axis Control Bug

**CRITICAL:** Avoid the pattern that caused the axis control bug (prusatouch-1v5):
- NEVER use `any` type with API requests
- ALWAYS import proper types from `src/api/models/`
- CHECK for nested enums in auto-generated types (use IDE autocomplete)
- USE enum values like `ExtruderRequest.command.EXTRUDE`, not string literals

## Tasks

### Task 1: Wire up Extruder Controls to API (prusatouch-55z)

**Lines: 37-125**

**Goal:**
Connect the ExtruderControl component to the actual PrusaLink API and integrate it into the Control view.

**Current State:**
- `src/components/ExtruderControl.vue` exists with UI and safety lockout (<170°C)
- Component emits events but doesn't call API directly
- Not integrated into ControlView yet

**API Investigation:**
1. Check `spec/openapi.yaml` for extruder endpoints
2. Find proper types in `src/api/models/` (likely `ExtruderRequest` or similar)
3. Identify any nested enums (similar to `PrintheadMoveRequest.command.JOG`)
4. Document the correct API call pattern

**Implementation Steps:**

1. **Add Extruder Methods to printerStore** (`src/stores/printer.ts`):
   ```typescript
   import { ExtruderRequest } from '../api/models/ExtruderRequest' // Use proper type

   async function extrudeFilament(amount: number) {
     try {
       const { DefaultService } = await import('../api')
       const request: ExtruderRequest = {
         command: ExtruderRequest.command.EXTRUDE, // Use enum, not string!
         amount: amount
       }
       await DefaultService.controlExtruder(request)
       await fetchStatus() // Refresh status
     } catch (error) {
       console.error('Failed to extrude:', error)
       throw error
     }
   }

   async function retractFilament(amount: number) {
     // Similar pattern
   }

   async function setExtruderTemp(target: number) {
     // May already exist, verify
   }
   ```

2. **Update ExtruderControl Component** (`src/components/ExtruderControl.vue`):
   - Import `usePrinterStore` composable
   - Call store methods instead of just emitting events
   - Keep safety lockout (temp < 170°C)
   - Add loading states during API calls
   - Show success/error feedback

3. **Integrate into ControlView** (`src/views/ControlView.vue`):
   - Import ExtruderControl component
   - Add it below the DirectionalPad
   - Pass current nozzle temperature for safety lockout
   - Layout: Movement panel on left, Extruder panel on right

4. **Add Tests**:
   - Update `tests/unit/stores/printer.spec.ts` with extruder method tests
   - Update `tests/unit/components/ExtruderControl.spec.ts` to test API integration
   - Verify safety lockout prevents API calls when temp < 170°C

**Verification:**
- [ ] Extruder controls call correct API with proper types/enums
- [ ] Safety lockout prevents extrude/retract when temp < 170°C
- [ ] Loading states shown during API operations
- [ ] Error handling provides useful feedback
- [ ] Tests passing
- [ ] No TypeScript errors
- [ ] ExtruderControl visible in ControlView

**Files to Modify:**
- `src/stores/printer.ts` (add extruder methods)
- `src/components/ExtruderControl.vue` (wire up API calls)
- `src/views/ControlView.vue` (integrate component)
- `tests/unit/stores/printer.spec.ts` (add tests)
- `tests/unit/components/ExtruderControl.spec.ts` (update tests)

**Commit:** `feat: wire up extruder controls to PrusaLink API`

---

### Task 2: Implement File Selection and Start Print Workflow (prusatouch-ojf)

**Lines: 127-245**

**Goal:**
Implement complete workflow: browse files → select file → confirm → start print.

**Current State:**
- `src/components/FileBrowser.vue` displays files but doesn't handle selection
- `src/components/FileListItem.vue` exists but may need click handling
- No "start print" workflow yet

**User Flow:**
1. User clicks "Print" button on HomeView
2. FileBrowser overlay opens showing available files
3. User taps a .gcode file
4. Confirmation dialog shows: "Start printing [filename]?" with print preview if available
5. User confirms → Print job starts
6. FileBrowser closes, HomeView shows active print

**Implementation Steps:**

1. **Add File Selection to FileBrowser** (`src/components/FileBrowser.vue`):
   ```typescript
   const emit = defineEmits<{
     close: []
     selectFile: [file: FileInfo]
   }>()

   function handleFileClick(file: FileInfo) {
     if (file.type === 'FILE' && file.name.endsWith('.gcode')) {
       emit('selectFile', file)
     }
   }
   ```

2. **Create StartPrintConfirmation Component** (`src/components/StartPrintConfirmation.vue`):
   - Bottom sheet overlay (similar to ExtruderControl pattern)
   - Shows: filename, estimated time (if available), thumbnail preview
   - Buttons: "Cancel" (secondary), "Start Print" (primary, large)
   - Touch-optimized (60px buttons)
   - TDD: Write tests first

3. **Add Start Print Method to jobStore** (`src/stores/job.ts`):
   ```typescript
   import { JobRequest } from '../api/models/JobRequest' // Use proper type

   async function startPrint(filePath: string) {
     try {
       const { DefaultService } = await import('../api')
       const request: JobRequest = {
         command: JobRequest.command.START, // Use enum!
         path: filePath
       }
       await DefaultService.startJob(request)
       // Poll for updated job status
       await fetchJob()
     } catch (error) {
       console.error('Failed to start print:', error)
       throw error
     }
   }
   ```

4. **Wire Up Workflow in HomeView** (`src/views/HomeView.vue`):
   ```vue
   <script setup>
   import FileBrowser from '../components/FileBrowser.vue'
   import StartPrintConfirmation from '../components/StartPrintConfirmation.vue'

   const showFileBrowser = ref(false)
   const showConfirmation = ref(false)
   const selectedFile = ref<FileInfo | null>(null)

   function handleFileSelect(file: FileInfo) {
     selectedFile.value = file
     showFileBrowser.value = false
     showConfirmation.value = true
   }

   async function handleConfirmStart() {
     if (!selectedFile.value) return
     try {
       await jobStore.startPrint(selectedFile.value.path)
       showConfirmation.value = false
       selectedFile.value = null
       // Show success message
     } catch (error) {
       // Show error message
     }
   }
   </script>
   ```

5. **Add Tests**:
   - Create `tests/unit/components/StartPrintConfirmation.spec.ts`
   - Update `tests/unit/views/HomeView.spec.ts` for workflow
   - Update `tests/unit/stores/job.spec.ts` for startPrint method
   - Test full flow: select → confirm → start

**Verification:**
- [ ] FileBrowser emits selectFile event on .gcode click
- [ ] StartPrintConfirmation displays file info correctly
- [ ] jobStore.startPrint uses proper types/enums
- [ ] Print starts successfully on confirmation
- [ ] Error handling shows user-friendly messages
- [ ] Workflow completes: browse → select → confirm → start
- [ ] Tests passing (15+ new tests expected)
- [ ] No TypeScript errors
- [ ] Touch targets meet 60px standard

**Files to Create:**
- `src/components/StartPrintConfirmation.vue`
- `tests/unit/components/StartPrintConfirmation.spec.ts`

**Files to Modify:**
- `src/components/FileBrowser.vue` (add selection handling)
- `src/stores/job.ts` (add startPrint method)
- `src/views/HomeView.vue` (wire up workflow)
- `tests/unit/components/FileBrowser.spec.ts` (test selection)
- `tests/unit/stores/job.spec.ts` (test startPrint)
- `tests/unit/views/HomeView.spec.ts` (test workflow)

**Commit:** `feat: implement file selection and start print workflow`

---

## Success Criteria

1. Extruder controls fully functional with proper API integration
2. File selection workflow complete: browse → select → confirm → start
3. All API calls use proper types and enums (no `any`, no string literals)
4. Safety features working (temp lockout, confirmations)
5. All tests passing (expect 220+ total tests)
6. No TypeScript errors
7. Bundle size still under 300KB target
8. Clean commits with conventional format

## Dependencies

- OpenAPI spec and auto-generated types
- Existing components: FileBrowser, ExtruderControl, FileListItem
- Existing stores: printer, job, files
- Pattern established by axis control fix

## Notes

- **Critical:** Use proper enum values everywhere (learned from prusatouch-1v5)
- Test on actual hardware after implementation
- Debug log viewer (`/debug`) will be useful for testing
- Keep touch targets at 60px minimum for good UX
