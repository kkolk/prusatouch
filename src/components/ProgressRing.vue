<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  progress: number      // 0-100
  size?: number         // diameter in pixels
  strokeWidth?: number
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 200,
  strokeWidth: 10,
  color: 'var(--prusa-orange)'
})

// Clamp progress to valid range (0-100)
const clampedProgress = computed(() => Math.max(0, Math.min(100, props.progress)))

// Calculate circle dimensions
const radius = computed(() => (props.size / 2) - props.strokeWidth)
const circumference = computed(() => 2 * Math.PI * radius.value)

// Calculate stroke-dasharray for progress
const dashArray = computed(() => {
  const progressLength = (clampedProgress.value / 100) * circumference.value
  return `${progressLength} ${circumference.value}`
})
</script>

<template>
  <div class="progress-ring" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg :width="size" :height="size">
      <!-- Background circle -->
      <circle
        class="background"
        :r="radius"
        :cx="size / 2"
        :cy="size / 2"
        fill="none"
        stroke="var(--bg-tertiary)"
        :stroke-width="strokeWidth"
      />

      <!-- Progress circle -->
      <circle
        class="progress"
        :r="radius"
        :cx="size / 2"
        :cy="size / 2"
        fill="none"
        :stroke="color"
        :stroke-width="strokeWidth"
        :stroke-dasharray="dashArray"
        stroke-linecap="round"
        transform-origin="center"
        transform="rotate(-90)"
      />
    </svg>

    <!-- Center slot for content -->
    <div class="center-content">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.progress-ring {
  position: relative;
  display: inline-block;
}

svg {
  transform: scaleY(-1); /* Flip to make rotation work correctly */
}

.center-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}
</style>
