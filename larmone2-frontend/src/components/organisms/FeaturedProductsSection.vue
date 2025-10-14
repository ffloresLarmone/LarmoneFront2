<script setup lang="ts">
import AppButton from '../atoms/AppButton.vue'
import ProductCard from '../molecules/ProductCard.vue'
import { useFeaturedProducts } from '../../composables/useFeaturedProducts'
import type { ProductSummary } from '../../composables/useFeaturedProducts'

const emit = defineEmits<{
  (event: 'add-to-cart', product: ProductSummary): void
  (event: 'explore'): void
}>()

const { products, loading, error, hasProducts, reload } = useFeaturedProducts()

const handleAddToCart = (product: ProductSummary) => {
  emit('add-to-cart', product)
}

const handleExplore = () => {
  emit('explore')
}
</script>

<template>
  <section id="productos" class="py-5">
    <div class="container">
      <div class="text-center mb-5">
        <h2 class="section-title mb-3">Productos destacados</h2>
        <p class="section-subtitle mb-0">Cuidados esenciales seleccionados por nuestro equipo de beauty experts.</p>
      </div>

      <div v-if="loading" class="d-flex justify-content-center py-5">
        <div class="spinner-border text-primary" role="status" aria-live="polite">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>

      <div v-else-if="error" class="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
        <span>{{ error }}</span>
        <AppButton variant="outline-primary" size="sm" @click="reload">Reintentar</AppButton>
      </div>

      <div v-else-if="!hasProducts" class="text-center py-5">
        <h3 class="fw-semibold mb-3">Aún no tenemos productos para mostrar</h3>
        <p class="text-muted mb-4">Estamos preparando una selección irresistible para ti. Vuelve a intentar en unos minutos.</p>
        <AppButton size="lg" @click="handleExplore">Notificarme novedades</AppButton>
      </div>

      <div v-else class="row g-4">
        <div v-for="product in products" :key="product.id" class="col-12 col-md-6 col-xl-4">
          <ProductCard :product="product" @add-to-cart="handleAddToCart" />
        </div>
      </div>
    </div>
  </section>
</template>
