import { createRouter, createWebHistory } from 'vue-router'

// Importa tus vistas
import Home from '../pages/Home.vue'
import Login from '../pages/Login.vue'

// Configura las rutas principales
const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/login', name: 'login', component: Login },
  // Puedes agregar más rutas aquí:
  // { path: '/productos', component: () => import('../pages/ProductosList.vue') }
]

// Crea la instancia del router
const router = createRouter({
  history: createWebHistory(), // usa el modo de historial HTML5
  routes,
})

export default router
