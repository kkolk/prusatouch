# Files Tab P1 Features Implementation Plan

**Created:** 2025-12-21
**Status:** Ready for implementation
**Issues:** prusatouch-d46, prusatouch-4v8, prusatouch-81i

## Overview

Implement the three Priority 1 features for the Files tab:
1. Thumbnail loading in existing FileBrowser BottomSheet
2. Folder navigation in FileBrowser
3. Full-screen FilesView tab

**Execution approach:** Sequential implementation with fresh subagent, code review after each task.

## Architecture Context

**Existing Infrastructure:**
- `src/components/FileBrowser.vue` - BottomSheet file browser (used in HomeView)
- `src/components/FileListItem.vue` - File list item with thumbnail UI placeholder
- `src/stores/files.ts` - File store with LRU cache, breadcrumbs getter
- `src/views/FilesView.vue` - Placeholder view (needs implementation)

**Thumbnail Pattern (from Prusa-Link-Web research):**
- PrusaLink server extracts thumbnails from gcode comments
- API provides URLs via `file.refs.thumbnail` and `file.refs.icon`
- IntersectionObserver with 50px rootMargin for lazy loading
- Fetch as blob URLs: `URL.createObjectURL(blob)` (not base64)
- LRU cache: max 50 thumbnails, cleanup with `URL.revokeObjectURL()`
- Cache busting: `?ct={m_timestamp}` query parameter

## Task 1: Add Thumbnail Loading to FileBrowser (prusatouch-d46)

**Lines: 80-180**

**Goal:** Add lazy-loaded thumbnail support to existing FileBrowser BottomSheet component.

**Current State:**
- FileBrowser passes `filesStore.getThumbnail()` but cache is empty
- FileListItem has thumbnail UI (64x64px container, placeholder)
- OpenAPI spec has `PrintFileRefs` schema with `thumbnail` and `icon` properties

**Implementation:**

### Step 1.1: Enhance FileListItem with IntersectionObserver

**File:** `src/components/FileListItem.vue`

Add thumbnail loading logic:

```typescript
// Add to <script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{
  file: PrintFile
  thumbnailUrl?: string  // New prop from FileBrowser
}>()

const imgRef = ref<HTMLImageElement | null>(null)
const loadedThumbnail = ref<string | null>(null)
let observer: IntersectionObserver | null = null

async function loadThumbnail(url: string) {
  try {
    // Add cache busting with m_timestamp
    const cacheBustUrl = `${url}?ct=${props.file.m_timestamp || Date.now()}`
    const response = await fetch(cacheBustUrl)
    if (!response.ok) throw new Error('Failed to load thumbnail')

    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    loadedThumbnail.value = objectUrl

    // Store in cache (will be handled by parent)
    return objectUrl
  } catch (error) {
    console.warn('Failed to load thumbnail:', error)
    return null
  }
}

onMounted(() => {
  if (!imgRef.value || !props.thumbnailUrl) return

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(async (entry) => {
        if (entry.isIntersecting && props.thumbnailUrl && !loadedThumbnail.value) {
          loadedThumbnail.value = await loadThumbnail(props.thumbnailUrl)
        }
      })
    },
    { rootMargin: '50px' }
  )

  observer.observe(imgRef.value)
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
  // Cleanup blob URL
  if (loadedThumbnail.value) {
    URL.revokeObjectURL(loadedThumbnail.value)
  }
})
```

Update template to use loaded thumbnail:
```vue
<img
  ref="imgRef"
  :src="loadedThumbnail || '/placeholder-file.svg'"
  alt="File thumbnail"
  class="file-thumbnail"
  loading="lazy"
/>
```

### Step 1.2: Update FileBrowser to Pass Thumbnail URLs

**File:** `src/components/FileBrowser.vue`

Pass thumbnail URL from file refs:

```vue
<FileListItem
  v-for="file in filesStore.files"
  :key="file.name"
  :file="file"
  :thumbnail-url="file.refs?.thumbnail"
  @click="onFileClick(file)"
/>
```

### Step 1.3: Enhance filesStore Cache

**File:** `src/stores/files.ts`

Add blob URL tracking to cache:

```typescript
interface CachedThumbnail {
  url: string
  blobUrl: string  // Object URL for cleanup
  timestamp: number
}

const thumbnailCache = new Map<string, CachedThumbnail>()
const MAX_CACHE_SIZE = 50

function cacheThumbnail(fileId: string, url: string, blobUrl: string) {
  // LRU eviction
  if (thumbnailCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = thumbnailCache.keys().next().value
    const oldest = thumbnailCache.get(oldestKey)
    if (oldest) {
      URL.revokeObjectURL(oldest.blobUrl)
    }
    thumbnailCache.delete(oldestKey)
  }

  thumbnailCache.set(fileId, {
    url,
    blobUrl,
    timestamp: Date.now()
  })
}

function getThumbnail(fileId: string): string | null {
  return thumbnailCache.get(fileId)?.blobUrl || null
}

// Cleanup on store reset
function clearThumbnailCache() {
  thumbnailCache.forEach(cached => {
    URL.revokeObjectURL(cached.blobUrl)
  })
  thumbnailCache.clear()
}
```

**Verification:**
- [ ] Thumbnails load when scrolling file list in FileBrowser
- [ ] Cache prevents re-fetching same thumbnail
- [ ] Blob URLs cleaned up on component unmount
- [ ] Works with files that have/don't have thumbnails (placeholder shown)
- [ ] No memory leaks (verify with Chrome DevTools)

**Commit:** `feat: add lazy-loaded thumbnails to FileBrowser (prusatouch-d46)`

---

## Task 2: Implement Folder Navigation (prusatouch-4v8)

**Lines: 181-260**

**Goal:** Add folder navigation capabilities to FileBrowser component.

**Current State:**
- FileBrowser shows flat file list
- `filesStore` has `breadcrumbs` getter (ready to use)
- Folders can be detected by `size === 0` or `undefined`

**Implementation:**

### Step 2.1: Detect and Style Folders in FileListItem

**File:** `src/components/FileListItem.vue`

Add folder detection:

```typescript
const isFolder = computed(() => {
  return props.file.size === 0 || props.file.size === undefined
})
```

Update template to show folder icon:
```vue
<div class="file-icon">
  <IconFolder v-if="isFolder" />
  <img v-else :src="loadedThumbnail || '/placeholder-file.svg'" />
</div>
```

### Step 2.2: Add Folder Navigation to FileBrowser

**File:** `src/components/FileBrowser.vue`

Add navigation logic:

```typescript
import { filesStore } from '@/stores/files'

async function handleItemClick(file: PrintFile) {
  const isFolder = file.size === 0 || file.size === undefined

  if (isFolder) {
    // Navigate into folder
    await filesStore.fetchFiles(file.path)
  } else {
    // Emit file selection event
    emit('file-select', file)
  }
}

async function navigateToPath(path: string) {
  await filesStore.fetchFiles(path)
}
```

### Step 2.3: Add Breadcrumb Navigation UI

**File:** `src/components/FileBrowser.vue`

Add breadcrumb component at top of file list:

```vue
<template>
  <div class="file-browser">
    <!-- Breadcrumb navigation -->
    <div class="breadcrumb-nav">
      <button
        v-for="(segment, index) in filesStore.breadcrumbs"
        :key="index"
        @click="navigateToBreadcrumb(index)"
        class="breadcrumb-item"
      >
        {{ segment.name }}
        <span v-if="index < filesStore.breadcrumbs.length - 1">/</span>
      </button>
    </div>

    <!-- File list -->
    <div class="file-list">
      <FileListItem
        v-for="file in filesStore.files"
        :key="file.name"
        :file="file"
        :thumbnail-url="file.refs?.thumbnail"
        @click="handleItemClick(file)"
      />
    </div>
  </div>
</template>
```

Add CSS for breadcrumbs:

```css
.breadcrumb-nav {
  display: flex;
  gap: var(--space-xs);
  padding: var(--space-sm);
  border-bottom: 1px solid var(--border-color);
  overflow-x: auto;
}

.breadcrumb-item {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: var(--space-xs);
  cursor: pointer;
  white-space: nowrap;
}

.breadcrumb-item:last-child {
  color: var(--text-primary);
  font-weight: 500;
}

.breadcrumb-item:hover {
  color: var(--accent-color);
}
```

**Verification:**
- [ ] Clicking folder navigates into it
- [ ] Breadcrumb shows current path correctly
- [ ] Clicking breadcrumb segment navigates to that folder
- [ ] Back navigation works (click parent in breadcrumb)
- [ ] Root storage shown correctly (e.g., "Local Storage")

**Commit:** `feat: add folder navigation to FileBrowser (prusatouch-4v8)`

---

## Task 3: Implement Full-Screen FilesView (prusatouch-81i)

**Lines: 261-340**

**Goal:** Convert FilesView from placeholder to full-screen tab using FileBrowser component.

**Current State:**
- FilesView is a placeholder div
- FileBrowser exists as BottomSheet modal in HomeView
- Need to adapt FileBrowser for full-screen usage

**Implementation:**

### Step 3.1: Create Full-Screen FilesView

**File:** `src/views/FilesView.vue`

Replace placeholder with full implementation:

```vue
<template>
  <div class="files-view">
    <!-- Top bar with title -->
    <div class="files-header">
      <h1>Files</h1>
    </div>

    <!-- Full-screen file browser -->
    <div class="files-content">
      <FileBrowser
        :is-full-screen="true"
        @file-select="handleFileSelect"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import FileBrowser from '@/components/FileBrowser.vue'
import { filesStore } from '@/stores/files'
import type { PrintFile } from '@/api'

onMounted(async () => {
  // Load files when view mounted
  await filesStore.fetchFiles()
})

function handleFileSelect(file: PrintFile) {
  // TODO: Show file actions or start print
  console.log('File selected:', file.name)
}
</script>

<style scoped>
.files-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--background-primary);
}

.files-header {
  padding: var(--space-md);
  border-bottom: 1px solid var(--border-color);
}

.files-header h1 {
  margin: 0;
  font-size: var(--font-size-xl);
  color: var(--text-primary);
}

.files-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
```

### Step 3.2: Make FileBrowser Adaptable for Full-Screen

**File:** `src/components/FileBrowser.vue`

Add prop to support both BottomSheet and full-screen modes:

```typescript
const props = defineProps<{
  isFullScreen?: boolean
}>()
```

Update styles to adapt:

```css
.file-browser {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* BottomSheet mode - constrain height */
.file-browser:not(.full-screen) {
  max-height: 60vh;
}

/* Full-screen mode - take all available space */
.file-browser.full-screen {
  height: 100%;
}

.file-list {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
```

Update template to apply class:

```vue
<div class="file-browser" :class="{ 'full-screen': isFullScreen }">
  <!-- ... rest of template -->
</div>
```

### Step 3.3: Verify Router Integration

**File:** `src/router/index.ts`

Ensure FilesView route exists:

```typescript
{
  path: '/files',
  name: 'files',
  component: () => import('@/views/FilesView.vue')
}
```

**Verification:**
- [ ] Navigate to Files tab shows full-screen file browser
- [ ] File list scrolls correctly in full-screen mode
- [ ] Breadcrumb navigation works in full-screen view
- [ ] Thumbnails load correctly in full-screen mode
- [ ] BottomSheet FileBrowser in HomeView still works (not broken)
- [ ] Bottom nav bar visible and functional

**Commit:** `feat: implement full-screen FilesView tab (prusatouch-81i)`

---

## Final Verification

After all tasks complete:

**Functional Tests:**
1. Open HomeView → "Select File to Print" → FileBrowser BottomSheet
   - Verify thumbnails load
   - Verify folder navigation works
   - Verify breadcrumbs display correctly

2. Navigate to Files tab → Full-screen view
   - Verify files list loads
   - Verify thumbnails load
   - Verify folder navigation works
   - Verify breadcrumbs work

3. Test edge cases:
   - Files without thumbnails (show placeholder)
   - Empty folders
   - Deep folder nesting
   - Large file lists (100+ files)

**Performance Tests:**
1. Monitor memory usage (Chrome DevTools)
   - Verify blob URLs cleaned up
   - Verify cache max size enforced (50 items)
   - No memory leaks on navigation

2. Check bundle size: `just bundle-size`
   - Ensure still <300KB gzipped

**Test Suite:**
```bash
just test        # Unit tests should pass
just build       # Build should succeed
```

**Deployment:**
```bash
just deploy      # Deploy to Pi and verify
```

## Success Criteria

- [ ] All 3 P1 issues implemented and verified
- [ ] Thumbnails load lazily in both BottomSheet and full-screen modes
- [ ] Folder navigation works with breadcrumb UI
- [ ] FilesView displays as full-screen tab
- [ ] No memory leaks (blob URLs cleaned up)
- [ ] All tests pass (267/267)
- [ ] Bundle size <300KB
- [ ] Code reviewed and approved
- [ ] Deployed to Pi successfully

## Notes

**Dependencies:**
- OpenAPI spec already complete (PrintFileRefs schema)
- FileListItem UI already has thumbnail placeholders
- filesStore already has breadcrumbs getter

**Future Work (P2/P3 issues):**
- File metadata display (size, print time)
- Pull-to-refresh gesture
- Long-press context menu
- Virtual scrolling for large lists
- Enhanced storage selector UI
