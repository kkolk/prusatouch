import { describe, it, expect, beforeEach } from 'vitest'
import { ref, computed, nextTick, type Ref } from 'vue'
import { useVirtualScroll } from '../../../src/composables/useVirtualScroll'
import type { FileItem } from '../../../src/stores/files'

// Helper to create mock FileItem
function createMockFileItem(name: string, size: number): FileItem {
  return { name, size } as FileItem
}

describe('useVirtualScroll', () => {
  const itemHeight = 80
  const bufferSize = 2
  let mockContainerRef: Ref<HTMLElement | null>

  beforeEach(() => {
    mockContainerRef = ref(null)
  })

  describe('visible range calculation', () => {
    it('calculates visible range correctly when scrolled to middle', () => {
      const items = computed(() =>
        Array.from({ length: 100 }, (_, i) => createMockFileItem(`file${i}.gcode`, 1000 + i))
      )
      const mockElement = {
        clientHeight: 400,
        scrollTop: 1600
      } as unknown as HTMLElement
      mockContainerRef.value = mockElement

      const { visibleItems, handleScroll } = useVirtualScroll(items, itemHeight, mockContainerRef, bufferSize)

      // Trigger scroll event to update scrollTop
      const event = { target: mockElement } as unknown as Event
      handleScroll(event)

      // Scroll position 1600 / 80 = item 20
      // Visible: items 20-25 (400 / 80 = 5 items)
      // Buffer: 18-27
      expect(visibleItems.value.length).toBeGreaterThan(0)
      expect(visibleItems.value[0].absoluteIndex).toBe(18) // Start with buffer
      expect(visibleItems.value[0].item.name).toBe('file18.gcode')
    })

    it('handles scrollTop at start (index 0)', () => {
      const items = computed(() =>
        Array.from({ length: 100 }, (_, i) => createMockFileItem(`file${i}.gcode`, 1000 + i))
      )
      const mockElement = {
        clientHeight: 400,
        scrollTop: 0
      } as unknown as HTMLElement
      mockContainerRef.value = mockElement

      const { visibleItems } = useVirtualScroll(items, itemHeight, mockContainerRef, bufferSize)

      expect(visibleItems.value.length).toBeGreaterThan(0)
      expect(visibleItems.value[0].absoluteIndex).toBe(0)
      expect(visibleItems.value[0].item.name).toBe('file0.gcode')
    })

    it('handles scrollTop at end (last items visible)', () => {
      const items = computed(() =>
        Array.from({ length: 100 }, (_, i) => createMockFileItem(`file${i}.gcode`, 1000 + i))
      )
      const mockElement = {
        clientHeight: 400,
        scrollTop: 7200
      } as unknown as HTMLElement
      mockContainerRef.value = mockElement

      const { visibleItems, handleScroll } = useVirtualScroll(items, itemHeight, mockContainerRef, bufferSize)

      // Trigger scroll event to update scrollTop
      const event = { target: mockElement } as unknown as Event
      handleScroll(event)

      // Scroll 7200 / 80 = item 90, viewport 5 items, buffer 2 = items 88-97
      expect(visibleItems.value.length).toBeGreaterThan(0)
      // Last visible item index will be near the end with buffer
      expect(visibleItems.value[visibleItems.value.length - 1].absoluteIndex).toBeGreaterThanOrEqual(95)
      // Last absolute index will be clamped to the list length minus 1
      const lastIndex = visibleItems.value[visibleItems.value.length - 1].absoluteIndex
      expect(lastIndex).toBeLessThan(100)
    })
  })

  describe('edge cases', () => {
    it('handles small list (fewer items than viewport)', () => {
      const items = computed(() =>
        Array.from({ length: 5 }, (_, i) => createMockFileItem(`file${i}.gcode`, 1000 + i))
      )
      const mockElement = {
        clientHeight: 400,
        scrollTop: 0
      } as unknown as HTMLElement
      mockContainerRef.value = mockElement

      const { visibleItems } = useVirtualScroll(items, itemHeight, mockContainerRef, bufferSize)

      // Should render all items when list is small (< 10 items)
      expect(visibleItems.value.length).toBe(5)
      expect(visibleItems.value[0].absoluteIndex).toBe(0)
      expect(visibleItems.value[4].absoluteIndex).toBe(4)
    })

    it('handles empty list', () => {
      const items = computed<FileItem[]>(() => [])
      const mockElement = {
        clientHeight: 400,
        scrollTop: 0
      } as unknown as HTMLElement
      mockContainerRef.value = mockElement

      const { visibleItems, totalHeight, offsetY } = useVirtualScroll(
        items,
        itemHeight,
        mockContainerRef,
        bufferSize
      )

      expect(visibleItems.value.length).toBe(0)
      expect(totalHeight.value).toBe(0)
      expect(offsetY.value).toBe(0)
    })

    it('handles scroll boundaries correctly', () => {
      const items = computed(() =>
        Array.from({ length: 20 }, (_, i) => createMockFileItem(`file${i}.gcode`, 1000 + i))
      )
      const mockElement = {
        clientHeight: 400,
        scrollTop: -100
      } as unknown as HTMLElement
      mockContainerRef.value = mockElement

      const { visibleItems } = useVirtualScroll(items, itemHeight, mockContainerRef, bufferSize)

      // Negative scroll should clamp to 0
      expect(visibleItems.value[0].absoluteIndex).toBe(0)
    })
  })

  describe('transform styles', () => {
    it('applies correct transform styles to visible items', () => {
      const items = computed(() =>
        Array.from({ length: 100 }, (_, i) => createMockFileItem(`file${i}.gcode`, 1000 + i))
      )
      const mockElement = {
        clientHeight: 400,
        scrollTop: 0
      } as unknown as HTMLElement
      mockContainerRef.value = mockElement

      const { visibleItems } = useVirtualScroll(items, itemHeight, mockContainerRef, bufferSize)

      const firstItem = visibleItems.value[0]
      expect(firstItem.style.transform).toBe('translateY(0px)')
      expect(firstItem.style.position).toBe('absolute')
      expect(firstItem.style.top).toBe('0px')
      expect(firstItem.style.left).toBe('0px')
      expect(firstItem.style.right).toBe('0px')
      expect(firstItem.style.height).toBe(`${itemHeight}px`)

      const secondItem = visibleItems.value[1]
      expect(secondItem.style.transform).toBe(`translateY(${itemHeight}px)`)
    })

    it('calculates correct offsetY for top spacer', () => {
      const items = computed(() =>
        Array.from({ length: 100 }, (_, i) => createMockFileItem(`file${i}.gcode`, 1000 + i))
      )
      const mockElement = {
        clientHeight: 400,
        scrollTop: 800
      } as unknown as HTMLElement
      mockContainerRef.value = mockElement

      const { offsetY, handleScroll } = useVirtualScroll(items, itemHeight, mockContainerRef, bufferSize)

      // Trigger scroll event to update scrollTop
      const event = { target: mockElement } as unknown as Event
      handleScroll(event)

      // Scroll 800 / 80 = item 10, buffer of 2 = item 8
      expect(offsetY.value).toBe(640) // 8 * 80
    })
  })

  describe('total height calculation', () => {
    it('calculates correct total height for large list', () => {
      const itemCount = 100
      const items = computed(() =>
        Array.from({ length: itemCount }, (_, i) => createMockFileItem(`file${i}.gcode`, 1000 + i))
      )
      const mockElement = {
        clientHeight: 400,
        scrollTop: 0
      } as unknown as HTMLElement
      mockContainerRef.value = mockElement

      const { totalHeight } = useVirtualScroll(items, itemHeight, mockContainerRef, bufferSize)

      expect(totalHeight.value).toBe(itemCount * itemHeight)
    })

    it('calculates total height as 0 for empty list', () => {
      const items = computed<FileItem[]>(() => [])
      const mockElement = {
        clientHeight: 400,
        scrollTop: 0
      } as unknown as HTMLElement
      mockContainerRef.value = mockElement

      const { totalHeight } = useVirtualScroll(items, itemHeight, mockContainerRef, bufferSize)

      expect(totalHeight.value).toBe(0)
    })
  })

  describe('reactive scroll updates', () => {
    it('updates visible range reactively when scrolling', async () => {
      const items = computed(() =>
        Array.from({ length: 100 }, (_, i) => createMockFileItem(`file${i}.gcode`, 1000 + i))
      )
      const mockElement = {
        clientHeight: 400,
        scrollTop: 0
      } as unknown as HTMLElement
      mockContainerRef.value = mockElement

      const { visibleItems, handleScroll } = useVirtualScroll(items, itemHeight, mockContainerRef, bufferSize)

      const firstVisibleIndex = visibleItems.value[0].absoluteIndex
      expect(firstVisibleIndex).toBe(0)

      // Simulate scroll
      mockElement.scrollTop = 800
      const event1 = { target: mockElement } as unknown as Event
      handleScroll(event1)

      await nextTick()

      const newFirstVisibleIndex = visibleItems.value[0].absoluteIndex
      expect(newFirstVisibleIndex).toBeGreaterThan(firstVisibleIndex)
      expect(newFirstVisibleIndex).toBe(8) // 800 / 80 = 10, minus buffer 2 = 8
    })

    it('updates offsetY reactively when scrolling', async () => {
      const items = computed(() =>
        Array.from({ length: 100 }, (_, i) => createMockFileItem(`file${i}.gcode`, 1000 + i))
      )
      const mockElement = {
        clientHeight: 400,
        scrollTop: 0
      } as unknown as HTMLElement
      mockContainerRef.value = mockElement

      const { offsetY, handleScroll } = useVirtualScroll(items, itemHeight, mockContainerRef, bufferSize)

      expect(offsetY.value).toBe(0)

      // Simulate scroll
      mockElement.scrollTop = 800
      const event2 = { target: mockElement } as unknown as Event
      handleScroll(event2)

      await nextTick()

      expect(offsetY.value).toBe(640) // 8 * 80
    })
  })
})
