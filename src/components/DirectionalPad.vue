<script setup lang="ts">
interface MoveEvent {
  axis: 'x' | 'y' | 'z'
  direction: number  // -1 or 1
}

const emit = defineEmits<{
  move: [event: MoveEvent]
}>()

function handleMove(axis: 'x' | 'y' | 'z', direction: number) {
  emit('move', { axis, direction })
}
</script>

<template>
  <div class="directional-pad">
    <!-- XY Movement Pad -->
    <div class="xy-pad">
      <button
        class="pad-button xy-up"
        data-direction="up"
        @click="handleMove('y', 1)"
      >
        <span class="arrow">▲</span>
      </button>

      <div class="xy-middle">
        <button
          class="pad-button xy-left"
          data-direction="left"
          @click="handleMove('x', -1)"
        >
          <span class="arrow">◄</span>
        </button>

        <div class="pad-center"></div>

        <button
          class="pad-button xy-right"
          data-direction="right"
          @click="handleMove('x', 1)"
        >
          <span class="arrow">►</span>
        </button>
      </div>

      <button
        class="pad-button xy-down"
        data-direction="down"
        @click="handleMove('y', -1)"
      >
        <span class="arrow">▼</span>
      </button>
    </div>

    <!-- Z Axis Controls -->
    <div class="z-controls">
      <button
        class="pad-button z-up"
        data-axis="z"
        data-direction="up"
        @click="handleMove('z', 1)"
      >
        <span class="arrow">▲</span>
      </button>

      <div class="z-label">Z</div>

      <button
        class="pad-button z-down"
        data-axis="z"
        data-direction="down"
        @click="handleMove('z', -1)"
      >
        <span class="arrow">▼</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.directional-pad {
  display: flex;
  gap: var(--space-xl);
  align-items: center;
  justify-content: center;
}

/* XY Movement Pad */
.xy-pad {
  display: grid;
  grid-template-rows: auto auto auto;
  gap: var(--space-xs);
}

.xy-middle {
  display: grid;
  grid-template-columns: auto auto auto;
  gap: var(--space-xs);
  align-items: center;
}

.xy-up,
.xy-down {
  justify-self: center;
}

.pad-center {
  width: 80px;
  height: 80px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

/* Z Axis Controls */
.z-controls {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  align-items: center;
}

.z-label {
  font-size: 20px;
  font-weight: bold;
  color: var(--text-secondary);
  padding: var(--space-xs);
}

/* Pad Buttons */
.pad-button {
  min-width: 80px;
  min-height: 80px;
  width: 80px;
  height: 80px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--transition-fast);
  font-family: inherit;
}

/* GPU-accelerated hover state - ONLY transform and opacity */
.pad-button:hover {
  transform: scale(1.05);
  opacity: 0.9;
}

/* GPU-accelerated active state - ONLY transform */
.pad-button:active {
  transform: scale(0.90);
}

.arrow {
  line-height: 1;
  user-select: none;
}
</style>
