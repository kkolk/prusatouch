import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

// Eagerly loaded (initial view)
import HomeView from '../views/HomeView.vue'

// Lazy loaded (code splitting)
const FilesView = () => import('../views/FilesView.vue')
const ControlView = () => import('../views/ControlView.vue')
const SettingsView = () => import('../views/SettingsView.vue')

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: 'Home' }
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
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
