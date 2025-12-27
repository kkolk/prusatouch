import { computed, ref, type ComputedRef, type Ref } from 'vue'
import type { FileItem } from '../stores/files'

/**
 * Virtual scrolling composable for efficient rendering of large lists
 *
 * Only renders visible items plus a buffer, improving performance for large file lists.
 * Critical for Pi 4 performance when displaying hundreds of files.
 *
 * Usage:
 * ```
 * const containerRef = ref<HTMLElement | null>(null)
 * const { visibleItems, totalHeight, offsetY, handleScroll } = useVirtualScroll(
 *   computed(() => files.value),
 *   72,  // item height in pixels
 *   containerRef,
 *   2    // buffer size
 * )
 * ```
 */
export function useVirtualScroll(
  items: ComputedRef<FileItem[]>,
  itemHeight: number,
  containerRef: Ref<HTMLElement | null>,
  bufferSize: number = 2
) {
  const scrollTop = ref(0)
  const containerHeight = ref(0)

  // Total height of the virtual list (for scrollbar)
  const totalHeight = computed(() => {
    return items.value.length * itemHeight
  })

  // Visible item range with buffer
  const visibleRange = computed(() => {
    const itemCount = items.value.length

    // Edge case: Empty list
    if (itemCount === 0) {
      return { startIndex: 0, endIndex: 0 }
    }

    // Edge case: Small list (< 10 items) - render all
    if (itemCount < 10) {
      return { startIndex: 0, endIndex: itemCount }
    }

    // Calculate visible range based on scroll position
    const startIndex = Math.floor(scrollTop.value / itemHeight)
    const visibleCount = Math.ceil(containerHeight.value / itemHeight)
    const endIndex = startIndex + visibleCount

    // Add buffer for smooth scrolling
    const bufferStart = Math.max(0, startIndex - bufferSize)
    const bufferEnd = Math.min(itemCount, endIndex + bufferSize)

    return { startIndex: bufferStart, endIndex: bufferEnd }
  })

  // Visible items with absolute positioning styles
  const visibleItems = computed(() => {
    const { startIndex, endIndex } = visibleRange.value

    if (startIndex >= endIndex) {
      return []
    }

    return items.value.slice(startIndex, endIndex).map((item, index) => ({
      item,
      absoluteIndex: startIndex + index,
      style: {
        transform: `translateY(${(startIndex + index) * itemHeight}px)`,
        position: 'absolute' as const,
        top: '0px' as const,
        left: '0px' as const,
        right: '0px' as const,
        height: `${itemHeight}px`
      }
    }))
  })

  // Top spacer offset to maintain scroll position
  const offsetY = computed(() => {
    return visibleRange.value.startIndex * itemHeight
  })

  // Scroll event handler
  function handleScroll(event: Event) {
    const target = event.target as HTMLElement
    scrollTop.value = target.scrollTop
    containerHeight.value = target.clientHeight
  }

  // Initialize container height if ref is set
  if (containerRef.value) {
    containerHeight.value = containerRef.value.clientHeight
  }

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll
  }
}
