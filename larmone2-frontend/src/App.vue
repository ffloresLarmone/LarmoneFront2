<template>
  <div class="app-wrapper d-flex flex-column min-vh-100">
    <header class="app-header py-3">
      <div class="container d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div class="brand d-flex align-items-center gap-2">
          <span class="brand-mark" aria-hidden="true">L</span>
          <div>
            <h1 class="brand-name mb-0">Larmone 2.0</h1>
            <p class="brand-tagline mb-0">Elegancia que acompaña cada momento</p>
          </div>
        </div>
        <nav class="nav gap-2">
          <RouterLink class="nav-link" :to="{ name: 'products' }">Productos</RouterLink>
        </nav>
      </div>
    </header>

    <main class="flex-grow-1">
      <RouterView />
    </main>

    <footer class="app-footer py-4">
      <div class="container text-center">
        <small class="text-muted">© {{ new Date().getFullYear() }} Larmone. Todos los derechos reservados.</small>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<style scoped>
.app-wrapper {
  background: radial-gradient(circle at 0% 0%, rgba(255, 240, 227, 0.9), rgba(255, 248, 242, 0.9));
}

.app-header {
  background: linear-gradient(135deg, rgba(214, 158, 126, 0.95), rgba(255, 221, 200, 0.85));
  box-shadow: 0 8px 26px -18px rgba(112, 65, 47, 0.9);
}

.brand-mark {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #9e4e2b, #d98957);
  color: #fff;
  font-weight: 700;
  font-size: 1.5rem;
  display: grid;
  place-items: center;
  box-shadow: 0 10px 24px -16px rgba(158, 78, 43, 0.9);
}

.brand-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #542d1c;
}

.brand-tagline {
  color: #7a4f39;
  font-size: 0.9rem;
}

.nav-link {
  border-radius: 999px;
  padding: 0.5rem 1.25rem;
  font-weight: 600;
  color: #5a2f1a;
  text-decoration: none;
  background-color: rgba(255, 255, 255, 0.45);
  transition: background 0.2s ease, color 0.2s ease;
}

.nav-link.router-link-exact-active,
.nav-link:hover {
  color: #fff;
  background: linear-gradient(145deg, #b76532, #d98a54);
}

.app-footer {
  background: rgba(255, 240, 228, 0.75);
}
</style>
<script setup lang="ts">
import AppShell from './components/templates/AppShell.vue'
</script>

<template>
  <AppShell />
</template>
