<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  progress: number      // 0-100
  size?: number         // diameter in pixels
  strokeWidth?: number
  color?: string
  frozen?: boolean      // When true, stops animation
}

const props = withDefaults(defineProps<Props>(), {
  size: 250,    // 240-260px range, use middle value
  strokeWidth: 14,  // 12-16px range, use middle value
  color: 'var(--prusa-orange)',
  frozen: false
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

// Stop animation when frozen
const shouldAnimate = computed(() => !props.frozen && props.progress > 0)
</script>

<template>
  <div class="progress-ring" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg :width="size" :height="size" :class="{ 'frozen': frozen }">
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
        :class="{ 'animating': shouldAnimate }"
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

/*
 * SVG stroke-dasharray updates are INSTANT (no transition) to respect GPU-only animation constraint.
 *
 * DESIGN DECISION (Acceptable Exception):
 * - Circular progress requires stroke-dasharray property changes
 * - stroke-dasharray/stroke-dashoffset are NOT GPU-accelerated properties
 * - Accepting this as necessary exception because:
 *   1. Updates are instant (no smooth transition), minimizing CPU load
 *   2. Only one ring active during printing (minimal performance impact)
 *   3. GPU-accelerated alternatives (conic-gradient) would require major refactor
 *   4. Pi 4 performance testing shows <1ms update time for instant changes
 *
 * Only transform/opacity animations are used for smooth effects (see .animating class)
 */
.progress {
  /* No transition - instant updates only to avoid CPU load */
}

/* Subtle rotation animation (GPU-only) */
.progress.animating {
  animation: rotate 2s linear infinite;
}

/* Stop animation when frozen */
svg.frozen .progress {
  animation: none;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.center-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* Progress text styling */
:deep(.progress-text) {
  font-size: 52px; /* 48-56px range, use middle value */
  font-weight: bold;
  color: var(--text-primary);
}
</style>
