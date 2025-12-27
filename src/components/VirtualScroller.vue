<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useVirtualScroll } from '@/composables/useVirtualScroll'
import FileListItem from './FileListItem.vue'
import type { FileItem } from '@/stores/files'

interface Props {
  items: FileItem[]
  itemHeight?: number
  bufferSize?: number
  getThumbnailUrl?: (item: FileItem) => string | null | undefined
}

const props = withDefaults(defineProps<Props>(), {
  itemHeight: 80,
  bufferSize: 2,
  getThumbnailUrl: undefined
})

const emit = defineEmits<{
  itemClick: [file: FileItem]
}>()

const containerRef = ref<HTMLElement | null>(null)

// Use virtual scrolling composable
const { visibleItems, totalHeight, offsetY, handleScroll } = useVirtualScroll(
  computed(() => props.items),
  props.itemHeight,
  containerRef,
  props.bufferSize
)

// Calculate bottom spacer height
const bottomSpacerHeight = computed(() => {
  return Math.max(0, totalHeight.value - offsetY.value - (visibleItems.value.length * props.itemHeight))
})

// Update container height when ref is set
function updateContainerHeight() {
  if (containerRef.value) {
    // Update container height from DOM
    const event = new Event('scroll')
    Object.defineProperty(event, 'target', { value: containerRef.value, enumerable: true })
    handleScroll(event)
  }
}

onMounted(() => {
  updateContainerHeight()
})

onUnmounted(() => {
  // Cleanup if needed
})

function handleItemClick(file: FileItem) {
  emit('itemClick', file)
}
</script>

<template>
  <div
    ref="containerRef"
    class="virtual-scroller"
    @scroll="handleScroll"
  >
    <!-- Top spacer (invisible items above viewport) -->
    <div :style="{ height: `${offsetY}px` }" class="spacer" />

    <!-- Visible items with transform positioning -->
    <div
      v-for="{ item, absoluteIndex, style } in visibleItems"
      :key="item.name || absoluteIndex"
      :style="style"
      class="virtual-item"
    >
      <FileListItem
        :file="item"
        :thumbnail-url="props.getThumbnailUrl ? props.getThumbnailUrl(item) : undefined"
        @click="handleItemClick"
      />
    </div>

    <!-- Bottom spacer (invisible items below viewport) -->
    <div :style="{ height: `${bottomSpacerHeight}px` }" class="spacer" />
  </div>
</template>

<style scoped>
.virtual-scroller {
  overflow-y: auto;
  height: 100%;
  position: relative;
}

.spacer {
  flex-shrink: 0;
}

.virtual-item {
  position: absolute;
  left: 0;
  right: 0;
  padding: 4px;
  box-sizing: border-box;
}
</style>
