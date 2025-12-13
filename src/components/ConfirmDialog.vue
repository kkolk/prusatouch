<script setup lang="ts">
interface Props {
  visible: boolean
  title: string
  message: string
  variant?: 'default' | 'danger'
  confirmText?: string
  cancelText?: string
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  confirmText: 'Confirm',
  cancelText: 'Cancel'
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  emit('cancel')
}

function handleBackdropClick() {
  emit('cancel')
}

function handleDialogClick(event: Event) {
  // Prevent backdrop click from closing when clicking dialog content
  event.stopPropagation()
}
</script>

<template>
  <Transition name="dialog">
    <div v-if="visible" class="confirm-dialog">
      <!-- Backdrop -->
      <div class="dialog-backdrop" @click="handleBackdropClick"></div>

      <!-- Dialog content -->
      <div class="dialog-content" @click="handleDialogClick">
        <!-- Title -->
        <h2 class="dialog-title">{{ title }}</h2>

        <!-- Message -->
        <p class="dialog-message">{{ message }}</p>

        <!-- Actions -->
        <div class="dialog-actions">
          <button
            class="btn btn-cancel"
            @click="handleCancel"
          >
            {{ cancelText }}
          </button>
          <button
            class="btn btn-confirm"
            :class="{ 'btn-danger': variant === 'danger' }"
            @click="handleConfirm"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.confirm-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-overlay);
  cursor: pointer;
}

.dialog-content {
  position: relative;
  width: 90%;
  max-width: 400px;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  z-index: 2001;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.dialog-title {
  margin: 0 0 var(--space-md) 0;
  font-size: 22px;
  font-weight: bold;
  color: var(--text-primary);
}

.dialog-message {
  margin: 0 0 var(--space-lg) 0;
  font-size: 16px;
  line-height: 1.5;
  color: var(--text-secondary);
}

.dialog-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
}

.btn {
  min-height: var(--touch-comfortable);
  padding: 12px 24px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: transform var(--transition-fast);
  font-family: inherit;
}

/* GPU-accelerated active state */
.btn:active {
  transform: scale(0.95);
}

.btn-cancel {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-cancel:hover {
  background: var(--bg-quaternary, #444);
}

.btn-confirm {
  background: var(--prusa-orange);
  color: white;
}

.btn-confirm:hover {
  background: var(--prusa-orange-hover);
}

.btn-danger {
  background: var(--status-error);
}

.btn-danger:hover {
  background: #ff0000;
}

/* Transition animations - GPU-accelerated */
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity var(--transition-normal);
}

.dialog-enter-active .dialog-backdrop,
.dialog-leave-active .dialog-backdrop {
  transition: opacity var(--transition-normal);
}

.dialog-enter-active .dialog-content,
.dialog-leave-active .dialog-content {
  transition: transform var(--transition-normal), opacity var(--transition-normal);
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .dialog-backdrop,
.dialog-leave-to .dialog-backdrop {
  opacity: 0;
}

.dialog-enter-from .dialog-content,
.dialog-leave-to .dialog-content {
  transform: scale(0.9);
  opacity: 0;
}
</style>
