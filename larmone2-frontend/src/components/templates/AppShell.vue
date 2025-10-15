<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import MainNavbar from '../organisms/MainNavbar.vue'
import ToastContainer from '../organisms/ToastContainer.vue'
import CartDrawer from '../organisms/CartDrawer.vue'
import CartFloatingButton from '../molecules/CartFloatingButton.vue'
import { createToastManager, provideToast } from '../../composables/useToast'
import { useCartStore } from '../../stores/cart'
import { useCheckoutStore } from '../../stores/checkout'

const toastManager = createToastManager()

provideToast({ showToast: toastManager.showToast })

const cartStore = useCartStore()
const checkoutStore = useCheckoutStore()
const { items, itemCount, totalAmount } = storeToRefs(cartStore)
const router = useRouter()

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
    <div class="flex-grow-1">
      <RouterView />
    </div>

    <CartDrawer
      :is-open="cartStore.isDrawerOpen"
      :items="items"
      :loading="cartStore.loading"
      :total="totalAmount"
      @close="cartStore.closeDrawer"
      @checkout="handleCheckout"
      @increment="cartStore.incrementItem"
      @decrement="cartStore.decrementItem"
      @remove="cartStore.removeItem"
    />

    <CartFloatingButton :item-count="itemCount" :total="totalAmount" @click="cartStore.toggleDrawer" />

    <ToastContainer :toasts="toastManager.toasts" @dismiss="toastManager.dismiss" />
  </div>
</template>
