import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/global.css'
import { initAuthFromEnv } from './api/auth'

// Initialize auth from environment variables
initAuthFromEnv()

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)
app.mount('#app')
