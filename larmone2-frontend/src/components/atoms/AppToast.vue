<script setup lang="ts">
import { computed, type PropType } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    default: '',
  },
  type: {
    type: Number as PropType<1 | 2>,
    default: 2,
  },
})

const emit = defineEmits<{
  close: []
}>()

const variantClass = computed(() => {
  switch (props.type) {
    case 1:
      return 'bg-danger text-white'
    case 2:
      return 'bg-success text-white'
    default:
      return 'bg-secondary text-white'
  }
})
</script>

<template>
  <Transition name="toast-fade">
    <div v-if="show && message" class="toast-wrapper position-fixed top-0 end-0 p-3">
      <div class="toast show align-items-center border-0" :class="variantClass" role="alert">
        <div class="d-flex">
          <div class="toast-body">
            {{ message }}
          </div>
          <button
            type="button"
            class="btn-close btn-close-white me-2 m-auto"
            aria-label="Cerrar"
            @click="emit('close')"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.toast-wrapper {
  z-index: 1100;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
