<template>
  <nav class="kiosk-nav">
    <div class="nav-indicator" :style="indicatorStyle"></div>
    <button
      v-for="(tab, index) in tabs"
      :key="tab.name"
      class="nav-tab"
      :class="{ active: isActive(tab.route) }"
      @click="navigate(tab.route)"
      :data-index="index"
    >
      <span class="nav-icon">{{ tab.icon }}</span>
      <span class="nav-label">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const tabs = [
  { name: 'files', route: '/files', icon: '📁', label: 'Files' },
  { name: 'control', route: '/control', icon: '🎮', label: 'Control' },
  { name: 'status', route: '/status', icon: '📊', label: 'Status' }
]

// Sliding tab indicator position (GPU-accelerated with transform)
const activeTabIndex = computed(() => {
  return tabs.findIndex(tab => tab.route === route.path)
})

const indicatorStyle = computed(() => {
  const index = activeTabIndex.value >= 0 ? activeTabIndex.value : 0
  const width = 100 / tabs.length
  return {
    transform: `translateX(${index * 100}%)`,
    width: `${width}%`
  }
})

function isActive(path: string): boolean {
  return route.path === path
}

function navigate(path: string) {
  router.push(path)
}
</script>

<style scoped>
.kiosk-nav {
  position: relative;
  height: var(--touch-comfortable);
  min-height: var(--touch-comfortable);
  background: var(--bg-secondary);
  border-top: 1px solid var(--bg-tertiary);
  display: flex;
  align-items: stretch;
}

/* GPU-accelerated sliding indicator */
.nav-indicator {
  position: absolute;
  top: 0;
  left: 0;
  height: 3px;
  background: var(--prusa-orange);
  transition: transform var(--transition-normal);
  will-change: transform;
  z-index: 1;
}

.nav-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: transform var(--transition-fast);
  font-family: inherit;
  position: relative;
}

.nav-tab:active {
  transform: scale(0.95);
}

.nav-tab.active {
  color: var(--prusa-orange);
}

.nav-icon {
  font-size: 20px;
}

.nav-label {
  font-size: 12px;
  font-weight: 500;
}
</style>
