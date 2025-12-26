# OpenAPI Specification Maintenance Guide

This directory contains the OpenAPI specification for the PrusaLink API used by PrusaTouch.

## Critical Structure Requirements

### FLAT Command Structure (Not Nested!)

**CORRECT:** Flat structure matching Prusa-Link-Web implementation
```json
{
  "command": "jog",
  "z": 1
}
```

**INCORRECT:** Nested structure (this won't work with real PrusaLink!)
```json
{
  "jog": {
    "command": "jog",
    "z": 1
  }
}
```

**Why this matters:**
- The OpenAPI generator will create incorrect types if the spec uses nested structures
- Commands will appear to succeed (204 No Content) but won't actually execute
- Prusa-Link-Web source code confirms the flat structure is correct

**Affected endpoints:**
- `/api/printer/printhead` (POST) - Jog/home commands
- `/api/printer/tool` (POST) - Temperature, extrude/retract commands
- `/api/printer/bed` (POST) - Temperature commands

### API Path Prefixes

**Two prefix patterns in PrusaLink:**

1. **`/api/v1/`** - Versioned API endpoints
   - `/api/v1/status`
   - `/api/v1/job`
   - `/api/v1/storage`
   - etc.

2. **`/api/`** - Files, settings, and legacy endpoints (unversioned)
   - `/api/files/{storage}/{path}` - **File operations (CRUD)**
   - `/api/version`
   - `/api/settings`
   - `/api/logs`
   - `/api/connection`
   - `/api/printer/printhead`
   - `/api/printer/tool`
   - `/api/printer/bed`

**Note:** PrusaLink 0.8.x uses `/api/files` (not `/api/v1/files`) for file operations.</think><tool_call>TodoWrite<arg_key>todos</arg_key><arg_value>[{"activeForm": "Investigating current image loading issue", "content": "Investigate current image loading issue", "status": "completed"}, {"activeForm": "Identifying root cause of image failure", "content": "Identify root cause of image failure", "status": "completed"}, {"activeForm": "Fixing OpenAPI spec - files endpoint should be /api/files not /api/v1/files", "content": "Fix OpenAPI spec - files endpoint should be /api/files not /api/v1/files", "status": "completed"}, {"activeForm": "Regenerating API client with correct endpoint", "content": "Regenerate API client with correct endpoint", "status": "in_progress"}, {"activeForm": "Verifying images display correctly", "content": "Verify images display correctly", "status": "pending"}]

**Important:** Do not change `/api/` endpoints to `/api/v1/` - this is intentional and matches the real PrusaLink API.

## Maintenance Workflow

### Updating the Spec

1. **Before editing** `spec/openapi.yaml`:
   - Verify endpoint paths and structures in Prusa-Link-Web source code
   - Check existing API client usage in `src/stores/` and `src/composables/`

2. **After editing** `spec/openapi.yaml`:
   ```bash
   just api-update
   ```
   This will:
   - Regenerate API client in `src/api/`
   - Run TypeScript type checking
   - Run all tests

3. **Commit together**:
   - Always commit spec changes and generated API client together
   - Example: `git add spec/openapi.yaml src/api/ && git commit`

### Adding New Endpoints

1. Research endpoint in Prusa-Link-Web source code
2. Document in spec with correct structure (flat not nested!)
3. Add examples and descriptions
4. Run `just api-update` to regenerate client
5. Test the endpoint manually or with automated tests
6. Update CLAUDE.md if new patterns are introduced

## Common Pitfalls

### 1. Nested Command Structures
- **Problem:** Nesting commands like `{ jog: { command: "jog", ... } }`
- **Solution:** Use flat structure `{ command: "jog", ... }`
- **How to verify:** Check Prusa-Link-Web's `src/printer/components/controlActions.js`

### 2. Incorrect Path Prefixes
- **Problem:** Changing `/api/settings` to `/api/v1/settings`
- **Solution:** Settings/logs/connection use `/api/` not `/api/v1/`
- **How to verify:** Check Prusa-Link-Web source for actual endpoint paths

### 3. Missing Discriminated Unions
- **Problem:** Union types without discriminator field
- **Solution:** Use `oneOf` with `discriminator` for command structures
- **Example:** See movement command schemas in spec

### 4. Editing Generated Files
- **Problem:** Modifying `src/api/` directly
- **Solution:** NEVER edit generated files - update spec and regenerate
- **Why:** Changes will be lost on next regeneration

### 5. Forgetting to Regenerate
- **Problem:** Editing spec but not running `just api-update`
- **Solution:** Always run `just api-update` after spec changes
- **Why:** Code will be out of sync with spec

## Verification Sources

When updating the spec, verify against these Prusa-Link-Web sources:

- **Movement commands:** `src/printer/components/controlActions.js`
- **Settings endpoints:** `src/printer/components/settingsActions.js`
- **Job control:** `src/printer/components/printActions.js`
- **File operations:** `src/files/fileActions.js`
- **Camera:** `src/camera/`

## Documentation

See also:
- `/home/kkolk/prusatouch/CLAUDE.md` - Project-wide guidelines
- `/home/kkolk/prusatouch/docs/deployment.md` - Deployment and auth setup
- [Prusa-Link-Web repository](https://github.com/prusa3d/Prusa-Link-Web) - Canonical source of truth for API behavior
