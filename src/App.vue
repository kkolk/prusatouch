<template>
  <div class="app">
    <!-- Offline Banner -->
    <OfflineBanner
      :visible="!printerStore.isConnected && printerStore.connection.retryCount > 0"
      :retry-count="printerStore.connection.retryCount"
      @retry="handleRetryConnection"
    />

    <!-- Kiosk Header -->
    <KioskHeader
      :nozzle-temp="nozzleTemp"
      :bed-temp="bedTemp"
      :printer-state="printerStore.status?.state || 'DISCONNECTED'"
      :is-connected="printerStore.isConnected"
    />

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

    <!-- Toast Notifications -->
    <Toast
      v-for="toast in notificationsStore.toasts"
      :key="toast.id"
      :visible="true"
      :message="toast.message"
      :type="toast.type"
      :duration="toast.duration"
      @close="notificationsStore.removeToast(toast.id)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePrinterStore } from './stores/printer'
import { useNotificationsStore } from './stores/notifications'
import OfflineBanner from './components/OfflineBanner.vue'
import KioskHeader from './components/KioskHeader.vue'
import Toast from './components/Toast.vue'

const router = useRouter()
const route = useRoute()
const printerStore = usePrinterStore()
const notificationsStore = useNotificationsStore()

// Fetch printer info once on app mount (before any components use it)
onMounted(async () => {
  await Promise.all([
    printerStore.fetchPrinterInfo(),
    printerStore.fetchVersion()
  ])
})

// User-friendly state labels for status display
const STATE_LABELS: Record<string, string> = {
  'IDLE': 'Idle',
  'PRINTING': 'Printing',
  'PAUSED': 'Paused',
  'FINISHED': 'Complete',
  'STOPPED': 'Stopped',
  'ERROR': 'Error',
  'READY': 'Ready',
  'BUSY': 'Busy',
  'ATTENTION': 'Attention',
  'DISCONNECTED': 'Offline'
}

const tabs = [
  { name: 'home', route: '/', icon: '🏠', label: 'Home' },
  { name: 'files', route: '/files', icon: '📁', label: 'Files' },
  { name: 'control', route: '/control', icon: '🎮', label: 'Control' },
  { name: 'settings', route: '/settings', icon: '⚙️', label: 'Settings' }
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

function handleRetryConnection() {
  printerStore.fetchStatus()
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

/* Main Content - fills remaining space (360px on target display) */
.main-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Bottom Navigation - 60px */
.bottom-nav {
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
