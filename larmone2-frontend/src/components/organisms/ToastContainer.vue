<script setup lang="ts">
import type { ToastState, ToastVariant } from '../../composables/useToast'

defineProps<{
  toasts: ToastState[]
}>()

const emit = defineEmits<{ (event: 'dismiss', id: number): void }>()

const getVariantClass = (variant: ToastVariant) => {
  switch (variant) {
    case 'success':
      return 'text-bg-success'
    case 'danger':
      return 'text-bg-danger'
    case 'warning':
      return 'text-bg-warning'
    case 'info':
      return 'text-bg-info'
    default:
      return 'text-bg-primary'
  }
}
</script>

<template>
  <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1080">
    <div v-for="toast in toasts" :key="toast.id" class="toast show align-items-center border-0" :class="getVariantClass(toast.variant)">
      <div class="toast-header border-0" v-if="toast.title">
        <strong class="me-auto">{{ toast.title }}</strong>
        <button type="button" class="btn-close" aria-label="Cerrar" @click="emit('dismiss', toast.id)" />
      </div>
      <div v-if="toast.title" class="toast-body">{{ toast.message }}</div>
      <div v-else class="d-flex align-items-center">
        <div class="toast-body">{{ toast.message }}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" aria-label="Cerrar" @click="emit('dismiss', toast.id)" />
      </div>
    </div>
  </div>
</template>
