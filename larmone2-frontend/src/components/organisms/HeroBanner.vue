<script setup lang="ts">
import AppButton from '../atoms/AppButton.vue'

const emit = defineEmits<{ (event: 'cta'): void }>()

const handleClick = () => {
  emit('cta')
}
</script>

<template>
  <section class="hero position-relative overflow-hidden py-5 py-lg-5">
    <div class="container py-5">
      <div class="row align-items-center g-5">
        <div class="col-lg-6">
          <span class="badge badge-soft rounded-pill px-3 py-2 mb-3">Nueva colección</span>
          <h1 class="display-5 fw-bold mb-4 text-capitalize">Ilumina tu belleza con Larmone</h1>
          <p class="lead text-muted mb-4">
            Descubre cosméticos premium diseñados para cuidar tu piel y resaltar tu estilo. Ingredientes limpios,
            tonos vibrantes y texturas irresistibles.
          </p>
          <div class="d-flex gap-3 flex-column flex-sm-row">
            <AppButton label="Explorar novedades" size="lg" @click="handleClick" />
            <AppButton variant="outline-light" size="lg" class="border border-2" @click="handleClick">
              Ver catálogo
            </AppButton>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="hero-visual mx-auto shadow-lg">
            <div class="hero-glow" />
            <div class="hero-card card card-shadow p-4">
              <h3 class="fw-semibold">Brillo radiante</h3>
              <p class="text-muted mb-4">Rutinas personalizadas que equilibran tu piel y elevan tu maquillaje.</p>
              <ul class="list-unstyled mb-0 small text-muted">
                <li class="d-flex align-items-center gap-2 mb-2">
                  <i class="bi bi-check-circle-fill text-success" /> Fórmulas sin crueldad
                </li>
                <li class="d-flex align-items-center gap-2 mb-2">
                  <i class="bi bi-check-circle-fill text-success" /> Pigmentos de alta duración
                </li>
                <li class="d-flex align-items-center gap-2">
                  <i class="bi bi-check-circle-fill text-success" /> Envío gratuito desde $50 USD
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  background: linear-gradient(140deg, rgba(233, 30, 99, 0.08), rgba(140, 79, 185, 0.12));
}

.hero-visual {
  position: relative;
  max-width: 420px;
}

.hero-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 20%, rgba(233, 30, 99, 0.35), transparent 60%);
  filter: blur(40px);
  transform: translateY(-20px);
}

.hero-card {
  position: relative;
  border-radius: var(--radius-lg);
  backdrop-filter: blur(4px);
}
</style>
