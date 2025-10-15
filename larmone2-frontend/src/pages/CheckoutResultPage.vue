<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '../components/atoms/AppButton.vue'
import { useCheckoutStore } from '../stores/checkout'

const props = defineProps<{ status: 'success' | 'failure' }>()

const router = useRouter()
const checkoutStore = useCheckoutStore()

const isSuccess = computed(() => props.status === 'success')

const headline = computed(() =>
  isSuccess.value ? '¡Pago exitoso!' : 'Tu pago fue rechazado'
)

const description = computed(() =>
  isSuccess.value
    ? 'Hemos confirmado tu compra y comenzaremos a preparar el despacho. Te enviaremos el detalle por correo.'
    : 'La pasarela de pago no pudo procesar la transacción. Revisa tus datos y vuelve a intentarlo más tarde.'
)

const primaryActionLabel = computed(() => (isSuccess.value ? 'Seguir comprando' : 'Intentar nuevamente'))

const handlePrimaryAction = () => {
  if (isSuccess.value) {
    checkoutStore.clear()
    router.push('/productos')
  } else {
    router.push({ name: 'checkout-payment' })
  }
}

const handleSecondaryAction = () => {
  checkoutStore.clear()
  router.push('/productos')
}
</script>

<template>
  <section class="py-5 bg-light min-vh-100 d-flex align-items-center">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-12 col-lg-6">
          <div class="card border-0 shadow-sm rounded-4 text-center p-4 p-lg-5">
            <div class="icon-wrapper mx-auto mb-4" :class="{ success: isSuccess, failure: !isSuccess }">
              <i :class="isSuccess ? 'bi bi-check-lg' : 'bi bi-x-lg'" aria-hidden="true"></i>
            </div>
            <h1 class="h3 fw-bold mb-3">{{ headline }}</h1>
            <p class="text-muted mb-4">{{ description }}</p>
            <div class="d-flex flex-column gap-3">
              <AppButton :label="primaryActionLabel" size="lg" @click="handlePrimaryAction" />
              <button type="button" class="btn btn-link text-decoration-none" @click="handleSecondaryAction">
                Volver al catálogo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.icon-wrapper {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin-bottom: 1rem;
}

.icon-wrapper.success {
  background: rgba(25, 135, 84, 0.1);
  color: #198754;
}

.icon-wrapper.failure {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}
</style>
