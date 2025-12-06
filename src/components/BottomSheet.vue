<script setup lang="ts">
interface Props {
  visible: boolean
  title: string
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

function handleBackdropClick() {
  emit('close')
}

function handleContentClick(event: Event) {
  // Prevent backdrop click from closing when clicking sheet content
  event.stopPropagation()
}
</script>

<template>
  <Transition name="sheet">
    <div v-if="visible" class="bottom-sheet">
      <!-- Backdrop -->
      <div class="backdrop" @click="handleBackdropClick"></div>

      <!-- Sheet content -->
      <div class="sheet-content" @click="handleContentClick">
        <!-- Header -->
        <div class="sheet-header">
          <h2 class="sheet-title">{{ title }}</h2>
        </div>

        <!-- Body (slot) -->
        <div class="sheet-body">
          <slot></slot>
        </div>

        <!-- Actions (slot) -->
        <div v-if="$slots.actions" class="sheet-actions">
          <slot name="actions"></slot>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.bottom-sheet {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-overlay);
  cursor: pointer;
}

.sheet-content {
  position: relative;
  width: 100%;
  max-height: 80vh;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  overflow-y: auto;
  z-index: 1001;
}

.sheet-header {
  padding: var(--space-md) var(--space-md) var(--space-sm);
  border-bottom: 1px solid var(--bg-tertiary);
}

.sheet-title {
  margin: 0;
  font-size: 20px;
  font-weight: bold;
  color: var(--text-primary);
}

.sheet-body {
  padding: var(--space-md);
  color: var(--text-secondary);
}

.sheet-actions {
  padding: var(--space-md);
  display: flex;
  gap: var(--space-md);
  border-top: 1px solid var(--bg-tertiary);
}

/* Transition animations - GPU-accelerated */
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity var(--transition-slow);
}

.sheet-enter-active .backdrop,
.sheet-leave-active .backdrop {
  transition: opacity var(--transition-slow);
}

.sheet-enter-active .sheet-content,
.sheet-leave-active .sheet-content {
  transition: transform var(--transition-slow);
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from .backdrop,
.sheet-leave-to .backdrop {
  opacity: 0;
}

.sheet-enter-from .sheet-content,
.sheet-leave-to .sheet-content {
  transform: translateY(100%);
}
</style>
