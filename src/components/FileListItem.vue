<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useFilesStore } from '@/stores/files'
import type { FileItem } from '@/stores/files'

interface Props {
  file: FileItem
  thumbnailUrl?: string | null
  selected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  thumbnailUrl: null,
  selected: false
})

const emit = defineEmits<{
  click: [file: FileItem]
}>()

const filesStore = useFilesStore()

// Thumbnail loading state
const imgRef = ref<HTMLImageElement | null>(null)
const cachedBlobUrl = ref<string | null>(null)
let observer: IntersectionObserver | null = null

// Detect if item is a folder
const isFolder = computed(() => {
  return props.file.size === 0 || props.file.size === undefined
})

// Format file size
const formattedSize = computed(() => {
  if (!props.file.size) return '---'

  const bytes = props.file.size
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024
    return kb % 1 === 0 ? `${kb} KB` : `${kb.toFixed(1)} KB`
  }
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
})

// Load thumbnail with cache integration
async function loadThumbnail(url: string) {
  try {
    // Check if thumbnail is already cached in store
    const cached = filesStore.getThumbnail(props.file.name)
    if (cached) {
      cachedBlobUrl.value = cached
      return cached
    }

    // Normalize thumbnail URL
    // PrusaLink may return various formats:
    // - /api/thumbnails/storage/path/file.gcode.orig.png (new format)
    // - /thumb/local/file.gcode (legacy format)
    // - /thumbnails/local/file.gcode.orig.png (without /api prefix)
    let normalizedUrl = url

    // Ensure URL starts with /api if it's a relative path
    if (url.startsWith('/') && !url.startsWith('/api/')) {
      normalizedUrl = `/api${url}`
    }

    // Remove double slashes (can happen if PrusaLink returns paths with leading slashes)
    // Example: /api/thumbnails/storage//path becomes /api/thumbnails/storage/path
    normalizedUrl = normalizedUrl.replace(/\/+/g, '/')

    // Add cache busting with current timestamp to prevent serving stale/corrupted cached responses
    // Using Date.now() instead of m_timestamp ensures fresh fetches after deployments
    const cacheBustUrl = `${normalizedUrl}?ct=${Date.now()}`
    console.log('[Thumbnail] Fetching:', cacheBustUrl)
    const response = await fetch(cacheBustUrl, {
      headers: {
        'Accept': 'image/*'
      }
    })
    console.log('[Thumbnail] Response status:', response.status, response.statusText)
    console.log('[Thumbnail] Response Content-Type:', response.headers.get('Content-Type'))

    if (!response.ok) throw new Error(`Failed to load thumbnail: ${response.status} ${response.statusText}`)

    // Verify response is actually an image (not HTML error page)
    const contentType = response.headers.get('Content-Type')
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error(`Response is not an image: ${contentType}`)
    }

    const blob = await response.blob()
    console.log('[Thumbnail] Blob size:', blob.size, 'type:', blob.type)
    const objectUrl = URL.createObjectURL(blob)
    console.log('[Thumbnail] Object URL:', objectUrl)

    // Store in cache for future use
    filesStore.cacheThumbnail(props.file.name, url, objectUrl)
    cachedBlobUrl.value = objectUrl

    return objectUrl
  } catch (error) {
    console.warn('Failed to load thumbnail for', props.file.name, ':', error)
    return null
  }
}

onMounted(() => {
  if (!imgRef.value || !props.thumbnailUrl) return

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(async (entry) => {
        if (entry.isIntersecting && props.thumbnailUrl && !cachedBlobUrl.value) {
          await loadThumbnail(props.thumbnailUrl)
        }
      })
    },
    { rootMargin: '50px', threshold: 0.01 }
  )

  observer.observe(imgRef.value)

  // Check if element is already in viewport and load immediately
  // This handles the case where the element is visible on initial render
  const rect = imgRef.value.getBoundingClientRect()
  const isInViewport = (
    rect.top >= -50 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + 50 &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )

  if (isInViewport && !cachedBlobUrl.value) {
    loadThumbnail(props.thumbnailUrl)
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
  // Do NOT revoke blob URL - it's managed by the store cache
  // The store will handle cleanup via clearThumbnailCache()
})

function handleClick() {
  emit('click', props.file)
}
</script>

<template>
  <div
    class="file-list-item"
    :class="{ selected }"
    @click="handleClick"
  >
    <!-- Thumbnail or Folder Icon -->
    <div class="thumbnail-container">
      <div v-if="isFolder" class="folder-icon">
        📁
      </div>
      <img
        v-else-if="thumbnailUrl"
        ref="imgRef"
        :src="cachedBlobUrl || '/placeholder-file.svg'"
        :alt="file.name"
        class="thumbnail"
        loading="lazy"
      />
      <div v-else class="thumbnail-placeholder">
        📄
      </div>
    </div>

    <!-- File info -->
    <div class="file-info">
      <div class="filename">{{ file.name }}</div>
      <div class="metadata">{{ formattedSize }}</div>
    </div>

    <!-- Chevron -->
    <div class="chevron">›</div>
  </div>
</template>

<style scoped>
.file-list-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  min-height: 80px;
  padding: var(--space-sm);
  background: var(--bg-secondary);
  border: var(--border-medium);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform var(--transition-fast);
  user-select: none;
}

.file-list-item:active {
  transform: scale(0.98);
}

.file-list-item.selected {
  background: var(--bg-tertiary);
  border: var(--border-primary);
  box-shadow: var(--shadow-md);
}

.thumbnail-container {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-placeholder {
  font-size: 32px;
  opacity: 0.5;
}

.folder-icon {
  font-size: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.filename {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.metadata {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.chevron {
  font-size: 24px;
  color: var(--text-tertiary);
  flex-shrink: 0;
}
</style>
