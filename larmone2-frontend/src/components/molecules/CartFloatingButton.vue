<script setup lang="ts">
import { computed, toRefs } from 'vue'

const props = defineProps<{
  itemCount: number
  total: number
}>()
const { itemCount, total } = toRefs(props)

const emit = defineEmits<{ (event: 'click'): void }>()

const formattedTotal = computed(() =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(total.value)
)
</script>

<template>
  <button class="cart-floating-button" type="button" @click="emit('click')">
    <div class="icon-wrapper">
      <i class="bi bi-bag" aria-hidden="true"></i>
      <span v-if="itemCount > 0" class="badge rounded-pill">{{ itemCount }}</span>
    </div>
    <div class="label-wrapper text-start">
      <span class="title">Carrito</span>
      <small class="total" aria-live="polite">{{ formattedTotal }}</small>
    </div>
  </button>
</template>

<style scoped>
.cart-floating-button {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  background: linear-gradient(145deg, #c46c3b, #d98e59);
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 0.75rem 1.5rem;
  box-shadow: 0 18px 40px -24px rgba(102, 60, 44, 0.9);
  z-index: 1030;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.cart-floating-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 24px 52px -28px rgba(102, 60, 44, 0.9);
}

.cart-floating-button:focus-visible {
  outline: 3px solid rgba(255, 255, 255, 0.75);
  outline-offset: 4px;
}

.icon-wrapper {
  position: relative;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
}

.icon-wrapper .badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #fff;
  color: #c46c3b;
  font-size: 0.75rem;
}

.label-wrapper .title {
  display: block;
  font-weight: 600;
  line-height: 1;
}

.label-wrapper .total {
  display: block;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
}

@media (max-width: 576px) {
  .cart-floating-button {
    right: 50%;
    transform: translateX(50%);
    width: calc(100% - 2.5rem);
    justify-content: center;
  }

  .cart-floating-button:hover {
    transform: translateX(50%) translateY(-2px);
  }
}
</style>
