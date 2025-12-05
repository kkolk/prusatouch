<template>
  <button
    class="touch-button"
    :class="[
      `touch-button--${variant}`,
      `touch-button--${size}`,
      { 'touch-button--loading': loading }
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="spinner"></span>
    <span v-else class="touch-button__content">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'medium' | 'large'
  loading?: boolean
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'medium',
  loading: false,
  disabled: false
})

const emit = defineEmits<{
  click: []
}>()

function handleClick() {
  emit('click')
}
</script>

<style scoped>
.touch-button {
  min-height: var(--touch-comfortable);
  padding: 15px 30px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: transform var(--transition-fast);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  font-family: inherit;
}

/* GPU-accelerated active state - ONLY transform (no width/height/top/left/color changes) */
.touch-button:active:not(:disabled) {
  transform: scale(0.95);
}

.touch-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Variant: Primary */
.touch-button--primary {
  background: var(--prusa-orange);
  color: white;
}

.touch-button--primary:hover:not(:disabled) {
  background: var(--prusa-orange-hover);
}

.touch-button--primary:active:not(:disabled) {
  background: var(--prusa-orange-active);
}

/* Variant: Secondary */
.touch-button--secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.touch-button--secondary:hover:not(:disabled) {
  background: var(--bg-tertiary);
}

/* Variant: Danger */
.touch-button--danger {
  background: var(--status-error);
  color: white;
}

.touch-button--danger:hover:not(:disabled) {
  background: #ff0000;
}

/* Size: Large */
.touch-button--large {
  min-height: var(--touch-large);
  font-size: 20px;
  padding: 20px 40px;
}

/* Loading spinner - GPU-accelerated with transform only */
.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.touch-button__content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
}
</style>
