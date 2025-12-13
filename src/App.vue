<template>
  <div class="app">
    <!-- Top Bar -->
    <header class="top-bar">
      <div class="top-bar-content">
        <h1 class="app-title">PrusaTouch</h1>
        <button class="settings-btn" @click="goToSettings" aria-label="Settings">
          <span class="settings-icon">⚙️</span>
        </button>
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
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const tabs = [
  { name: 'home', route: '/', icon: '🏠', label: 'Home' },
  { name: 'files', route: '/files', icon: '📁', label: 'Files' },
  { name: 'control', route: '/control', icon: '🎮', label: 'Control' },
  { name: 'settings', route: '/settings', icon: '⚙️', label: 'Settings' }
]

function isActive(path: string): boolean {
  return route.path === path
}

function navigate(path: string) {
  router.push(path)
}

function goToSettings() {
  router.push('/settings')
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
