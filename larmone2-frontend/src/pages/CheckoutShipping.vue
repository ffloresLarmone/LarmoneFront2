<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '../components/atoms/AppButton.vue'
import { regions } from '../data/locations'
import { shippingOptions } from '../data/shippingOptions'
import { useCheckoutStore } from '../stores/checkout'
import { useCartStore } from '../stores/cart'
import { useAuthStore } from '../stores/auth'

const REQUIRED_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const router = useRouter()
const checkoutStore = useCheckoutStore()
const cartStore = useCartStore()
const authStore = useAuthStore()

const customerFormState = reactive({
  firstName: checkoutStore.customerInfo?.firstName ?? '',
  lastName: checkoutStore.customerInfo?.lastName ?? '',
  email: checkoutStore.customerInfo?.email ?? '',
})

const selectedRegionId = ref(checkoutStore.shippingAddress?.regionId ?? '')
const selectedCityId = ref(checkoutStore.shippingAddress?.cityId ?? '')
const selectedCommuneId = ref(checkoutStore.shippingAddress?.communeId ?? '')
const selectedShippingOption = ref(checkoutStore.shippingOptionId ?? shippingOptions[0]?.id ?? '')

const formState = reactive({
  street: checkoutStore.shippingAddress?.street ?? '',
  number: checkoutStore.shippingAddress?.number ?? '',
  apartment: checkoutStore.shippingAddress?.apartment ?? '',
  instructions: checkoutStore.shippingAddress?.instructions ?? '',
})

const errorMessage = ref('')

const isCustomerFormLocked = computed(() => authStore.isAuthenticated)

const isCustomerFormValid = computed(() => {
  const trimmedFirstName = customerFormState.firstName.trim()
  const trimmedLastName = customerFormState.lastName.trim()
  const trimmedEmail = customerFormState.email.trim()

  return (
    trimmedFirstName.length > 0 &&
    trimmedLastName.length > 0 &&
    trimmedEmail.length > 0 &&
    REQUIRED_EMAIL_PATTERN.test(trimmedEmail)
  )
})

const availableCities = computed(() => {
  const region = regions.find((item) => item.id === selectedRegionId.value)
  return region?.cities ?? []
})

const availableCommunes = computed(() => {
  const city = availableCities.value.find((item) => item.id === selectedCityId.value)
  return city?.communes ?? []
})

const isFormValid = computed(() => {
  return (
    isCustomerFormValid.value &&
    Boolean(selectedRegionId.value) &&
    Boolean(selectedCityId.value) &&
    Boolean(selectedCommuneId.value) &&
    Boolean(formState.street) &&
    Boolean(formState.number) &&
    Boolean(selectedShippingOption.value)
  )
})

const applyCustomerInfo = (firstName: string, lastName: string, email: string) => {
  customerFormState.firstName = firstName
  customerFormState.lastName = lastName
  customerFormState.email = email
}

const resolveAuthenticatedCustomerInfo = () => {
  const firstName = authStore.user?.firstName?.trim() ?? ''
  const lastName = authStore.user?.lastName?.trim() ?? ''
  const email = authStore.user?.email?.trim() ?? ''

  applyCustomerInfo(firstName, lastName, email)
}

const hydrateCustomerForm = () => {
  if (authStore.isAuthenticated) {
    resolveAuthenticatedCustomerInfo()
    return
  }

  if (checkoutStore.customerInfo) {
    applyCustomerInfo(
      checkoutStore.customerInfo.firstName,
      checkoutStore.customerInfo.lastName,
      checkoutStore.customerInfo.email
    )
  }
}

watch(selectedRegionId, () => {
  selectedCityId.value = ''
  selectedCommuneId.value = ''
})

watch(selectedCityId, () => {
  selectedCommuneId.value = ''
})

watch(
  () => authStore.user,
  () => {
    if (authStore.isAuthenticated) {
      resolveAuthenticatedCustomerInfo()
    }
  }
)

watch(
  () => checkoutStore.customerInfo,
  (info) => {
    if (!authStore.isAuthenticated && info) {
      applyCustomerInfo(info.firstName, info.lastName, info.email)
    }
  }
)

const handleSubmit = () => {
  if (!isFormValid.value) {
    if (!isCustomerFormValid.value) {
      errorMessage.value = 'Ingresa los datos del cliente para continuar con el envío.'
      return
    }

    errorMessage.value = 'Completa todos los campos obligatorios para continuar.'
    return
  }

  const trimmedCustomerInfo = {
    firstName: customerFormState.firstName.trim(),
    lastName: customerFormState.lastName.trim(),
    email: customerFormState.email.trim(),
  }

  checkoutStore.setCustomerInfo(trimmedCustomerInfo)

  const region = regions.find((item) => item.id === selectedRegionId.value)
  const city = availableCities.value.find((item) => item.id === selectedCityId.value)
  const commune = availableCommunes.value.find((item) => item.id === selectedCommuneId.value)
  const shippingOption = shippingOptions.find((option) => option.id === selectedShippingOption.value)

  if (!region || !city || !commune || !shippingOption) {
    errorMessage.value = 'No pudimos validar los datos de despacho. Inténtalo nuevamente.'
    return
  }

  checkoutStore.setShippingDetails(
    {
      regionId: region.id,
      regionName: region.name,
      cityId: city.id,
      cityName: city.name,
      communeId: commune.id,
      communeName: commune.name,
      street: formState.street,
      number: formState.number,
      apartment: formState.apartment,
      instructions: formState.instructions,
    },
    shippingOption.id
  )

  errorMessage.value = ''
  router.push({ name: 'checkout-payment' })
}

onMounted(() => {
  if (cartStore.isEmpty) {
    router.replace('/productos')
    return
  }

  if (!checkoutStore.isReadyForShipping) {
    router.replace({ name: 'checkout-summary' })
    return
  }

  if (!checkoutStore.hasSale) {
    router.replace({ name: 'checkout-summary' })
  }

  hydrateCustomerForm()
})
</script>

<template>
  <section class="py-5 bg-light min-vh-100">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-12 col-xl-10">
          <div class="mb-4">
            <h1 class="h3 fw-bold mb-1">Datos de envío</h1>
            <p class="text-muted mb-0">Ingresa la dirección de despacho y el tipo de envío que prefieres.</p>
          </div>

          <div class="row g-4">
            <div class="col-12 col-lg-7">
              <div class="card border-0 shadow-sm rounded-4">
                <div class="card-body p-4">
                  <h2 class="h5 fw-bold mb-4">Datos del cliente</h2>
                  <div class="row g-3 mb-4">
                    <div class="col-12 col-md-6">
                      <label for="customer-first-name" class="form-label fw-semibold">Nombre</label>
                      <input
                        id="customer-first-name"
                        v-model="customerFormState.firstName"
                        type="text"
                        class="form-control form-control-lg"
                        placeholder="Ej: María"
                        :disabled="isCustomerFormLocked"
                        required
                      />
                    </div>
                    <div class="col-12 col-md-6">
                      <label for="customer-last-name" class="form-label fw-semibold">Apellidos</label>
                      <input
                        id="customer-last-name"
                        v-model="customerFormState.lastName"
                        type="text"
                        class="form-control form-control-lg"
                        placeholder="Ej: González Pérez"
                        :disabled="isCustomerFormLocked"
                        required
                      />
                    </div>
                    <div class="col-12">
                      <label for="customer-email" class="form-label fw-semibold">Correo electrónico</label>
                      <input
                        id="customer-email"
                        v-model="customerFormState.email"
                        type="email"
                        class="form-control form-control-lg"
                        placeholder="ejemplo@correo.com"
                        :disabled="isCustomerFormLocked"
                        required
                      />
                    </div>
                  </div>

                  <h2 class="h5 fw-bold mb-4">Dirección de despacho</h2>
                  <form class="row g-3" novalidate @submit.prevent="handleSubmit">
                    <div class="col-12 col-md-6">
                      <label for="region" class="form-label fw-semibold">Región</label>
                      <select
                        id="region"
                        v-model="selectedRegionId"
                        class="form-select form-select-lg"
                        required
                      >
                        <option value="" disabled>Selecciona una región</option>
                        <option v-for="region in regions" :key="region.id" :value="region.id">
                          {{ region.name }}
                        </option>
                      </select>
                    </div>
                    <div class="col-12 col-md-6">
                      <label for="city" class="form-label fw-semibold">Ciudad</label>
                      <select
                        id="city"
                        v-model="selectedCityId"
                        class="form-select form-select-lg"
                        :disabled="!selectedRegionId"
                        required
                      >
                        <option value="" disabled>Selecciona una ciudad</option>
                        <option v-for="city in availableCities" :key="city.id" :value="city.id">
                          {{ city.name }}
                        </option>
                      </select>
                    </div>
                    <div class="col-12">
                      <label for="commune" class="form-label fw-semibold">Comuna</label>
                      <select
                        id="commune"
                        v-model="selectedCommuneId"
                        class="form-select form-select-lg"
                        :disabled="!selectedCityId"
                        required
                      >
                        <option value="" disabled>Selecciona una comuna</option>
                        <option v-for="commune in availableCommunes" :key="commune.id" :value="commune.id">
                          {{ commune.name }}
                        </option>
                      </select>
                    </div>
                    <div class="col-12 col-md-8">
                      <label for="street" class="form-label fw-semibold">Calle</label>
                      <input
                        id="street"
                        v-model="formState.street"
                        type="text"
                        class="form-control form-control-lg"
                        placeholder="Ej: Av. Providencia"
                        required
                      />
                    </div>
                    <div class="col-12 col-md-4">
                      <label for="number" class="form-label fw-semibold">Número</label>
                      <input
                        id="number"
                        v-model="formState.number"
                        type="text"
                        class="form-control form-control-lg"
                        placeholder="Ej: 1234"
                        required
                      />
                    </div>
                    <div class="col-12 col-md-6">
                      <label for="apartment" class="form-label fw-semibold">Depto / Casa (opcional)</label>
                      <input
                        id="apartment"
                        v-model="formState.apartment"
                        type="text"
                        class="form-control form-control-lg"
                        placeholder="Ej: Dpto. 704"
                      />
                    </div>
                    <div class="col-12 col-md-6">
                      <label for="instructions" class="form-label fw-semibold">Referencia</label>
                      <input
                        id="instructions"
                        v-model="formState.instructions"
                        type="text"
                        class="form-control form-control-lg"
                        placeholder="Punto de referencia opcional"
                      />
                    </div>

                    <div class="col-12">
                      <div v-if="errorMessage" class="alert alert-warning">{{ errorMessage }}</div>
                      <AppButton label="Continuar al pago" size="lg" type="submit" />
                      <p class="text-muted small mb-0 mt-3">Paso 2 de 3 · Revisa que los datos sean correctos.</p>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <div class="col-12 col-lg-5">
              <div class="card border-0 shadow-sm rounded-4 h-100">
                <div class="card-body p-4">
                  <h2 class="h5 fw-bold mb-3">Tipo de envío</h2>
                  <p class="text-muted small mb-4">Selecciona uno de los métodos disponibles. Podrás modificarlos más adelante desde un mantenedor.</p>

                  <div class="d-flex flex-column gap-3">
                    <label
                      v-for="option in shippingOptions"
                      :key="option.id"
                      class="shipping-option border rounded-3 p-3 d-flex gap-3 align-items-start"
                    >
                      <input
                        v-model="selectedShippingOption"
                        class="form-check-input mt-1"
                        type="radio"
                        name="shipping-option"
                        :value="option.id"
                      />
                      <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-start">
                          <span class="fw-semibold">{{ option.name }}</span>
                          <strong>
                            {{
                              new Intl.NumberFormat('es-CL', {
                                style: 'currency',
                                currency: 'CLP',
                                minimumFractionDigits: 0,
                              }).format(option.price)
                            }}
                          </strong>
                        </div>
                        <small class="text-muted d-block">{{ option.description }}</small>
                        <small class="text-muted">Tiempo estimado: {{ option.eta }}</small>
                      </div>
                    </label>
                  </div>
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
.shipping-option {
  transition: all 0.2s ease;
}

.shipping-option:hover {
  border-color: var(--brand-primary);
  box-shadow: 0 12px 28px -24px rgba(102, 60, 44, 0.6);
}
</style>
