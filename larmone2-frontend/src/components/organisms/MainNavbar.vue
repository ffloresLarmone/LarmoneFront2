<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import SearchBar from '../molecules/SearchBar.vue'
import { useAuthStore } from '../../stores/auth'
import { useCheckoutStore } from '../../stores/checkout'

interface NavLinkItem {
  label: string
  to: { path: string; hash?: string }
}

const emit = defineEmits<{ (event: 'search', query: string): void }>()

const authStore = useAuthStore()
const checkoutStore = useCheckoutStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)
const userEmail = computed(() => authStore.user?.email ?? '')

const links: NavLinkItem[] = [
  { label: 'Inicio', to: { path: '/' } },
  { label: 'Productos', to: { path: '/', hash: '#productos' } },
  { label: 'Ofertas', to: { path: '/', hash: '#ofertas' } },
]

const handleSearch = (query: string) => {
  emit('search', query)
}

const handleLogout = () => {
  authStore.logout()
  checkoutStore.clear()
}
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
    <div class="container py-2">
      <RouterLink class="navbar-brand fw-bold text-uppercase text-gradient" to="/">
        <span class="text-primary">Larmone</span> Beauty
      </RouterLink>
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#mainNavbar"
        aria-controls="mainNavbar"
        aria-expanded="false"
        aria-label="Alternar navegación"
      >
        <span class="navbar-toggler-icon" />
      </button>
      <div class="collapse navbar-collapse" id="mainNavbar">
        <ul class="navbar-nav me-auto mb-3 mb-lg-0">
          <li v-for="link in links" :key="link.label" class="nav-item">
            <RouterLink
              class="nav-link fw-semibold"
              :to="link.to"
              active-class="text-primary"
              exact-active-class="text-primary"
            >
              {{ link.label }}
            </RouterLink>
          </li>
        </ul>
        <div class="d-flex flex-column flex-lg-row gap-3 align-items-lg-center ms-lg-4 w-100 w-lg-auto">
          <SearchBar class="flex-grow-1" @search="handleSearch" />
          <RouterLink
            v-if="!isAuthenticated"
            to="/login"
            class="btn btn-outline-dark fw-semibold px-4"
          >
            Iniciar Sesión
          </RouterLink>
          <div v-else class="d-flex align-items-center gap-3">
            <span class="small text-muted">{{ userEmail }}</span>
            <button type="button" class="btn btn-outline-dark fw-semibold px-4" @click="handleLogout">
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.text-gradient {
  background: linear-gradient(120deg, var(--brand-primary), var(--brand-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>
