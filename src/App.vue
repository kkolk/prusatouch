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
    <KioskNav />

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
import { usePrinterStore } from './stores/printer'
import { useNotificationsStore } from './stores/notifications'
import OfflineBanner from './components/OfflineBanner.vue'
import KioskHeader from './components/KioskHeader.vue'
import KioskNav from './components/KioskNav.vue'
import Toast from './components/Toast.vue'

const printerStore = usePrinterStore()
const notificationsStore = useNotificationsStore()

// Fetch printer info once on app mount (before any components use it)
onMounted(async () => {
  await Promise.all([
    printerStore.fetchPrinterInfo(),
    printerStore.fetchVersion()
  ])
})

const nozzleTemp = computed(() => ({
  current: Math.round(printerStore.status?.temp_nozzle ?? 0),
  target: Math.round(printerStore.status?.target_nozzle ?? 0)
}))

const bedTemp = computed(() => ({
  current: Math.round(printerStore.status?.temp_bed ?? 0),
  target: Math.round(printerStore.status?.target_bed ?? 0)
}))

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
