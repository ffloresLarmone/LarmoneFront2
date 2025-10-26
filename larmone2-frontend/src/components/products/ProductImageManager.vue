<template>
  <div class="product-image-manager">
    <p v-if="!hasProductoSeleccionado" class="text-muted mb-0">
      Selecciona un producto para visualizar y registrar sus imágenes.
    </p>

    <div v-else>
      <header class="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
        <div>
          <h5 class="mb-0">Gestión de imágenes</h5>
          <p v-if="nombreProducto" class="mb-0 text-muted small">Producto: {{ nombreProducto }}</p>
        </div>
        <span v-if="resumenImagenes" class="badge bg-light text-muted">{{ resumenImagenes }}</span>
      </header>

      <div v-if="feedbackMessage" class="alert alert-success" role="status">{{ feedbackMessage }}</div>
      <div v-if="errorMessage" class="alert alert-danger" role="alert">{{ errorMessage }}</div>

      <section class="panel-lite mb-4">
        <h6 class="fw-semibold mb-3">Registrar nueva imagen</h6>
        <form class="row g-3" @submit.prevent="registrarImagen">
          <div class="col-12">
            <label class="form-label">URL pública</label>
            <input
              type="url"
              class="form-control"
              placeholder="https://cdn.larmone.cl/productos/imagen.jpg"
              v-model="crearForm.url"
              required
            />
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label">Texto alternativo (opcional)</label>
            <input
              type="text"
              class="form-control"
              placeholder="Descripción breve para la imagen"
              v-model="crearForm.alt"
            />
          </div>
          <div class="col-6 col-md-3">
            <label class="form-label">Orden</label>
            <input
              type="number"
              class="form-control"
              min="0"
              placeholder="1"
              v-model="crearForm.orden"
            />
          </div>
          <div class="col-6 col-md-3 d-flex align-items-center">
            <div class="form-check mt-2">
              <input id="imagen-principal" class="form-check-input" type="checkbox" v-model="crearForm.principal" />
              <label for="imagen-principal" class="form-check-label">Marcar como principal</label>
            </div>
          </div>
          <div class="col-12 d-flex justify-content-end">
            <button type="submit" class="btn btn-primary" :disabled="creando">
              <span
                v-if="creando"
                class="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Registrar imagen
            </button>
          </div>
        </form>
      </section>

      <section>
        <h6 class="fw-semibold mb-3">Imágenes registradas</h6>
        <div v-if="loading" class="text-center py-4" role="status">
          <div class="spinner-border text-primary" role="status" aria-hidden="true"></div>
          <p class="mt-3 mb-0">Cargando imágenes del producto…</p>
        </div>

        <div v-else>
          <div v-if="imagenes.length === 0" class="alert alert-light border" role="status">
            Aún no hay imágenes registradas para este producto. Utiliza el formulario superior para agregar la
            primera.
          </div>

          <div v-else class="row g-3">
            <div v-for="imagen in imagenes" :key="keyFor(imagen)" class="col-12 col-md-6 col-xl-4">
              <div class="image-tile h-100">
                <img :src="imagen.url || fallbackThumbnail" :alt="imagen.alt || 'Imagen del producto'" />
                <div class="image-meta d-grid gap-2">
                  <div class="d-flex justify-content-between align-items-center gap-2">
                    <span class="badge" :class="imagen.principal ? 'text-bg-primary' : 'text-bg-secondary'">
                      {{ imagen.principal ? 'Principal' : 'Galería' }}
                    </span>
                    <small class="text-muted text-truncate" :title="imagen.url">{{ imagen.url }}</small>
                  </div>
                  <form class="d-grid gap-2" @submit.prevent="guardarImagen(imagen)">
                    <div>
                      <label class="form-label form-label-sm mb-1">Texto alternativo</label>
                      <input
                        type="text"
                        class="form-control form-control-sm"
                        v-model="ediciones[keyFor(imagen)].alt"
                        :disabled="estaActualizando(imagen)"
                      />
                    </div>
                    <div>
                      <label class="form-label form-label-sm mb-1">Orden</label>
                      <input
                        type="number"
                        class="form-control form-control-sm"
                        min="0"
                        v-model="ediciones[keyFor(imagen)].orden"
                        :disabled="estaActualizando(imagen)"
                      />
                    </div>
                    <div class="d-flex flex-wrap gap-2">
                      <button type="submit" class="btn btn-sm btn-primary" :disabled="estaActualizando(imagen)">
                        <span
                          v-if="estaActualizando(imagen)"
                          class="spinner-border spinner-border-sm me-1"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Guardar
                      </button>
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-primary"
                        @click="marcarComoPrincipal(imagen)"
                        :disabled="imagen.principal || principalEnProgreso === keyFor(imagen)"
                      >
                        <span
                          v-if="principalEnProgreso === keyFor(imagen)"
                          class="spinner-border spinner-border-sm me-1"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Marcar como principal
                      </button>
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-danger"
                        @click="eliminarImagen(imagen)"
                        :disabled="estaEliminando(imagen)"
                      >
                        <span
                          v-if="estaEliminando(imagen)"
                          class="spinner-border spinner-border-sm me-1"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Eliminar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  createProductImage,
  deleteProductImage,
  fetchProductById,
  fetchProductBySlug,
  updateProductImage,
} from '../../services/productService'
import type { ImagenProducto } from '../../types/api'
import { FALLBACK_IMAGE, normalizarImagenes } from '../../services/imageService'

const fallbackThumbnail = FALLBACK_IMAGE

const props = defineProps<{ idProducto: string | null; nombreProducto?: string }>()
const emit = defineEmits<{ (event: 'imagenes-actualizadas', imagenes: ImagenProducto[]): void }>()

const imagenes = ref<ImagenProducto[]>([])
const loading = ref(false)
const creando = ref(false)
const actualizando = ref<string | null>(null)
const principalEnProgreso = ref<string | null>(null)
const eliminando = ref<string | null>(null)
const feedbackMessage = ref('')
const errorMessage = ref('')

const crearForm = reactive({
  url: '',
  alt: '',
  principal: false,
  orden: '',
})

const ediciones = reactive<Record<string, { alt: string; orden: string }>>({})

const hasProductoSeleccionado = computed(() => typeof props.idProducto === 'string' && props.idProducto.length > 0)
const nombreProducto = computed(() => props.nombreProducto ?? '')

const resumenImagenes = computed(() => {
  const total = imagenes.value.length
  if (!total) return ''
  return `${total} ${total === 1 ? 'imagen' : 'imágenes'} registradas`
})

watch(
  () => props.idProducto,
  async (nuevoId) => {
    resetMensajes()
    imagenes.value = []
    sincronizarEdiciones()
    if (typeof nuevoId === 'string' && nuevoId.trim().length > 0) {
      await cargarImagenes(nuevoId)
    } else {
      loading.value = false
    }
  },
  { immediate: true },
)

watch(
  () => imagenes.value,
  () => {
    sincronizarEdiciones()
  },
  { deep: true },
)

function keyFor(imagen: ImagenProducto): string {
  return imagen.id ?? imagen.url ?? ''
}

function estaActualizando(imagen: ImagenProducto): boolean {
  return actualizando.value === keyFor(imagen)
}

function estaEliminando(imagen: ImagenProducto): boolean {
  return eliminando.value === keyFor(imagen)
}

function resetCrearForm() {
  crearForm.url = ''
  crearForm.alt = ''
  crearForm.principal = false
  crearForm.orden = ''
}

function resetMensajes() {
  feedbackMessage.value = ''
  errorMessage.value = ''
}

function sincronizarEdiciones() {
  const snapshot: Record<string, { alt: string; orden: string }> = {}
  for (const imagen of imagenes.value) {
    const key = keyFor(imagen)
    snapshot[key] = {
      alt: imagen.alt ?? '',
      orden:
        typeof imagen.orden === 'number' && !Number.isNaN(imagen.orden)
          ? imagen.orden.toString()
          : '',
    }
  }

  for (const key of Object.keys(ediciones)) {
    if (!(key in snapshot)) {
      delete ediciones[key]
    }
  }

  Object.entries(snapshot).forEach(([key, value]) => {
    ediciones[key] = value
  })
}

async function cargarImagenes(idProducto: string) {
  loading.value = true
  try {
    let producto
    try {
      producto = await fetchProductById(idProducto, { admin: true })
    } catch (error) {
      producto = await fetchProductBySlug(idProducto, { admin: true })
    }
    imagenes.value = normalizarImagenes(producto.imagenes)
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

function limpiarPayload<T extends Record<string, unknown>>(payload: T): T {
  const limpio: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) {
      limpio[key] = value
    }
  }
  return limpio as T
}

async function registrarImagen() {
  if (!props.idProducto) {
    errorMessage.value = 'Selecciona un producto válido antes de registrar imágenes.'
    return
  }

  const url = crearForm.url.trim()
  if (!url) {
    errorMessage.value = 'Debes ingresar una URL válida para la imagen.'
    return
  }

  let ordenNumber: number | undefined
  if (crearForm.orden.trim().length > 0) {
    const parsed = Number(crearForm.orden)
    if (Number.isNaN(parsed)) {
      errorMessage.value = 'El orden debe ser un número válido.'
      return
    }
    ordenNumber = parsed
  }

  const payload = limpiarPayload({
    url,
    alt: crearForm.alt.trim().length > 0 ? crearForm.alt.trim() : undefined,
    principal: crearForm.principal ? true : undefined,
    orden: ordenNumber,
  })

  creando.value = true
  resetMensajes()
  try {
    await createProductImage(props.idProducto, payload)
    feedbackMessage.value = 'Imagen registrada correctamente.'
    resetCrearForm()
    await cargarImagenes(props.idProducto)
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'No fue posible registrar la imagen. Intenta nuevamente.'
  } finally {
    creando.value = false
  }
}

async function guardarImagen(imagen: ImagenProducto) {
  if (!props.idProducto || !imagen.id) {
    return
  }
  const key = keyFor(imagen)
  const edicion = ediciones[key]
  if (!edicion) {
    return
  }

  const alt = edicion.alt.trim()
  const ordenTexto = edicion.orden.trim()

  let orden: number | null | undefined
  if (ordenTexto.length > 0) {
    const parsed = Number(ordenTexto)
    if (Number.isNaN(parsed)) {
      errorMessage.value = 'El orden debe ser un número válido.'
      return
    }
    orden = parsed
  } else {
    orden = null
  }

  const payload = limpiarPayload({
    alt: alt.length > 0 ? alt : null,
    orden,
  })

  actualizando.value = key
  resetMensajes()
  try {
    await updateProductImage(props.idProducto, imagen.id, payload)
    feedbackMessage.value = 'Imagen actualizada correctamente.'
    await cargarImagenes(props.idProducto)
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'No fue posible actualizar la imagen. Intenta nuevamente.'
  } finally {
    actualizando.value = null
  }
}

async function marcarComoPrincipal(imagen: ImagenProducto) {
  if (!props.idProducto || !imagen.id) {
    return
  }
  const key = keyFor(imagen)
  principalEnProgreso.value = key
  resetMensajes()
  try {
    await updateProductImage(props.idProducto, imagen.id, { principal: true })
    feedbackMessage.value = 'Imagen marcada como principal.'
    await cargarImagenes(props.idProducto)
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'No fue posible actualizar la imagen principal. Intenta nuevamente.'
  } finally {
    principalEnProgreso.value = null
  }
}

async function eliminarImagen(imagen: ImagenProducto) {
  if (!props.idProducto || !imagen.id) {
    return
  }

  const confirmar = window.confirm('¿Deseas eliminar esta imagen del producto?')
  if (!confirmar) {
    return
  }

  const key = keyFor(imagen)
  eliminando.value = key
  resetMensajes()
  try {
    await deleteProductImage(props.idProducto, imagen.id)
    feedbackMessage.value = 'Imagen eliminada correctamente.'
    await cargarImagenes(props.idProducto)
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'No fue posible eliminar la imagen. Intenta nuevamente.'
  } finally {
    eliminando.value = null
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

.panel-lite {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(140, 79, 185, 0.12);
  border-radius: var(--radius-md);
  padding: 1.25rem;
}

.image-tile {
  background: rgba(255, 255, 255, 0.95);
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
  padding: 1rem;
}

.form-label-sm {
  font-size: 0.85rem;
}
</style>
