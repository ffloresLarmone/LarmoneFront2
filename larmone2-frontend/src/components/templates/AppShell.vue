<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import MainNavbar from '../organisms/MainNavbar.vue'
import ToastContainer from '../organisms/ToastContainer.vue'
import CartDrawer from '../organisms/CartDrawer.vue'
import CartFloatingButton from '../molecules/CartFloatingButton.vue'
import { createToastManager, provideToast } from '../../composables/useToast'
import { useCartStore } from '../../stores/cart'
import { useCheckoutStore } from '../../stores/checkout'
import { apiStatus, pingBackend } from '../../services/apiClient'

const toastManager = createToastManager()

provideToast({ showToast: toastManager.showToast })

const cartStore = useCartStore()
const checkoutStore = useCheckoutStore()
const { items, itemCount, totalAmount } = storeToRefs(cartStore)
const router = useRouter()

const showBackendAlert = computed(() => !apiStatus.isReachable)
const backendMessage = computed(
  () =>
    apiStatus.lastError ??
    'No podemos comunicarnos con el servidor en este momento. Espera un momento e intenta nuevamente.',
)

const retryingConnection = ref(false)

const retryConnection = async () => {
  if (retryingConnection.value) return
  retryingConnection.value = true

  const success = await pingBackend()

  if (success) {
    toastManager.showToast({
      title: 'Conexión restablecida',
      message: 'Sincronizamos tus datos con el servidor.',
      variant: 'success',
      duration: 3600,
    })

    cartStore.fetchCart().catch(() => {})
  } else {
    toastManager.showToast({
      title: 'Seguimos sin conexión',
      message: backendMessage.value,
      variant: 'warning',
      duration: 4800,
    })
  }

  retryingConnection.value = false
}

watch(
  () => apiStatus.isReachable,
  (isReachable) => {
    if (isReachable) {
      cartStore.fetchCart().catch(() => {})
    }
  },
)

const handleSearch = (query: string) => {
  if (!query) {
    toastManager.showToast({
      title: 'Búsqueda vacía',
      message: 'Ingresa una palabra clave para descubrir productos a tu medida.',
      variant: 'warning',
      duration: 3600,
    })
    return
  }

  toastManager.showToast({
    title: 'Buscando',
    message: `Pronto te mostraremos resultados para "${query}".`,
    variant: 'info',
    duration: 2800,
  })
}

const handleCheckout = () => {
  if (cartStore.isEmpty) {
    toastManager.showToast({
      title: 'Tu carrito está vacío',
      message: 'Agrega tus favoritos antes de continuar a la pasarela de pago.',
      variant: 'warning',
      duration: 4000,
    })
    return
  }

  checkoutStore.clear()
  cartStore.closeDrawer()

  toastManager.showToast({
    title: 'Revisa tu pedido',
    message: 'Confirma los datos y completa tu compra en tres pasos.',
    variant: 'info',
    duration: 4000,
  })

  router.push({ name: 'checkout-summary' }).catch(() => {
    // Ignoramos errores de navegación duplicada
  })
}
</script>

<template>
  <div class="bg-white min-vh-100 d-flex flex-column">
    <MainNavbar @search="handleSearch" />
    <transition name="fade">
      <div
        v-if="showBackendAlert"
        class="alert alert-danger rounded-0 mb-0 text-center backend-alert"
        role="alert"
      >
        <div class="container d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div class="d-flex align-items-center justify-content-center gap-2">
            <i class="bi bi-wifi-off fs-5" aria-hidden="true"></i>
            <span class="fw-semibold">{{ backendMessage }}</span>
          </div>
          <div class="d-flex flex-column flex-sm-row gap-2 justify-content-center">
            <button
              type="button"
              class="btn btn-outline-light btn-sm"
              :disabled="retryingConnection"
              @click="retryConnection"
            >
              <span
                v-if="retryingConnection"
                class="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Reintentar conexión
            </button>
          </div>
        </div>
      </div>
    </transition>
    <div class="flex-grow-1">
      <RouterView />
    </div>

    <CartDrawer
      :is-open="cartStore.isDrawerOpen"
      :items="items"
      :loading="cartStore.loading"
      :total="totalAmount"
      :error="cartStore.error"
      @close="cartStore.closeDrawer"
      @checkout="handleCheckout"
      @increment="cartStore.incrementItem"
      @decrement="cartStore.decrementItem"
      @remove="cartStore.removeItem"
    />

    <CartFloatingButton :item-count="itemCount" :total="totalAmount" @click="cartStore.toggleDrawer" />

    <footer class="bg-light border-top py-4 mt-auto">
      <div class="container text-center">
        <p class="mb-1 fw-semibold">¿Necesitas asistencia?</p>
        <p class="mb-3 text-muted small">
          Síguenos en redes sociales o escríbenos para recibir ayuda personalizada.
        </p>
        <div class="d-flex flex-wrap justify-content-center gap-3">
          <a
            class="text-decoration-none"
            href="https://www.instagram.com/larmone"
            target="_blank"
            rel="noopener"
          >
            Instagram
          </a>
          <a
            class="text-decoration-none"
            href="https://www.facebook.com/larmone"
            target="_blank"
            rel="noopener"
          >
            Facebook
          </a>
          <a class="text-decoration-none" href="mailto:soporte@larmone.com">
            soporte@larmone.com
          </a>
        </div>
      </div>
    </footer>

    <ToastContainer :toasts="toastManager.toasts" @dismiss="toastManager.dismiss" />
  </div>
</template>

<style scoped>
.backend-alert {
  background: linear-gradient(90deg, rgba(220, 53, 69, 0.95), rgba(220, 53, 69, 0.85));
  color: #fff;
  border: 0;
}

.backend-alert .btn-outline-light {
  border-color: rgba(255, 255, 255, 0.6);
  color: #fff;
}

.backend-alert .btn-outline-light:hover,
.backend-alert .btn-outline-light:focus {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}
</style>
