import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useCartStore } from './stores/cart'
import './style.css'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

const cartStore = useCartStore(pinia)
cartStore.ensureCartLoaded()
cartStore.fetchCart().catch(() => {
  // En entornos sin sesión iniciada podemos ignorar el error inicial
})

app.mount('#app')
