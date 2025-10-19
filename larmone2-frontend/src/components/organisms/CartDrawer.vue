<script setup lang="ts">
import { computed, toRefs } from 'vue'
import type { CartItemDisplay } from '../../stores/cart'

type CartEvent = 'close' | 'checkout' | 'increment' | 'decrement' | 'remove'

const props = defineProps<{
  isOpen: boolean
  items: CartItemDisplay[]
  loading: boolean
  total: number
}>()

const { isOpen, items, loading, total } = toRefs(props)

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'checkout'): void
  (event: 'increment', id: CartItemDisplay['productoId']): void
  (event: 'decrement', id: CartItemDisplay['productoId']): void
  (event: 'remove', id: CartItemDisplay['productoId']): void
}>()

const hasItems = computed(() => items.value.length > 0)

const formattedTotal = computed(() =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(total.value)
)

const emitEvent = (event: CartEvent, id?: CartItemDisplay['productoId']) => {
  if (event === 'close' || event === 'checkout') {
    emit(event)
    return
  }
  if (typeof id === 'undefined') return
  emit(event, id)
}

const handleDrawerClick = (event: MouseEvent) => {
  event.stopPropagation()
}
</script>

<template>
  <Teleport to="body">
    <div>
      <transition name="fade">
        <div v-if="isOpen" class="cart-overlay" role="presentation" @click="emitEvent('close')"></div>
      </transition>

      <transition name="slide-in">
        <aside
          v-if="isOpen"
          class="cart-drawer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cartDrawerTitle"
          @click.stop="handleDrawerClick"
        >
          <header class="cart-header d-flex align-items-center justify-content-between">
            <div>
              <h2 id="cartDrawerTitle" class="cart-title mb-0">Tu carrito</h2>
              <p class="cart-subtitle mb-0" v-if="hasItems">
                {{ items.length }} {{ items.length === 1 ? 'producto' : 'productos' }} listo{{ items.length === 1 ? '' : 's' }}
              </p>
              <p v-else class="cart-subtitle mb-0">Aún no has agregado productos.</p>
            </div>
            <button class="btn btn-link text-decoration-none text-muted" type="button" @click="emitEvent('close')">
              <i class="bi bi-x-lg me-1" aria-hidden="true"></i>Cerrar
            </button>
          </header>

          <section class="cart-body flex-grow-1" aria-live="polite">
            <div v-if="loading" class="d-flex justify-content-center align-items-center h-100" role="status">
              <div class="spinner-border text-primary" role="status" aria-hidden="true"></div>
            </div>

            <ul v-else-if="hasItems" class="list-unstyled mb-0 d-flex flex-column gap-3">
              <li v-for="item in items" :key="item.id" class="cart-item d-flex gap-3 align-items-start">
                <div class="cart-item-thumbnail">
                  <img
                    :src="item.imagen || 'https://placehold.co/80x80/FFE5D9/663C2C?text=Producto'"
                    :alt="item.nombre || `Producto ${item.productoId}`"
                  />
                </div>
                <div class="flex-grow-1">
                  <div class="d-flex justify-content-between gap-2">
                    <div class="cart-item-name">
                      {{ item.nombre || `Producto ${item.productoId}` }}
                    </div>
                    <button
                      type="button"
                      class="btn btn-link btn-sm text-danger text-decoration-none"
                      @click="emitEvent('remove', item.productoId)"
                    >
                      <i class="bi bi-trash me-1" aria-hidden="true"></i>Eliminar
                    </button>
                  </div>
                  <div class="d-flex justify-content-between align-items-center mt-2">
                    <div class="btn-group" role="group" aria-label="Modificar cantidad">
                      <button
                        type="button"
                        class="btn btn-outline-secondary btn-sm"
                        :disabled="item.cantidad <= 1"
                        @click="emitEvent('decrement', item.productoId)"
                      >
                        <i class="bi bi-dash" aria-hidden="true"></i>
                        <span class="visually-hidden">Disminuir</span>
                      </button>
                      <span class="quantity-indicator">{{ item.cantidad }}</span>
                      <button
                        type="button"
                        class="btn btn-outline-secondary btn-sm"
                        @click="emitEvent('increment', item.productoId)"
                      >
                        <i class="bi bi-plus" aria-hidden="true"></i>
                        <span class="visually-hidden">Aumentar</span>
                      </button>
                    </div>
                    <div class="cart-item-price">
                      {{
                        new Intl.NumberFormat('es-CL', {
                          style: 'currency',
                          currency: 'CLP',
                          minimumFractionDigits: 0,
                        }).format(item.precioUnitario * item.cantidad)
                      }}
                    </div>
                  </div>
                </div>
              </li>
            </ul>

            <div v-else class="empty-state text-center">
              <img
                src="https://placehold.co/220x160/FFF4EC/BB7B52?text=Tu+carrito+te+espera"
                alt="Carrito vacío"
                class="img-fluid mb-3"
              />
              <p class="mb-0">Explora nuestro catálogo y añade tus imprescindibles de belleza.</p>
            </div>
          </section>

          <footer class="cart-footer">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="fw-semibold">Total</span>
              <strong class="fs-5">{{ formattedTotal }}</strong>
            </div>
            <button
              type="button"
              class="btn btn-primary w-100"
              :disabled="!hasItems || loading"
              @click="emitEvent('checkout')"
            >
              Ir al resumen del pedido
            </button>
          </footer>
        </aside>
      </transition>
    </div>
  </Teleport>
</template>

<style scoped>
.cart-overlay {
  position: fixed;
  inset: 0;
  background: rgba(33, 37, 41, 0.35);
  backdrop-filter: blur(2px);
  z-index: 1040;
}

.cart-drawer {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: min(420px, 100%);
  background: linear-gradient(160deg, #fff8f3, #ffe9dd);
  box-shadow: -18px 0 36px -26px rgba(102, 60, 44, 0.85);
  display: flex;
  flex-direction: column;
  padding: 1.75rem 1.5rem;
  z-index: 1050;
}

.cart-header {
  margin-bottom: 1.5rem;
}

.cart-title {
  font-weight: 700;
  color: #5c301f;
}

.cart-subtitle {
  color: #8a5a44;
  font-size: 0.9rem;
}

.cart-body {
  overflow-y: auto;
  padding-right: 0.35rem;
}

.cart-item {
  background: rgba(255, 255, 255, 0.75);
  border-radius: 16px;
  padding: 0.75rem;
  box-shadow: 0 18px 40px -32px rgba(93, 48, 32, 0.35);
}

.cart-item-thumbnail {
  flex: 0 0 72px;
  height: 72px;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 229, 217, 0.8);
}

.cart-item-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cart-item-name {
  font-weight: 600;
  color: #5a2f1a;
}

.quantity-indicator {
  min-width: 42px;
  text-align: center;
  font-weight: 600;
  line-height: 1.6;
}

.cart-item-price {
  font-weight: 600;
  color: #8a4d2c;
}

.cart-footer {
  margin-top: 1.75rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(197, 142, 108, 0.3);
}

.empty-state {
  color: #744d39;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-in-enter-active,
.slide-in-leave-active {
  transition: transform 0.32s ease;
}

.slide-in-enter-from,
.slide-in-leave-to {
  transform: translateX(100%);
}

@media (max-width: 576px) {
  .cart-drawer {
    width: 100%;
    padding: 1.5rem 1rem;
    border-top-left-radius: 20px;
    border-bottom-left-radius: 0;
  }
}
</style>
