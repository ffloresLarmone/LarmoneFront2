import { createRouter, createWebHistory } from 'vue-router'
import Home from './pages/Home.vue'
import Login from './pages/Login.vue'

import Products from './pages/Products.vue'
import ProductDetail from './pages/ProductDetail.vue'
import CheckoutSummary from './pages/CheckoutSummary.vue'
import CheckoutShipping from './pages/CheckoutShipping.vue'
import CheckoutPayment from './pages/CheckoutPayment.vue'
import CheckoutResult from './pages/CheckoutResult.vue'
import UserProfile from './pages/UserProfile.vue'
import AdminDashboard from './pages/AdminDashboard.vue'

const routes = [
  { path: '/', redirect: '/productos' },
  { path: '/productos', name: 'products', component: Products },
  { path: '/productos/:id', name: 'product-detail', component: ProductDetail, props: true },
  { path: '/', name: 'home', component: Home },
  { path: '/login', name: 'login', component: Login },
  { path: '/checkout/resumen', name: 'checkout-summary', component: CheckoutSummary },
  { path: '/checkout/envio', name: 'checkout-shipping', component: CheckoutShipping },
  { path: '/checkout/pago', name: 'checkout-payment', component: CheckoutPayment },
  {
    path: '/checkout/resultado/:status',
    name: 'checkout-result',
    component: CheckoutResult,
    props: (route) => ({ status: route.params.status === 'success' ? 'success' : 'failure' }),
  },
  { path: '/perfil', name: 'profile', component: UserProfile },
  {
    path: '/aurora/atelier',
    name: 'admin-dashboard',
    component: AdminDashboard,
    meta: { requiresAdmin: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
