<template>
  <div class="product-image-manager">
    <p v-if="!hasProductoSeleccionado" class="text-muted mb-0">
      Selecciona un producto para administrar sus imágenes.
    </p>

    <div v-else>
      <div class="row g-3 align-items-end">
        <div class="col-12 col-md-6">
          <label class="form-label">Imagen principal</label>
          <input
            type="file"
            class="form-control"
            accept="image/jpeg,image/png,image/webp"
            :disabled="uploading"
            @change="onPrincipalChange"
          />
          <small class="text-muted d-block mt-1">
            Formatos permitidos: JPG, PNG o WEBP. Máximo {{ maxSizeLabel }}.
          </small>
        </div>
        <div class="col-12 col-md-6">
          <label class="form-label">Agregar a galería</label>
          <input
            type="file"
            class="form-control"
            accept="image/jpeg,image/png,image/webp"
            :disabled="uploading"
            @change="onGaleriaChange"
          />
          <small class="text-muted d-block mt-1">Puedes subir imágenes adicionales del producto.</small>
        </div>
      </div>

      <div v-if="tempPreview" class="alert alert-info d-flex align-items-center gap-3 mt-3" role="status">
        <img :src="tempPreview.url" alt="Vista previa" class="rounded preview-thumb" />
        <div>
          <p class="mb-1 fw-semibold">Vista previa local</p>
          <p class="mb-0 small text-muted">
            La imagen se subirá como {{ tempPreview.principal ? 'principal' : 'parte de la galería' }}.
          </p>
        </div>
      </div>

      <div v-if="uploadProgress > 0 && uploadProgress < 100" class="progress mt-3" style="height: 6px;">
        <div class="progress-bar" role="progressbar" :style="{ width: `${uploadProgress}%` }"></div>
      </div>

      <div v-if="errorMessage" class="alert alert-danger mt-3" role="alert">
        {{ errorMessage }}
      </div>
      <div v-else-if="successMessage" class="alert alert-success mt-3" role="alert">
        {{ successMessage }}
      </div>

      <div class="gallery mt-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="mb-0">Galería del producto</h5>
          <span v-if="loading" class="text-muted small">Cargando imágenes...</span>
        </div>

        <div v-if="imagenes.length === 0 && !loading" class="text-muted">
          Aún no hay imágenes registradas para este producto.
        </div>

        <div v-else class="row g-3">
          <div v-for="imagen in imagenes" :key="imagen.id_imagen" class="col-6 col-md-4 col-lg-3">
            <div class="image-tile position-relative p-2 h-100">
              <img
                :src="imagen.resolvedUrl || imagen.url_publica || fallbackThumbnail"
                class="img-fluid rounded shadow-sm"
                :alt="`Imagen ${imagen.id_imagen}`"
              />
              <span v-if="imagen.principal" class="badge text-bg-primary principal-badge">Principal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { fetchProductById } from '../../services/productService'
import { subirImagenProducto, urlParaVerImagen } from '../../services/imageService'
import type { ImagenProducto } from '../../types/api'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 10 * 1024 * 1024
const fallbackThumbnail = 'https://placehold.co/160x160/FFE5D9/663C2C?text=Sin+imagen'

type ResolvedImagenProducto = ImagenProducto & { resolvedUrl?: string }
type TempPreview = { url: string; principal: boolean }

const props = defineProps<{ idProducto: number | null }>()
const emit = defineEmits<{ (event: 'imagenes-actualizadas', imagenes: ResolvedImagenProducto[]): void }>()

const imagenes = ref<ResolvedImagenProducto[]>([])
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const uploading = ref(false)
const uploadProgress = ref(0)
const tempPreview = ref<TempPreview | null>(null)

const hasProductoSeleccionado = computed(() => typeof props.idProducto === 'number' && props.idProducto > 0)
const maxSizeLabel = computed(() => `${Math.round(MAX_BYTES / (1024 * 1024))} MB`)

function clearTempPreview() {
  if (tempPreview.value) {
    URL.revokeObjectURL(tempPreview.value.url)
    tempPreview.value = null
  }
}

onBeforeUnmount(() => {
  clearTempPreview()
})

watch(
  () => props.idProducto,
  async (nuevoId) => {
    clearTempPreview()
    imagenes.value = []
    errorMessage.value = ''
    successMessage.value = ''
    uploadProgress.value = 0
    if (typeof nuevoId === 'number' && nuevoId > 0) {
      await cargarImagenes(nuevoId)
    }
  },
  { immediate: true },
)

async function cargarImagenes(idProducto: number) {
  loading.value = true
  errorMessage.value = ''
  try {
    const producto = await fetchProductById(idProducto)
    const resolved = await Promise.all(
      (producto.imagenes ?? []).map(async (imagen) => ({
        ...imagen,
        resolvedUrl: await urlParaVerImagen(imagen),
      })),
    )
    imagenes.value = resolved
    emit('imagenes-actualizadas', resolved)
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'No fue posible cargar las imágenes del producto. Intenta nuevamente.'
  } finally {
    loading.value = false
  }
}

function resetInput(event: Event) {
  const input = event.target as HTMLInputElement | null
  if (input) {
    input.value = ''
  }
}

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Formato no soportado. Solo se permiten imágenes JPEG, PNG o WEBP.'
  }
  if (file.size > MAX_BYTES) {
    return `El archivo supera el máximo permitido de ${maxSizeLabel.value}.`
  }
  return null
}

async function onPrincipalChange(event: Event) {
  await manejarArchivo(event, true)
}

async function onGaleriaChange(event: Event) {
  await manejarArchivo(event, false)
}

async function manejarArchivo(event: Event, principal: boolean) {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]
  resetInput(event)
  if (!file || !hasProductoSeleccionado.value || !props.idProducto) {
    return
  }

  const validationMessage = validateFile(file)
  if (validationMessage) {
    errorMessage.value = validationMessage
    successMessage.value = ''
    return
  }

  clearTempPreview()
  tempPreview.value = { url: URL.createObjectURL(file), principal }

  await subirArchivo(file, principal)
}

async function subirArchivo(file: File, principal: boolean) {
  if (!props.idProducto) return
  uploading.value = true
  uploadProgress.value = 0
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await subirImagenProducto({
      idProducto: props.idProducto,
      file,
      principal,
      onProgress: (progress) => {
        uploadProgress.value = progress
      },
    })

    successMessage.value = principal
      ? 'La imagen principal se actualizó correctamente.'
      : 'Se agregó una nueva imagen a la galería.'

    await cargarImagenes(props.idProducto)
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'No pudimos completar la carga de la imagen. Intenta nuevamente.'
  } finally {
    uploading.value = false
    setTimeout(() => {
      uploadProgress.value = 0
      clearTempPreview()
    }, 500)
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

.preview-thumb {
  width: 72px;
  height: 72px;
  object-fit: cover;
}

.image-tile {
  background: rgba(255, 255, 255, 0.9);
  border: 1px dashed rgba(140, 79, 185, 0.2);
  border-radius: var(--radius-md);
  text-align: center;
}

.image-tile img {
  width: 100%;
  height: 160px;
  object-fit: cover;
}

.principal-badge {
  position: absolute;
  top: 12px;
  left: 12px;
}
</style>
