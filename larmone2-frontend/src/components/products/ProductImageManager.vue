<template>
  <div class="product-image-manager">
    <p v-if="!hasProductoSeleccionado" class="text-muted mb-0">
      Selecciona un producto para visualizar sus imágenes actuales.
    </p>

    <div v-else>
      <div class="alert alert-info d-flex align-items-start gap-3" role="status">
        <i class="bi bi-images fs-4"></i>
        <div>
          <p class="fw-semibold mb-1">Gestión disponible vía API</p>
          <p class="mb-0 small">
            Usa los endpoints de <code>POST /api/productos/:id/imagenes</code> y <code>PATCH</code>/<code>DELETE</code>
            correspondientes para agregar o actualizar imágenes. Esta vista muestra el estado sincronizado.
          </p>
        </div>
      </div>

      <div v-if="loading" class="text-center py-5" role="status">
        <div class="spinner-border text-primary" role="status" aria-hidden="true"></div>
        <p class="mt-3 mb-0">Cargando imágenes del producto…</p>
      </div>

      <div v-else>
        <div v-if="errorMessage" class="alert alert-danger" role="alert">{{ errorMessage }}</div>
        <div v-else>
          <header class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="mb-0">Galería registrada</h5>
            <span class="text-muted small" v-if="imagenes.length">{{ resumenImagenes }}</span>
          </header>

          <div v-if="imagenes.length === 0" class="text-muted">
            No hay imágenes asociadas a este producto. Puedes registrarlas desde el backend.
          </div>

          <div v-else class="row g-3">
            <div v-for="imagen in imagenes" :key="imagen.id || imagen.url" class="col-12 col-md-6 col-xl-4">
              <div class="image-tile h-100">
                <img :src="imagen.url || fallbackThumbnail" :alt="imagen.alt || 'Imagen del producto'" />
                <div class="image-meta">
                  <p class="mb-1 fw-semibold text-truncate" :title="imagen.url">{{ imagen.url }}</p>
                  <p class="mb-1 small text-muted">{{ imagen.alt || 'Sin descripción' }}</p>
                  <span
                    class="badge"
                    :class="imagen.principal ? 'text-bg-primary' : 'text-bg-secondary'"
                  >
                    {{ imagen.principal ? 'Principal' : 'Galería' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { fetchProductById, fetchProductBySlug } from '../../services/productService'
import type { ImagenProducto } from '../../types/api'
import { FALLBACK_IMAGE } from '../../services/imageService'

const fallbackThumbnail = FALLBACK_IMAGE

const props = defineProps<{ idProducto: string | null }>()
const emit = defineEmits<{ (event: 'imagenes-actualizadas', imagenes: ImagenProducto[]): void }>()

const imagenes = ref<ImagenProducto[]>([])
const loading = ref(false)
const errorMessage = ref('')

const hasProductoSeleccionado = computed(() => typeof props.idProducto === 'string' && props.idProducto.length > 0)

const resumenImagenes = computed(() => {
  const total = imagenes.value.length
  if (!total) return ''
  return `${total} ${total === 1 ? 'imagen' : 'imágenes'} registradas`
})

watch(
  () => props.idProducto,
  async (nuevoId) => {
    imagenes.value = []
    errorMessage.value = ''
    if (typeof nuevoId === 'string' && nuevoId.trim().length > 0) {
      await cargarImagenes(nuevoId)
    }
  },
  { immediate: true },
)

async function cargarImagenes(idProducto: string) {
  loading.value = true
  errorMessage.value = ''
  try {
    let producto
    try {
      producto = await fetchProductById(idProducto)
    } catch (error) {
      producto = await fetchProductBySlug(idProducto)
    }
    imagenes.value = producto.imagenes ?? []
    emit('imagenes-actualizadas', imagenes.value)
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'No fue posible cargar las imágenes del producto. Intenta nuevamente.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.product-image-manager {
  background-color: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(140, 79, 185, 0.12);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
}

.image-tile {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(140, 79, 185, 0.12);
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.image-tile img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.image-meta {
  padding: 0.75rem 1rem;
}

.image-meta p {
  margin-bottom: 0;
}
</style>
