import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './styles/global.css'

const pinia = createPinia()
const app = createApp({
  template: `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; padding: 20px;">
      <h1 style="color: var(--prusa-orange); font-size: 48px; margin-bottom: 20px;">PrusaTouch</h1>
      <p style="color: var(--text-secondary); font-size: 20px;">Touch-optimized interface for PrusaLink</p>
    </div>
  `
})

app.use(pinia)
app.mount('#app')
