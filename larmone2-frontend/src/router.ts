import { createRouter, createWebHistory } from 'vue-router'
import HomePage from './pages/HomePage.vue'
import LoginPage from './pages/LoginPage.vue'

import ProductsPage from './pages/ProductsPage.vue'
import ProductDetailPage from './pages/ProductDetailPage.vue'
import CheckoutSummaryPage from './pages/CheckoutSummaryPage.vue'
import CheckoutShippingPage from './pages/CheckoutShippingPage.vue'
import CheckoutPaymentPage from './pages/CheckoutPaymentPage.vue'
import CheckoutResultPage from './pages/CheckoutResultPage.vue'
import UserProfilePage from './pages/UserProfilePage.vue'
import AdminDashboardPage from './pages/AdminDashboardPage.vue'

const routes = [
  { path: '/', redirect: '/productos' },
  { path: '/productos', name: 'products', component: ProductsPage },
  { path: '/productos/:id', name: 'product-detail', component: ProductDetailPage, props: true },
  { path: '/', name: 'home', component: HomePage },
  { path: '/login', name: 'login', component: LoginPage },
  { path: '/checkout/resumen', name: 'checkout-summary', component: CheckoutSummaryPage },
  { path: '/checkout/envio', name: 'checkout-shipping', component: CheckoutShippingPage },
  { path: '/checkout/pago', name: 'checkout-payment', component: CheckoutPaymentPage },
  {
    path: '/checkout/resultado/:status',
    name: 'checkout-result',
    component: CheckoutResultPage,
    props: (route) => ({ status: route.params.status === 'success' ? 'success' : 'failure' }),
  },
  { path: '/perfil', name: 'profile', component: UserProfilePage },
  {
    path: '/aurora/atelier',
    name: 'admin-dashboard',
    component: AdminDashboardPage,
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
