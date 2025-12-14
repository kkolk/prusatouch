<script setup lang="ts">
import { computed } from 'vue'
import { useDebugLogStore } from '../stores/debugLog'
import TouchButton from '../components/TouchButton.vue'

const debugLog = useDebugLogStore()

// Reverse logs to show newest first
const reversedLogs = computed(() => {
  return [...debugLog.logs].reverse()
})

// Get status class for color coding
function getStatusClass(status: number | null): string {
  if (status === null) return 'status-pending'
  if (status >= 200 && status < 300) return 'status-success'
  return 'status-error'
}

// Format timestamp for display
function formatTimestamp(timestamp: Date): string {
  const hours = timestamp.getHours().toString().padStart(2, '0')
  const minutes = timestamp.getMinutes().toString().padStart(2, '0')
  const seconds = timestamp.getSeconds().toString().padStart(2, '0')
  const millis = timestamp.getMilliseconds().toString().padStart(3, '0')
  return `${hours}:${minutes}:${seconds}.${millis}`
}

function handleClearLogs() {
  debugLog.clearLogs()
}
</script>

<template>
  <div class="debug-view">
    <div class="debug-header">
      <h1>API Debug Log</h1>
      <TouchButton
        variant="secondary"
        @click="handleClearLogs"
        data-testid="clear-logs-button"
      >
        Clear Logs
      </TouchButton>
    </div>

    <div v-if="debugLog.logs.length === 0" class="empty-state">
      <p>No logs yet</p>
      <p class="hint">API requests and responses will appear here</p>
    </div>

    <div v-else class="log-list">
      <div
        v-for="(log, index) in reversedLogs"
        :key="index"
        class="log-entry"
        :class="getStatusClass(log.status)"
      >
        <div class="log-header">
          <span class="log-time">{{ formatTimestamp(log.timestamp) }}</span>
          <span class="log-method">{{ log.method }}</span>
          <span v-if="log.status" class="log-status">{{ log.status }}</span>
          <span v-else class="log-status">PENDING</span>
        </div>
        <div class="log-endpoint">{{ log.endpoint }}</div>
        <div v-if="log.error" class="log-error">{{ log.error }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.debug-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--space-md);
  gap: var(--space-md);
  overflow: hidden;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.debug-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: var(--text-primary);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  color: var(--text-secondary);
}

.empty-state p {
  margin: 0;
  font-size: 18px;
}

.empty-state .hint {
  font-size: 14px;
  color: var(--text-tertiary);
}

.log-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.log-entry {
  padding: var(--space-sm);
  background: var(--bg-secondary);
  border-left: 4px solid transparent;
  border-radius: var(--radius-md);
  font-family: monospace;
  font-size: 12px;
}

.log-entry.status-success {
  border-left-color: #4caf50;
}

.log-entry.status-error {
  border-left-color: #f44336;
}

.log-entry.status-pending {
  border-left-color: #ff9800;
}

.log-header {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-xs);
  font-weight: bold;
}

.log-time {
  color: var(--text-tertiary);
  min-width: 90px;
}

.log-method {
  color: var(--prusa-orange);
  min-width: 50px;
}

.log-status {
  color: var(--text-secondary);
}

.log-entry.status-success .log-status {
  color: #4caf50;
}

.log-entry.status-error .log-status {
  color: #f44336;
}

.log-entry.status-pending .log-status {
  color: #ff9800;
}

.log-endpoint {
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
  word-break: break-all;
}

.log-error {
  color: #f44336;
  margin-top: var(--space-xs);
  padding: var(--space-xs);
  background: rgba(244, 67, 54, 0.1);
  border-radius: var(--radius-sm);
}
</style>
