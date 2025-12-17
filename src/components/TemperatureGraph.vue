<script setup lang="ts">
import { computed } from 'vue'
import type { TemperatureDataPoint } from '../stores/printer'

interface Props {
  data: TemperatureDataPoint[]
  width?: number
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  width: 700,
  height: 200
})

// Chart dimensions
const padding = { top: 20, right: 60, bottom: 30, left: 50 }
const chartWidth = computed(() => props.width - padding.left - padding.right)
const chartHeight = computed(() => props.height - padding.top - padding.bottom)

// Temperature range
const tempRange = computed(() => {
  if (props.data.length === 0) return { min: 0, max: 300 }

  const allTemps = props.data.flatMap(d => [d.nozzle, d.bed, d.nozzleTarget, d.bedTarget])
  const min = Math.min(...allTemps, 0)
  const max = Math.max(...allTemps, 300)

  // Round to nice numbers
  return {
    min: Math.floor(min / 50) * 50,
    max: Math.ceil(max / 50) * 50
  }
})

// Scale functions
function scaleX(index: number): number {
  if (props.data.length <= 1) return 0
  return (index / (props.data.length - 1)) * chartWidth.value
}

function scaleY(temp: number): number {
  const { min, max } = tempRange.value
  const range = max - min
  if (range === 0) return chartHeight.value / 2

  return chartHeight.value - ((temp - min) / range) * chartHeight.value
}

// Generate path data for lines
function generatePath(getValue: (d: TemperatureDataPoint) => number): string {
  if (props.data.length === 0) return ''

  return props.data
    .map((d, i) => {
      const x = scaleX(i) + padding.left
      const y = scaleY(getValue(d)) + padding.top
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
    })
    .join(' ')
}

const nozzlePath = computed(() => generatePath(d => d.nozzle))
const bedPath = computed(() => generatePath(d => d.bed))
const nozzleTargetPath = computed(() => generatePath(d => d.nozzleTarget))
const bedTargetPath = computed(() => generatePath(d => d.bedTarget))

// Grid lines (horizontal)
const gridLines = computed(() => {
  const { min, max } = tempRange.value
  const step = 50
  const lines = []

  for (let temp = min; temp <= max; temp += step) {
    const y = scaleY(temp) + padding.top
    lines.push({ y, label: temp })
  }

  return lines
})

// Time labels (vertical)
const timeLabels = computed(() => {
  if (props.data.length === 0) return []

  const labels = []
  const step = Math.max(1, Math.floor(props.data.length / 5))

  for (let i = 0; i < props.data.length; i += step) {
    const x = scaleX(i) + padding.left
    const timestamp = props.data[i].timestamp
    const date = new Date(timestamp)
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    labels.push({ x, label: `${minutes}:${seconds}` })
  }

  return labels
})
</script>

<template>
  <div class="temperature-graph">
    <svg :width="width" :height="height" xmlns="http://www.w3.org/2000/svg">
      <!-- Grid lines -->
      <g class="grid">
        <line
          v-for="line in gridLines"
          :key="line.label"
          :x1="padding.left"
          :x2="width - padding.right"
          :y1="line.y"
          :y2="line.y"
          class="grid-line"
        />
      </g>

      <!-- Y-axis labels -->
      <g class="y-axis">
        <text
          v-for="line in gridLines"
          :key="line.label"
          :x="padding.left - 10"
          :y="line.y + 4"
          class="axis-label"
        >
          {{ line.label }}°
        </text>
      </g>

      <!-- X-axis labels -->
      <g class="x-axis">
        <text
          v-for="label in timeLabels"
          :key="label.label"
          :x="label.x"
          :y="height - padding.bottom + 20"
          class="axis-label"
        >
          {{ label.label }}
        </text>
      </g>

      <!-- Temperature lines -->
      <g class="temperature-lines">
        <!-- Bed target (dashed) -->
        <path
          v-if="bedTargetPath"
          :d="bedTargetPath"
          class="temp-line bed-target"
        />

        <!-- Nozzle target (dashed) -->
        <path
          v-if="nozzleTargetPath"
          :d="nozzleTargetPath"
          class="temp-line nozzle-target"
        />

        <!-- Bed current -->
        <path
          v-if="bedPath"
          :d="bedPath"
          class="temp-line bed"
        />

        <!-- Nozzle current -->
        <path
          v-if="nozzlePath"
          :d="nozzlePath"
          class="temp-line nozzle"
        />
      </g>
    </svg>

    <!-- Legend -->
    <div class="legend">
      <div class="legend-item">
        <span class="legend-line nozzle"></span>
        <span class="legend-label">Nozzle</span>
      </div>
      <div class="legend-item">
        <span class="legend-line bed"></span>
        <span class="legend-label">Bed</span>
      </div>
      <div class="legend-item">
        <span class="legend-line target"></span>
        <span class="legend-label">Target</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.temperature-graph {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-md);
}

svg {
  overflow: visible;
}

/* Grid */
.grid-line {
  stroke: var(--bg-tertiary);
  stroke-width: 1;
  opacity: 0.5;
}

/* Axis labels */
.axis-label {
  fill: var(--text-secondary);
  font-size: 12px;
  text-anchor: end;
}

.x-axis .axis-label {
  text-anchor: middle;
}

/* Temperature lines */
.temp-line {
  fill: none;
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.temp-line.nozzle {
  stroke: var(--prusa-orange);
}

.temp-line.bed {
  stroke: #00aaff;
}

.temp-line.nozzle-target {
  stroke: var(--prusa-orange);
  stroke-dasharray: 4 4;
  opacity: 0.5;
}

.temp-line.bed-target {
  stroke: #00aaff;
  stroke-dasharray: 4 4;
  opacity: 0.5;
}

/* Legend */
.legend {
  display: flex;
  gap: var(--space-md);
  justify-content: center;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: 14px;
}

.legend-line {
  width: 24px;
  height: 2px;
  display: block;
}

.legend-line.nozzle {
  background: var(--prusa-orange);
}

.legend-line.bed {
  background: #00aaff;
}

.legend-line.target {
  background: var(--text-secondary);
  background-image: linear-gradient(90deg, var(--text-secondary) 50%, transparent 50%);
  background-size: 8px 2px;
  opacity: 0.5;
}

.legend-label {
  color: var(--text-secondary);
}
</style>
