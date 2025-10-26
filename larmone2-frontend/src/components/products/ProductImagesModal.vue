<template>
  <Teleport to="body">
    <div v-if="show" class="modal-backdrop-container" @keydown.esc.prevent="emitClose" tabindex="-1">
      <div class="modal-backdrop fade show"></div>
      <div class="modal d-block" role="dialog" aria-modal="true" @click.self="emitClose">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Imágenes del producto</h5>
              <button type="button" class="btn-close" aria-label="Cerrar" @click="emitClose"></button>
            </div>
            <div class="modal-body">
              <p v-if="producto" class="text-muted mb-3">
                Gestiona la galería de <strong>{{ producto.nombre }}</strong> (ID: {{ productoId ?? 'Sin ID' }}).
              </p>
              <ProductImageManager
                :id-producto="productoId"
                :nombre-producto="producto?.nombre"
                @imagenes-actualizadas="reemitActualizacion"
              />
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" @click="emitClose">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ProductImageManager from './ProductImageManager.vue'
import type { Producto } from '../../types/api'

const props = defineProps<{
  show: boolean
  producto: Producto | null
}>()

const productoId = computed(() => {
  if (!props.producto) {
    return null
  }

  const id = typeof props.producto.id === 'string' ? props.producto.id.trim() : ''
  if (id.length > 0) {
    return id
  }

  const legacyId =
    typeof props.producto.id_producto === 'string' ? props.producto.id_producto.trim() : ''

  return legacyId.length > 0 ? legacyId : null
})

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'imagenes-actualizadas'): void
}>()

const emitClose = () => {
  emit('close')
}

const reemitActualizacion = () => {
  emit('imagenes-actualizadas')
}
</script>

<style scoped>
.modal-backdrop-container {
  position: fixed;
  inset: 0;
  z-index: 1055;
}

.modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.modal-dialog {
  width: 100%;
  max-width: 1100px;
}

@media (max-width: 576px) {
  .modal {
    padding: 1rem;
  }
}
</style>
