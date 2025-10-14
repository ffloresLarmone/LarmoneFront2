<template>
  <section class="product-detail py-5">
    <div class="container">
      <button class="btn btn-link text-decoration-none mb-4" type="button" @click="goBack">
        <i class="bi bi-arrow-left me-2" aria-hidden="true"></i>Volver al catálogo
      </button>

      <div v-if="loading" class="text-center py-5" role="status">
        <div class="spinner-border text-primary" role="status" aria-hidden="true"></div>
        <p class="mt-3 mb-0">Cargando producto...</p>
      </div>

      <div v-else-if="errorMessage" class="alert alert-warning" role="alert">
        {{ errorMessage }}
      </div>

      <div v-else-if="producto" class="detail-card row g-4 align-items-start">
        <div class="col-12 col-lg-6">
          <div class="image-stack">
            <div class="main-image">
              <img :src="selectedImage" :alt="producto.nombre" />
            </div>
            <div v-if="producto.imagenes?.length" class="thumbs mt-3 d-flex flex-wrap gap-2">
              <button
                v-for="imagen in producto.imagenes"
                :key="imagen.id_imagen"
                type="button"
                class="thumb"
                :class="{ active: imagen.url_publica === selectedImage }"
                @click="selectedImage = imagen.url_publica"
              >
                <img :src="imagen.url_publica" :alt="`Imagen ${producto.nombre}`" />
              </button>
            </div>
          </div>
        </div>
        <div class="col-12 col-lg-6">
          <div class="detail-info">
            <h1 class="product-name">{{ producto.nombre }}</h1>
            <p class="text-muted mb-3">SKU: {{ producto.sku }}</p>
            <div class="badge-status mb-4">
              <span class="badge" :class="producto.activo ? 'bg-success-soft' : 'bg-secondary-soft'">
                {{ producto.activo ? 'Disponible' : 'No disponible' }}
              </span>
            </div>
            <p class="description">
              Disfruta de un diseño cuidadosamente elaborado con materiales de alta calidad. Este producto forma parte de nuestra colección exclusiva.
            </p>
            <div class="actions mt-4 d-flex flex-column flex-sm-row gap-3">
              <button class="btn btn-accent" type="button" @click="addToCart" :disabled="cartLoading">
                <i class="bi bi-bag-plus me-2" aria-hidden="true"></i>Agregar al carrito
              </button>
            </div>
            <p v-if="feedbackMessage" class="feedback mt-3 mb-0">{{ feedbackMessage }}</p>
            <dl class="mt-4 product-meta">
              <div class="meta-item">
                <dt>Identificador interno</dt>
                <dd>#{{ producto.id_producto }}</dd>
              </div>
              <div class="meta-item">
                <dt>Fecha de creación</dt>
                <dd>{{ formattedCreatedAt }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { fetchProductById } from '../services/productService'
import type { Producto } from '../types/api'
import { useCartStore } from '../stores/cart'

const route = useRoute()
const router = useRouter()
const producto = ref<Producto | null>(null)
const selectedImage = ref('https://placehold.co/600x480/FFE5D9/663C2C?text=Sin+imagen')
const loading = ref(false)
const errorMessage = ref('')
const feedbackMessage = ref('')

const cartStore = useCartStore()
const { loading: cartLoading, error } = storeToRefs(cartStore)

const formattedCreatedAt = computed(() => {
  if (!producto.value?.creado_en) return 'Sin registro'
  const date = new Date(producto.value.creado_en)
  return new Intl.DateTimeFormat('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
})

async function loadProduct() {
  const idParam = route.params.id
  const id = Number(idParam)
  if (!Number.isFinite(id)) {
    errorMessage.value = 'El identificador del producto no es válido.'
    return
  }
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await fetchProductById(id)
    producto.value = data
    if (data.imagenes?.length) {
      const principal = data.imagenes.find((img) => img.principal)
      selectedImage.value = principal?.url_publica ?? data.imagenes[0].url_publica
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'No fue posible cargar la información del producto. Intenta nuevamente.'
  } finally {
    loading.value = false
  }
}

async function addToCart() {
  feedbackMessage.value = ''
  if (!producto.value) return
  try {
    await cartStore.addItem({
      id_variante: producto.value.id_producto,
      cantidad: 1,
    })
    feedbackMessage.value = 'Producto agregado al carrito'
  } catch (error) {
    feedbackMessage.value =
      error instanceof Error
        ? error.message
        : 'No pudimos agregar el producto. Intenta nuevamente.'
  }
  setTimeout(() => (feedbackMessage.value = ''), 3500)
}

function goBack() {
  router.push({ name: 'products' })
}

onMounted(() => {
  loadProduct()
})
</script>

<style scoped>
.product-detail {
  background: radial-gradient(circle at top right, rgba(255, 230, 210, 0.95), rgba(255, 245, 235, 0.9));
  min-height: 100vh;
}

.detail-card {
  background: rgba(255, 255, 255, 0.65);
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 0 28px 60px -40px rgba(93, 48, 32, 0.8);
  border: 1px solid rgba(212, 159, 126, 0.25);
}

.image-stack {
  display: flex;
  flex-direction: column;
}

.main-image {
  border-radius: 20px;
  overflow: hidden;
  background: rgba(255, 225, 205, 0.7);
  box-shadow: inset 0 0 0 1px rgba(209, 145, 107, 0.35);
}

.main-image img {
  width: 100%;
  display: block;
  object-fit: cover;
}

.thumb {
  border: none;
  background: transparent;
  padding: 0;
  border-radius: 12px;
  overflow: hidden;
  outline: 2px solid transparent;
  transition: outline-color 0.2s ease;
}

.thumb img {
  width: 70px;
  height: 70px;
  object-fit: cover;
  display: block;
}

.thumb.active,
.thumb:hover {
  outline-color: rgba(197, 108, 63, 0.8);
}

.detail-info {
  color: #5f3a29;
}

.product-name {
  font-size: 2.25rem;
  font-weight: 700;
  color: #47261a;
}

.badge {
  border-radius: 999px;
  padding: 0.5rem 1rem;
  font-weight: 600;
}

.bg-success-soft {
  background-color: rgba(121, 184, 152, 0.35);
  color: #2f6b4f;
}

.bg-secondary-soft {
  background-color: rgba(160, 140, 130, 0.3);
  color: #5b4a40;
}

.description {
  font-size: 1.05rem;
  line-height: 1.6;
}

.btn-accent {
  background: linear-gradient(145deg, #c46c3b, #d98e59);
  color: #fff;
  border: none;
  font-weight: 600;
  padding: 0.75rem 1.75rem;
  border-radius: 999px;
  box-shadow: 0 12px 24px -12px rgba(196, 108, 59, 0.75);
}

.btn-accent:hover {
  background: linear-gradient(145deg, #b55f30, #cd7d45);
}

.feedback {
  color: #744d39;
  font-weight: 500;
}

.product-meta {
  display: grid;
  gap: 1rem;
}

.meta-item {
  background: rgba(255, 230, 210, 0.55);
  border-radius: 16px;
  padding: 1rem 1.5rem;
  box-shadow: inset 0 0 0 1px rgba(215, 165, 134, 0.35);
}

.meta-item dt {
  font-weight: 600;
  color: #7a4c32;
  margin-bottom: 0.25rem;
}

.meta-item dd {
  margin: 0;
  color: #4b2c20;
}
</style>
