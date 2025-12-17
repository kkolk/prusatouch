<script setup lang="ts">
interface Props {
  visible: boolean
  retryCount?: number
}

withDefaults(defineProps<Props>(), {
  retryCount: 0
})

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <Transition name="banner">
    <div v-if="visible" class="offline-banner">
      <div class="banner-content">
        <span class="banner-icon">⚠</span>
        <div class="banner-text">
          <span class="banner-title">Connection Lost</span>
          <span class="banner-subtitle">
            Attempting to reconnect{{ retryCount > 0 ? ` (attempt ${retryCount})` : '' }}...
          </span>
        </div>
      </div>
      <button class="banner-retry" @click="emit('retry')">
        Retry Now
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.offline-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: var(--status-warning);
  color: var(--bg-primary);
  padding: var(--space-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  z-index: 2500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.banner-content {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex: 1;
}

.banner-icon {
  font-size: 24px;
  line-height: 1;
}

.banner-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.banner-title {
  font-size: 16px;
  font-weight: bold;
}

.banner-subtitle {
  font-size: 14px;
  opacity: 0.9;
}

.banner-retry {
  min-height: var(--touch-min);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-primary);
  color: var(--status-warning);
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: transform var(--transition-fast);
  font-family: inherit;
}

.banner-retry:active {
  transform: scale(0.95);
}

/* Transition animations - GPU-accelerated */
.banner-enter-active,
.banner-leave-active {
  transition: transform var(--transition-normal), opacity var(--transition-normal);
}

.banner-enter-from,
.banner-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
