<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import StatusBadge from './StatusBadge.vue'
import TemperatureDisplay from './TemperatureDisplay.vue'

interface Props {
  nozzleTemp: { current: number; target: number }
  bedTemp: { current: number; target: number }
  printerState: string
  isConnected: boolean
}

const props = defineProps<Props>()

const router = useRouter()

// Map printer state to StatusBadge type
const displayState = computed(() => {
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
  const state = props.printerState || 'DISCONNECTED'
  return STATE_LABELS[state] || state
})

// Navigate to settings
function goToSettings() {
  router.push('/settings')
}
</script>

<template>
  <header class="kiosk-header">
    <div class="header-content">
      <!-- Left: Logo + StatusBadge -->
      <div class="header-left">
        <img src="../assets/prusa-logo.svg" alt="Prusa" class="prusa-logo" />
        <StatusBadge :state="displayState" />
      </div>

      <!-- Center: Temperature Displays -->
      <div class="header-center">
        <TemperatureDisplay
          :current="nozzleTemp.current"
          :target="nozzleTemp.target"
          type="nozzle"
        />
        <TemperatureDisplay
          :current="bedTemp.current"
          :target="bedTemp.target"
          type="bed"
        />
      </div>

      <!-- Right: Connection Status + Settings Gear -->
      <div class="header-right">
        <div class="connection-status">
          <span
            class="connection-dot"
            :class="{ connected: isConnected }"
            :aria-label="isConnected ? 'Connected' : 'Offline'"
          ></span>
        </div>
        <button class="settings-btn" @click="goToSettings" aria-label="Settings">
          <span class="settings-icon">⚙️</span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.kiosk-header {
  height: var(--touch-comfortable);
  min-height: var(--touch-comfortable);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--bg-tertiary);
  display: flex;
  align-items: center;
  padding: 0 var(--space-md);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

/* Left column: Logo + StatusBadge */
.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  min-width: 180px;
}

.prusa-logo {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

/* Center column: Temperature Displays */
.header-center {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  justify-content: center;
  flex: 1;
}

/* Right column: Connection + Settings */
.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  min-width: 100px;
  justify-content: flex-end;
}

.connection-status {
  display: flex;
  align-items: center;
}

.connection-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--status-error);
  flex-shrink: 0;
}

.connection-dot.connected {
  background: var(--status-success);
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
  flex-shrink: 0;
}

.settings-btn:active {
  transform: scale(0.9);
}

.settings-icon {
  font-size: 24px;
}
</style>
