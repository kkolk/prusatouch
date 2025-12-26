import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

// Lazy loaded (code splitting)
const StatusView = () => import('../views/StatusView.vue')
const FilesView = () => import('../views/FilesView.vue')
const ControlView = () => import('../views/ControlView.vue')
const SettingsView = () => import('../views/SettingsView.vue')

export const routes: RouteRecordRaw[] = [
  {
    path: '/status',
    name: 'status',
    component: StatusView,
    meta: { title: 'Status' }
  },
  {
    path: '/',
    redirect: '/status'
  },
  {
    path: '/files',
    name: 'files',
    component: FilesView,
    meta: { title: 'Files' }
  },
  {
    path: '/control',
    name: 'control',
    component: ControlView,
    meta: { title: 'Control' }
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView,
    meta: { title: 'Settings' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/status'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
