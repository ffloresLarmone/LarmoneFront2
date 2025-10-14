<script setup lang="ts">
import AppButton from '../atoms/AppButton.vue'

type OfferCard = {
  id: string
  title: string
  description: string
  highlight: string
  icon: string
}

const offers: OfferCard[] = [
  {
    id: 'bundles',
    title: 'Bundles personalizados',
    description: 'Combina tus favoritos y obtén hasta 25% de descuento en sets seleccionados.',
    highlight: 'Hasta -25%',
    icon: 'bi-gift',
  },
  {
    id: 'members',
    title: 'Club Larmone',
    description: 'Acumula puntos por cada compra y redímelos por productos exclusivos.',
    highlight: '+Doble puntos',
    icon: 'bi-stars',
  },
  {
    id: 'shipping',
    title: 'Envío express',
    description: 'Entrega en 24 horas en ciudades principales y muestras gratis en cada pedido.',
    highlight: 'Express 24h',
    icon: 'bi-truck',
  },
]
</script>

<template>
  <section id="ofertas" class="py-5 bg-light">
    <div class="container">
      <div class="text-center mb-5">
        <h2 class="section-title mb-3">Ofertas que te encantarán</h2>
        <p class="section-subtitle mb-0">Aprovecha beneficios exclusivos pensados para tus rituales de belleza.</p>
      </div>
      <div class="row g-4">
        <div v-for="offer in offers" :key="offer.id" class="col-12 col-md-4">
          <div class="card h-100 border-0 shadow-sm rounded-4 p-4">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <span class="badge bg-primary-subtle text-primary rounded-pill px-3 py-2">{{ offer.highlight }}</span>
              <i :class="['bi', offer.icon, 'fs-2 text-primary']" />
            </div>
            <h3 class="h5 fw-semibold mb-3">{{ offer.title }}</h3>
            <p class="text-muted mb-4">{{ offer.description }}</p>
            <AppButton variant="link" class="px-0 text-decoration-underline text-primary">Conoce más</AppButton>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
