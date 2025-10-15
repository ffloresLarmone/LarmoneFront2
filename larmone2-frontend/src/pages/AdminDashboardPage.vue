<script setup lang="ts">
const upcomingFeatures = [
  'Gestión de catálogo',
  'Control de inventario',
  'Panel de analíticas',
]
</script>

<template>
  <section class="admin-page d-flex align-items-center justify-content-center text-center text-white">
    <div class="content p-5 rounded-4 shadow-lg">
      <p class="badge text-bg-light text-uppercase mb-4">Acceso restringido</p>
      <h1 class="display-6 fw-bold mb-3">Panel de administración</h1>
      <p class="lead mb-4">
        Esta es una entrada reservada para el equipo de Larmone. Más adelante podrás gestionar cada detalle de la
        experiencia de nuestros clientes desde aquí.
      </p>
      <div class="d-flex flex-column gap-2">
        <p class="small text-uppercase opacity-75 mb-1">Próximamente:</p>
        <ul class="list-unstyled mb-0">
          <li v-for="feature in upcomingFeatures" :key="feature" class="opacity-75">• {{ feature }}</li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.admin-page {
  min-height: calc(100vh - 88px);
  background: radial-gradient(circle at top left, #1f1b2c, #121018 65%);
  padding: 2rem;
}

.content {
  max-width: 520px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.15);
}
</style>
