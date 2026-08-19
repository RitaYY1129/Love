import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './style.css'
import { initTheme } from './theme'
import { useAuthStore } from './stores/auth'

initTheme()
const app = createApp(App)

app.use(createPinia())
app.use(router)

// 启动时从本地恢复登录态，避免每次进入都要求重新登录
const authStore = useAuthStore()
authStore.init()

app.mount('#app')

// 禁用 PWA Service Worker：旧版本缓存了错误 base 的 index.html，导致白屏。
// 先彻底卸载所有已注册 Worker，保证后续访问永远加载最新线上版本。
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => registration.unregister())
  })
}
