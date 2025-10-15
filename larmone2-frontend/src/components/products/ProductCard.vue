<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import type { Producto } from '../../types/api'
import { useCartStore } from '../../stores/cart'
import { useToast } from '../../composables/useToast'

const props = defineProps<{
  producto: Producto
}>()

const router = useRouter()
const cartStore = useCartStore()
const { loading: cartLoading } = storeToRefs(cartStore)
const { showToast } = useToast()

const mainImage = computed(() => {
  if (!props.producto.imagenes?.length) {
    return 'https://placehold.co/400x300/FBE7F5/8C4FB9?text=Sin+imagen'
  }
  const principal = props.producto.imagenes.find((img) => img.principal)
  return principal?.url_publica ?? props.producto.imagenes[0].url_publica
})

function goToDetail() {
  router.push({ name: 'product-detail', params: { id: props.producto.id_producto } })
}

async function onAddToCart() {
  try {
    await cartStore.addItem({
      id_variante: props.producto.id_producto,
      cantidad: 1,
      precio_unitario: props.producto.precio ?? 0,
      nombre: props.producto.nombre,
      imagen: mainImage.value,
    })

    if (cartStore.error) {
      showToast({
        title: 'Carrito sincronizado parcialmente',
        message: cartStore.error,
        variant: 'warning',
      })
    } else {
      showToast({
        title: 'Producto agregado',
        message: `${props.producto.nombre} ya está en tu carrito.`,
        variant: 'success',
      })
    }

    cartStore.openDrawer()
  } catch (error) {
    showToast({
      title: 'No pudimos agregarlo',
      message:
        cartStore.error ??
        (error instanceof Error
          ? error.message
          : 'Intenta nuevamente, ocurrió un inconveniente al actualizar tu carrito.'),
      variant: 'danger',
    })
  }
}
</script>

<template>
  <div class="product-card h-100 d-flex flex-column" role="article">
    <div class="product-image-wrapper" @click="goToDetail">
      <img :src="mainImage" :alt="producto.nombre" class="product-image" />
    </div>
    <div class="product-body d-flex flex-column flex-grow-1">
      <h5 class="product-title mb-1">{{ producto.nombre }}</h5>
      <small class="text-muted">SKU: {{ producto.sku }}</small>
      <div class="mt-2 flex-grow-1">
        <span class="badge status-pill" :class="producto.activo ? 'status-available' : 'status-unavailable'">
          {{ producto.activo ? 'Disponible' : 'No disponible' }}
        </span>
      </div>
      <button
        class="btn btn-brand mt-3 w-100 d-inline-flex align-items-center justify-content-center gap-2"
        type="button"
        @click="onAddToCart"
        :disabled="cartLoading"
      >
        <i class="bi bi-bag-plus me-2" aria-hidden="true"></i>
        Agregar al carrito
      </button>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  background: linear-gradient(160deg, rgba(233, 30, 99, 0.08), rgba(140, 79, 185, 0.08));
  border: 1px solid rgba(140, 79, 185, 0.15);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  box-shadow: var(--shadow-soft);
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px -24px rgba(140, 79, 185, 0.35);
}

.product-image-wrapper {
  position: relative;
  padding-top: 65%;
  cursor: pointer;
  overflow: hidden;
}

.product-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-image-wrapper:hover .product-image {
  transform: scale(1.05);
}

.product-body {
  padding: 1.25rem;
  color: var(--neutral-700);
}

.product-title {
  color: var(--neutral-900);
  font-weight: 600;
}

.status-pill {
  border-radius: var(--radius-pill);
  padding: 0.35rem 0.75rem;
  font-weight: 500;
}

.status-available {
  background-color: rgba(59, 178, 115, 0.18);
  color: #1b7a48;
}

.status-unavailable {
  background-color: rgba(108, 93, 115, 0.18);
  color: rgba(108, 93, 115, 0.9);
}

.btn-brand:disabled {
  opacity: 0.7;
}
</style>
