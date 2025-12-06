<script setup lang="ts">
import { computed } from 'vue'
import type { FileInfo } from '@/api'

interface Props {
  file: FileInfo
  thumbnailUrl?: string | null
  selected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  thumbnailUrl: null,
  selected: false
})

const emit = defineEmits<{
  click: [file: FileInfo]
}>()

// Format file size
const formattedSize = computed(() => {
  if (!props.file.size) return '---'

  const bytes = props.file.size
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
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
    <!-- Thumbnail -->
    <div class="thumbnail-container">
      <img
        v-if="thumbnailUrl"
        :src="thumbnailUrl"
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
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: transform var(--transition-fast);
  user-select: none;
}

.file-list-item:active {
  transform: scale(0.98);
}

.file-list-item.selected {
  background: var(--bg-tertiary);
  border: 2px solid var(--prusa-orange);
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
