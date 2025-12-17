<template>
  <div class="app">
    <!-- Top Bar -->
    <header class="top-bar">
      <div class="top-bar-content">
        <h1 class="app-title">PrusaTouch</h1>
        <!-- Position Display (Control View Only) -->
        <!-- Note: Position values use 1 decimal place for compact display in top bar -->
        <div v-if="isControlView" class="position-compact">
          <span class="pos-item">
            <span class="pos-label">X:</span>
            <span class="pos-value">{{ position.x.toFixed(1) }}</span>
          </span>
          <span class="pos-item">
            <span class="pos-label">Y:</span>
            <span class="pos-value">{{ position.y.toFixed(1) }}</span>
          </span>
          <span class="pos-item">
            <span class="pos-label">Z:</span>
            <span class="pos-value">{{ position.z.toFixed(1) }}</span>
          </span>
        </div>
        <!-- Temperature Display (Home View Only) -->
        <div v-if="isHomeView" class="temps-compact">
          <span class="temp-item">
            <span class="temp-icon">🔥</span>
            <span class="temp-value">{{ nozzleTemp.current }}°</span>
            <span class="temp-separator">/</span>
            <span class="temp-target">{{ nozzleTemp.target }}°</span>
          </span>
          <span class="temp-item">
            <span class="temp-icon">🛏️</span>
            <span class="temp-value">{{ bedTemp.current }}°</span>
            <span class="temp-separator">/</span>
            <span class="temp-target">{{ bedTemp.target }}°</span>
          </span>
        </div>
        <div class="top-bar-actions">
          <button class="settings-btn" @click="goToDebug" aria-label="Debug">
            <span class="settings-icon">🐛</span>
          </button>
          <button class="settings-btn" @click="goToSettings" aria-label="Settings">
            <span class="settings-icon">⚙️</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Bottom Navigation -->
    <nav class="bottom-nav">
      <button
        v-for="tab in tabs"
        :key="tab.name"
        class="nav-tab"
        :class="{ active: isActive(tab.route) }"
        @click="navigate(tab.route)"
      >
        <span class="nav-icon">{{ tab.icon }}</span>
        <span class="nav-label">{{ tab.label }}</span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePrinterStore } from './stores/printer'

const router = useRouter()
const route = useRoute()
const printerStore = usePrinterStore()

const tabs = [
  { name: 'home', route: '/', icon: '🏠', label: 'Home' },
  { name: 'files', route: '/files', icon: '📁', label: 'Files' },
  { name: 'control', route: '/control', icon: '🎮', label: 'Control' },
  { name: 'settings', route: '/settings', icon: '⚙️', label: 'Settings' }
]

const isControlView = computed(() => route.path === '/control')
const isHomeView = computed(() => route.path === '/')

const position = computed(() => ({
  x: printerStore.status?.axis_x ?? 0,
  y: printerStore.status?.axis_y ?? 0,
  z: printerStore.status?.axis_z ?? 0
}))

const nozzleTemp = computed(() => ({
  current: Math.round(printerStore.status?.temp_nozzle ?? 0),
  target: Math.round(printerStore.status?.target_nozzle ?? 0)
}))

const bedTemp = computed(() => ({
  current: Math.round(printerStore.status?.temp_bed ?? 0),
  target: Math.round(printerStore.status?.target_bed ?? 0)
}))

function isActive(path: string): boolean {
  return route.path === path
}

function navigate(path: string) {
  router.push(path)
}

function goToSettings() {
  router.push('/settings')
}

function goToDebug() {
  router.push('/debug')
}
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  max-width: var(--display-width);
  max-height: var(--display-height);
  margin: 0 auto;
  background: var(--bg-primary);
  overflow: hidden;
}

/* Top Bar - 60px */
.top-bar {
  height: var(--touch-comfortable);
  min-height: var(--touch-comfortable);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--bg-tertiary);
  display: flex;
  align-items: center;
  padding: 0 var(--space-md);
}

.top-bar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.app-title {
  font-size: 24px;
  font-weight: bold;
  color: var(--prusa-orange);
  margin: 0;
}

/* Position Display (Compact) */
.position-compact {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.pos-item {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.pos-label {
  font-size: 12px;
  font-weight: bold;
  color: var(--text-secondary);
}

.pos-value {
  font-size: 14px;
  font-weight: bold;
  color: var(--prusa-orange);
  font-family: monospace;
  min-width: 40px;
}

/* Temperature Display (Compact) */
.temps-compact {
  display: flex;
  gap: var(--space-md);
  align-items: center;
}

.temp-item {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.temp-icon {
  font-size: 16px;
}

.temp-value {
  font-size: 14px;
  font-weight: bold;
  color: var(--text-primary);
}

.temp-separator {
  font-size: 12px;
  color: var(--text-tertiary);
}

.temp-target {
  font-size: 12px;
  font-weight: bold;
  color: var(--text-secondary);
}

.top-bar-actions {
  display: flex;
  gap: var(--space-xs);
}

.settings-btn {
  width: var(--touch-min);
  height: var(--touch-min);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--transition-fast);
}

.settings-btn:active {
  transform: scale(0.9);
}

.settings-icon {
  font-size: 24px;
}

/* Main Content - fills remaining space (360px on target display) */
.main-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Bottom Navigation - 60px */
.bottom-nav {
  height: var(--touch-comfortable);
  min-height: var(--touch-comfortable);
  background: var(--bg-secondary);
  border-top: 1px solid var(--bg-tertiary);
  display: flex;
  align-items: stretch;
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
  border-top: 3px solid transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: transform var(--transition-fast);
  font-family: inherit;
}

.nav-tab:active {
  transform: scale(0.95);
}

.nav-tab.active {
  border-top-color: var(--prusa-orange);
  color: var(--prusa-orange);
}

.nav-icon {
  font-size: 20px;
}

.nav-label {
  font-size: 12px;
  font-weight: 500;
}

/* GPU-accelerated slide transitions */
.slide-enter-active,
.slide-leave-active {
  transition: transform var(--transition-normal), opacity var(--transition-normal);
}

.slide-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}
</style>
