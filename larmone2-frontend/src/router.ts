import { createRouter, createWebHistory } from 'vue-router'

import ProductsPage from './pages/ProductsPage.vue'
import ProductDetailPage from './pages/ProductDetailPage.vue'

const routes = [
  { path: '/', redirect: '/productos' },
  { path: '/productos', name: 'products', component: ProductsPage },
  { path: '/productos/:id', name: 'product-detail', component: ProductDetailPage, props: true },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
