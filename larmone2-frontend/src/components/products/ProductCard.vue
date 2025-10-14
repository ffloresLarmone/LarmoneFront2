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
    return 'https://placehold.co/400x300/FFE5D9/663C2C?text=Sin+imagen'
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
        <span class="badge" :class="producto.activo ? 'bg-success-soft' : 'bg-secondary-soft'">
          {{ producto.activo ? 'Disponible' : 'No disponible' }}
        </span>
      </div>
      <button class="btn btn-accent mt-3 w-100" type="button" @click="onAddToCart" :disabled="cartLoading">
        <i class="bi bi-bag-plus me-2" aria-hidden="true"></i>
        Agregar al carrito
      </button>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  background: linear-gradient(160deg, rgba(255, 236, 221, 0.9), rgba(255, 214, 170, 0.95));
  border: 1px solid rgba(204, 153, 102, 0.2);
  border-radius: 16px;
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  box-shadow: 0 12px 30px -20px rgba(102, 60, 44, 0.65);
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 38px -18px rgba(102, 60, 44, 0.7);
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
  color: #4b2c20;
}

.product-title {
  color: #663c2c;
  font-weight: 600;
}

.badge {
  border-radius: 999px;
  padding: 0.35rem 0.75rem;
  font-weight: 500;
}

.bg-success-soft {
  background-color: rgba(110, 180, 149, 0.35);
  color: #2f6b4f;
}

.bg-secondary-soft {
  background-color: rgba(148, 135, 125, 0.3);
  color: #5b4a40;
}

.btn-accent {
  background: linear-gradient(145deg, #c46c3b, #d98e59);
  color: #fff;
  border: none;
  font-weight: 600;
  box-shadow: 0 8px 20px -12px rgba(196, 108, 59, 0.9);
}

.btn-accent:hover {
  background: linear-gradient(145deg, #b55f30, #cd7d45);
}

.btn-accent:disabled {
  background: linear-gradient(145deg, #d2a586, #e8c0a5);
  color: rgba(255, 255, 255, 0.85);
}
</style>
