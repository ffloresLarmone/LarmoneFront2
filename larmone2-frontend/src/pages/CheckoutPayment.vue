<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import AppButton from '../components/atoms/AppButton.vue'
import { shippingOptions } from '../data/shippingOptions'
import { useCartStore } from '../stores/cart'
import { useCheckoutStore, type PaymentStatus } from '../stores/checkout'

const router = useRouter()
const cartStore = useCartStore()
const checkoutStore = useCheckoutStore()

const { items, totalAmount } = storeToRefs(cartStore)

const processingPayment = ref(false)
const simulatedStatus = ref<Exclude<PaymentStatus, null>>('success')

const shippingOption = computed(() =>
  shippingOptions.find((option) => option.id === checkoutStore.shippingOptionId)
)
const shippingAddress = computed(() => checkoutStore.shippingAddress)

const orderTotal = computed(() => (shippingOption.value?.price ?? 0) + totalAmount.value)

const formattedCurrency = (value: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(value)

const handlePayment = async () => {
  if (!checkoutStore.isReadyForPayment) {
    router.replace({ name: 'checkout-summary' })
    return
  }

  processingPayment.value = true
  const result = await checkoutStore.processPayment(simulatedStatus.value)
  processingPayment.value = false

  if (result === 'success') {
    await cartStore.clearCart()
  }

  router.push({ name: 'checkout-result', params: { status: result } })
}

onMounted(() => {
  if (cartStore.isEmpty) {
    router.replace('/productos')
    return
  }

  if (!checkoutStore.isReadyForPayment) {
    router.replace({ name: 'checkout-summary' })
  }
})
</script>

<template>
  <section class="py-5 bg-light min-vh-100">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-12 col-xl-10">
          <div class="mb-4">
            <h1 class="h3 fw-bold mb-1">Confirmar y pagar</h1>
            <p class="text-muted mb-0">
              Revisa la información del despacho y confirma el pago en la pasarela segura.
            </p>
          </div>

          <div class="row g-4">
            <div class="col-12 col-lg-7">
              <div class="card border-0 shadow-sm rounded-4 h-100">
                <div class="card-body p-4 d-flex flex-column gap-4">
                  <div>
                    <h2 class="h5 fw-bold">Dirección de envío</h2>
                    <p v-if="shippingAddress" class="mb-0">
                      {{ shippingAddress.street }} {{ shippingAddress.number }}<br />
                      <span v-if="shippingAddress.apartment">{{ shippingAddress.apartment }} · </span>
                      {{ shippingAddress.communeName }}, {{ shippingAddress.cityName }}, {{ shippingAddress.regionName }}
                    </p>
                    <p v-else class="text-muted mb-0">No se encontraron datos de despacho.</p>
                  </div>

                  <div>
                    <h2 class="h5 fw-bold">Tipo de envío</h2>
                    <p v-if="shippingOption" class="mb-0">
                      {{ shippingOption.name }} · {{ shippingOption.eta }} · {{ formattedCurrency(shippingOption.price) }}
                    </p>
                    <p v-else class="text-muted mb-0">Selecciona un método de envío para continuar.</p>
                  </div>

                  <div>
                    <h2 class="h5 fw-bold">Resumen de pago</h2>
                    <ul class="list-unstyled mb-3 d-flex flex-column gap-2">
                      <li class="d-flex justify-content-between">
                        <span>Total productos</span>
                        <span>{{ formattedCurrency(totalAmount) }}</span>
                      </li>
                      <li class="d-flex justify-content-between">
                        <span>Envío</span>
                        <span>{{ formattedCurrency(shippingOption?.price ?? 0) }}</span>
                      </li>
                      <li class="d-flex justify-content-between fw-semibold border-top pt-2">
                        <span>Total a pagar</span>
                        <span class="text-primary">{{ formattedCurrency(orderTotal) }}</span>
                      </li>
                    </ul>

                    <div class="mb-3">
                      <label for="simulation" class="form-label fw-semibold">Simular respuesta de la pasarela</label>
                      <select id="simulation" v-model="simulatedStatus" class="form-select form-select-lg">
                        <option value="success">Pago exitoso</option>
                        <option value="failure">Pago rechazado</option>
                      </select>
                      <small class="text-muted">Mientras se integra la pasarela real puedes anticipar escenarios críticos.</small>
                    </div>

                    <AppButton
                      :disabled="processingPayment"
                      :label="processingPayment ? 'Procesando pago…' : 'Ir a pagar'"
                      size="lg"
                      @click="handlePayment"
                    />
                    <p class="text-muted small mb-0 mt-3">Paso 3 de 3 · Serás redirigido según la respuesta de la pasarela.</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-12 col-lg-5">
              <div class="card border-0 shadow-sm rounded-4 h-100">
                <div class="card-body p-4">
                  <h2 class="h5 fw-bold mb-4">Productos en tu pedido</h2>
                  <ul class="list-unstyled d-flex flex-column gap-3 mb-0">
                    <li v-for="item in items" :key="item.id" class="d-flex justify-content-between gap-3">
                      <div>
                        <span class="fw-semibold d-block">{{ item.nombre || `Producto ${item.productoId}` }}</span>
                        <small class="text-muted">Cantidad: {{ item.cantidad }}</small>
                      </div>
                      <strong>{{ formattedCurrency(item.precioUnitario * item.cantidad) }}</strong>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
