<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import AppButton from '../components/atoms/AppButton.vue'
import { useCartStore } from '../stores/cart'
import { useCheckoutStore, type PurchaseMode } from '../stores/checkout'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const cartStore = useCartStore()
const checkoutStore = useCheckoutStore()
const authStore = useAuthStore()

const { items, totalAmount } = storeToRefs(cartStore)
const isLoadingCart = computed(() => cartStore.loading && items.value.length === 0)

const purchaseMode = ref<PurchaseMode | null>(
  checkoutStore.purchaseMode ?? (authStore.isAuthenticated ? 'customer' : 'guest')
)
const errorMessage = ref('')

const formattedTotal = computed(() =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(totalAmount.value)
)

const canShowGuestOption = computed(() => !authStore.isAuthenticated)

watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      purchaseMode.value = 'customer'
    } else if (!purchaseMode.value) {
      purchaseMode.value = 'guest'
    }
  }
)

const goToShipping = () => {
  if (!purchaseMode.value) {
    errorMessage.value = 'Selecciona cómo quieres comprar antes de continuar.'
    return
  }

  checkoutStore.setPurchaseMode(purchaseMode.value)
  errorMessage.value = ''
  router.push({ name: 'checkout-shipping' })
}

onMounted(() => {
  if (cartStore.isEmpty) {
    router.replace('/productos')
    return
  }

  if (!purchaseMode.value) {
    purchaseMode.value = authStore.isAuthenticated ? 'customer' : 'guest'
  }
})
</script>

<template>
  <section class="py-5 bg-light min-vh-100">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-12 col-xl-10">
          <div class="mb-4">
            <h1 class="h3 fw-bold mb-1">Resumen del pedido</h1>
            <p class="text-muted mb-0">Confirma los productos y cómo quieres continuar la compra.</p>
          </div>

          <div class="row g-4">
            <div class="col-12 col-lg-7">
              <div class="card border-0 shadow-sm rounded-4 h-100">
                <div class="card-body p-4">
                  <h2 class="h5 fw-bold mb-4">Productos seleccionados</h2>

                  <div v-if="isLoadingCart" class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                      <span class="visually-hidden">Cargando...</span>
                    </div>
                  </div>

                  <div v-else>
                    <ul class="list-unstyled mb-4 d-flex flex-column gap-3">
                      <li v-for="item in items" :key="item.id" class="d-flex gap-3 align-items-center">
                        <div class="product-thumbnail rounded-3 overflow-hidden">
                          <img
                            :src="item.imagen || 'https://placehold.co/80x80/FFE5D9/663C2C?text=Producto'"
                            :alt="item.nombre || `Producto ${item.productoId}`"
                          />
                        </div>
                        <div class="flex-grow-1">
                          <h3 class="h6 fw-semibold mb-1">{{ item.nombre || `Producto ${item.productoId}` }}</h3>
                          <p class="mb-0 text-muted small">Cantidad: {{ item.cantidad }}</p>
                        </div>
                        <div class="fw-semibold">
                          {{
                            new Intl.NumberFormat('es-CL', {
                              style: 'currency',
                              currency: 'CLP',
                              minimumFractionDigits: 0,
                            }).format(item.precioUnitario * item.cantidad)
                          }}
                        </div>
                      </li>
                    </ul>
                    <div class="d-flex justify-content-between align-items-center border-top pt-3">
                      <span class="fw-semibold">Total productos</span>
                      <strong class="fs-5 text-primary">{{ formattedTotal }}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-12 col-lg-5">
              <div class="card border-0 shadow-sm rounded-4">
                <div class="card-body p-4 d-flex flex-column gap-4">
                  <div>
                    <h2 class="h5 fw-bold">¿Cómo quieres comprar?</h2>
                    <p class="text-muted small mb-3">
                      Puedes continuar como invitado o acceder con tu cuenta para agilizar el proceso.
                    </p>

                    <div class="d-flex flex-column gap-2">
                      <label
                        v-if="canShowGuestOption"
                        class="option-card border rounded-3 p-3 d-flex align-items-start gap-3"
                      >
                        <input
                          v-model="purchaseMode"
                          class="form-check-input mt-1"
                          type="radio"
                          name="purchase-mode"
                          value="guest"
                        />
                        <div>
                          <span class="fw-semibold d-block">Comprar como invitado</span>
                          <small class="text-muted">Ingresa tus datos manualmente y recibe novedades por correo.</small>
                        </div>
                      </label>

                      <label class="option-card border rounded-3 p-3 d-flex align-items-start gap-3">
                        <input
                          v-model="purchaseMode"
                          class="form-check-input mt-1"
                          type="radio"
                          name="purchase-mode"
                          value="customer"
                          :disabled="authStore.isAuthenticated"
                        />
                        <div>
                          <span class="fw-semibold d-block">Comprar como cliente registrado</span>
                          <small class="text-muted"
                            >Tus datos guardados se aplicarán automáticamente para agilizar el despacho.</small
                          >
                        </div>
                      </label>
                    </div>

                    <p v-if="authStore.isAuthenticated" class="text-muted small mt-3">
                      Estás autenticado, continuaremos con tu cuenta registrada.
                    </p>
                  </div>

                  <div v-if="errorMessage" class="alert alert-warning mb-0">{{ errorMessage }}</div>

                  <AppButton label="Continuar al envío" size="lg" @click="goToShipping" />
                  <p class="mb-0 text-muted small text-center">
                    Paso 1 de 3 · Luego podrás definir la dirección y el método de pago.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.product-thumbnail {
  width: 64px;
  height: 64px;
  background: rgba(255, 229, 217, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.option-card {
  transition: all 0.2s ease;
}

.option-card:hover {
  border-color: var(--brand-primary);
  box-shadow: 0 12px 28px -24px rgba(102, 60, 44, 0.6);
}
</style>
