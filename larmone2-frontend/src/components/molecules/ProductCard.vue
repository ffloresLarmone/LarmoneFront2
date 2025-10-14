<script setup lang="ts">
import AppButton from '../atoms/AppButton.vue'
import type { ProductSummary } from '../../composables/useFeaturedProducts'

defineProps<{
  product: ProductSummary
}>()

const emit = defineEmits<{ (event: 'add-to-cart', product: ProductSummary): void }>()

const handleAdd = (product: ProductSummary) => {
  emit('add-to-cart', product)
}
</script>

<template>
  <div class="card h-100 card-shadow overflow-hidden">
    <div class="position-relative overflow-hidden">
      <img :src="product.image" :alt="product.name" class="card-img-top product-image" loading="lazy" />
      <div class="position-absolute top-0 start-0 m-3 d-flex gap-2">
        <span v-for="tag in product.tags" :key="tag" class="badge badge-soft rounded-pill px-3 py-2">{{ tag }}</span>
      </div>
    </div>
    <div class="card-body d-flex flex-column">
      <h5 class="card-title fw-semibold">{{ product.name }}</h5>
      <p class="card-text text-muted small flex-grow-1">{{ product.description }}</p>
      <div class="d-flex align-items-center justify-content-between mt-3">
        <span class="fw-bold fs-5 text-primary">${{ product.price.toFixed(2) }}</span>
        <AppButton size="sm" @click="handleAdd(product)">
          <i class="bi bi-bag-plus me-2" /> Añadir
        </AppButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-image {
  height: 240px;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.card:hover .product-image {
  transform: scale(1.05);
}
</style>
