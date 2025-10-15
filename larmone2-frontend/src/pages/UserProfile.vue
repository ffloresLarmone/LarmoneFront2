<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppButton from '../components/atoms/AppButton.vue'
import { useToast } from '../composables/useToast'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'

interface OrderItemSummary {
  name: string
  quantity: number
  price: number
}

type OrderStatus = 'Entregado' | 'En tránsito' | 'En preparación' | 'Cancelado'

interface OrderSummary {
  id: number
  number: string
  date: string
  status: OrderStatus
  total: number
  items: OrderItemSummary[]
  deliveryAddress: string
  trackingCode?: string
  estimatedDelivery?: string
}

interface AddressRecord {
  id: number
  alias: string
  recipient: string
  street: string
  city: string
  region: string
  phone: string
  instructions?: string
  isDefault: boolean
}

interface FavoriteProduct {
  id: number
  name: string
  image: string
  price: number
  description: string
  available: boolean
}

const authStore = useAuthStore()
const cartStore = useCartStore()
const { showToast } = useToast()

const currencyFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  minimumFractionDigits: 0,
})

const formatCurrency = (value: number) => currencyFormatter.format(value)

const orders = ref<OrderSummary[]>([
  {
    id: 1,
    number: 'LB-2024-00452',
    date: '2024-05-28',
    status: 'Entregado',
    total: 68490,
    deliveryAddress: 'Av. Providencia 1234, Depto. 702, Santiago',
    trackingCode: 'FE-00921123',
    estimatedDelivery: '28 de mayo de 2024',
    items: [
      { name: 'Serum facial vitamina C 30ml', quantity: 1, price: 24990 },
      { name: 'Crema hidratante día/noche 50ml', quantity: 2, price: 43500 },
    ],
  },
  {
    id: 2,
    number: 'LB-2024-00421',
    date: '2024-04-12',
    status: 'En tránsito',
    total: 38990,
    deliveryAddress: 'Pasaje Las Magnolias 45, Maipú, Santiago',
    trackingCode: 'FE-00910888',
    estimatedDelivery: '2 de mayo de 2024',
    items: [
      { name: 'Limpiador en espuma piel sensible', quantity: 1, price: 15990 },
      { name: 'Protector solar FPS50 60ml', quantity: 1, price: 23000 },
    ],
  },
  {
    id: 3,
    number: 'LB-2024-00388',
    date: '2024-03-05',
    status: 'En preparación',
    total: 45980,
    deliveryAddress: 'Av. Providencia 1234, Depto. 702, Santiago',
    items: [
      { name: 'Tónico equilibrante 120ml', quantity: 2, price: 22990 },
    ],
  },
])

const userProfile = reactive({
  fullName: 'María José Rojas',
  email: authStore.user?.email ?? 'maria.rojas@example.com',
  phone: '+56 9 4567 8901',
  document: '18.456.789-5',
  birthday: '1990-08-17',
})

const personalInfoForm = reactive({ ...userProfile })
const personalInfoError = ref('')

const savePersonalInfo = () => {
  if (!personalInfoForm.fullName.trim()) {
    personalInfoError.value = 'Debes ingresar tu nombre y apellidos.'
    return
  }

  personalInfoError.value = ''
  Object.assign(userProfile, personalInfoForm)
  showToast({
    title: 'Datos actualizados',
    message: 'Tu información personal se guardó correctamente.',
    variant: 'success',
  })
}

const resetPersonalInfo = () => {
  Object.assign(personalInfoForm, userProfile)
  personalInfoError.value = ''
}

const addresses = ref<AddressRecord[]>([
  {
    id: 1,
    alias: 'Casa',
    recipient: 'María José Rojas',
    street: 'Av. Providencia 1234, Depto. 702',
    city: 'Providencia',
    region: 'Región Metropolitana',
    phone: '+56 9 4567 8901',
    instructions: 'Conserjería disponible hasta las 22:00.',
    isDefault: true,
  },
  {
    id: 2,
    alias: 'Oficina',
    recipient: 'María José Rojas',
    street: 'Cerro El Plomo 5630, Piso 11',
    city: 'Las Condes',
    region: 'Región Metropolitana',
    phone: '+56 2 2390 1122',
    instructions: 'Entregar en recepción torre sur.',
    isDefault: false,
  },
])

let addressCounter = addresses.value.length + 1

const editingAddressId = ref<number | null>(addresses.value[0]?.id ?? null)

const addressForm = reactive({
  alias: addresses.value[0]?.alias ?? '',
  recipient: addresses.value[0]?.recipient ?? '',
  street: addresses.value[0]?.street ?? '',
  city: addresses.value[0]?.city ?? '',
  region: addresses.value[0]?.region ?? '',
  phone: addresses.value[0]?.phone ?? '',
  instructions: addresses.value[0]?.instructions ?? '',
  isDefault: addresses.value[0]?.isDefault ?? false,
})

const addressError = ref('')

const setDefaultAddress = (id: number) => {
  addresses.value = addresses.value.map((address) => ({
    ...address,
    isDefault: address.id === id,
  }))

  const selected = addresses.value.find((address) => address.id === id)
  if (selected) {
    editingAddressId.value = id
    Object.assign(addressForm, selected)
  }

  showToast({
    title: 'Dirección principal actualizada',
    message: 'Usaremos esta dirección como predeterminada para tus envíos.',
    variant: 'info',
  })
}

const startCreateAddress = () => {
  editingAddressId.value = null
  Object.assign(addressForm, {
    alias: '',
    recipient: userProfile.fullName,
    street: '',
    city: '',
    region: '',
    phone: userProfile.phone,
    instructions: '',
    isDefault: addresses.value.length === 0,
  })
  addressError.value = ''
}

const editAddress = (address: AddressRecord) => {
  editingAddressId.value = address.id
  Object.assign(addressForm, address)
  addressError.value = ''
}

const cancelAddressEdit = () => {
  if (!addresses.value.length) {
    startCreateAddress()
    return
  }

  const fallback = addresses.value.find((address) => address.isDefault) ?? addresses.value[0]
  editingAddressId.value = fallback.id
  Object.assign(addressForm, fallback)
  addressError.value = ''
}

const validateAddressForm = () => {
  if (!addressForm.alias.trim() || !addressForm.street.trim() || !addressForm.city.trim()) {
    addressError.value = 'Completa al menos el alias, la dirección y la comuna.'
    return false
  }

  addressError.value = ''
  return true
}

const saveAddress = () => {
  if (!validateAddressForm()) return

  if (editingAddressId.value) {
    addresses.value = addresses.value.map((address) => {
      if (address.id === editingAddressId.value) {
        return { ...address, ...addressForm, isDefault: addressForm.isDefault }
      }

      if (addressForm.isDefault) {
        return { ...address, isDefault: false }
      }

      return address
    })
    showToast({
      title: 'Dirección actualizada',
      message: 'Guardamos los cambios de tu dirección.',
      variant: 'success',
    })
    return
  }

  const newId = addressCounter++
  const newAddress: AddressRecord = {
    id: newId,
    alias: addressForm.alias,
    recipient: addressForm.recipient,
    street: addressForm.street,
    city: addressForm.city,
    region: addressForm.region,
    phone: addressForm.phone,
    instructions: addressForm.instructions,
    isDefault: addressForm.isDefault,
  }

  if (newAddress.isDefault) {
    addresses.value = addresses.value.map((address) => ({ ...address, isDefault: false }))
  }

  addresses.value = [...addresses.value, newAddress]
  editingAddressId.value = newId

  showToast({
    title: 'Dirección agregada',
    message: 'Tu nueva dirección quedó guardada y disponible para futuros envíos.',
    variant: 'success',
  })
}

const removeAddress = (id: number) => {
  const removed = addresses.value.find((address) => address.id === id)
  addresses.value = addresses.value.filter((address) => address.id !== id)

  if (editingAddressId.value === id) {
    const fallback = addresses.value[0]
    editingAddressId.value = fallback?.id ?? null
    if (fallback) {
      Object.assign(addressForm, fallback)
    } else {
      startCreateAddress()
    }
  }

  if (removed?.isDefault && addresses.value.length > 0) {
    addresses.value = addresses.value.map((address, index) => ({
      ...address,
      isDefault: index === 0,
    }))
    Object.assign(addressForm, addresses.value[0])
    editingAddressId.value = addresses.value[0].id
  }

  showToast({
    title: 'Dirección eliminada',
    message: 'La dirección ya no estará disponible en tus envíos.',
    variant: 'warning',
  })
}

const favorites = ref<FavoriteProduct[]>([
  {
    id: 101,
    name: 'Aceite desmaquillante nutritivo 120ml',
    description: 'Disuelve maquillaje y protector solar sin resecar la piel.',
    price: 19990,
    image: 'https://placehold.co/400x260/FFE5D9/663C2C?text=Aceite',
    available: true,
  },
  {
    id: 102,
    name: 'Crema contorno de ojos iluminadora',
    description: 'Atenúa ojeras y aporta luminosidad al contorno.',
    price: 17990,
    image: 'https://placehold.co/400x260/E0F2F1/00695C?text=Ojos',
    available: true,
  },
  {
    id: 103,
    name: 'Mascarilla nocturna reparadora 75ml',
    description: 'Recupera la hidratación mientras duermes.',
    price: 22990,
    image: 'https://placehold.co/400x260/EDE7F6/4527A0?text=Mascarilla',
    available: false,
  },
])

const removingFavoriteId = ref<number | null>(null)
const addingFavoriteId = ref<number | null>(null)

const removeFavorite = (id: number) => {
  removingFavoriteId.value = id
  favorites.value = favorites.value.filter((favorite) => favorite.id !== id)
  removingFavoriteId.value = null

  showToast({
    title: 'Producto eliminado de favoritos',
    message: 'Puedes volver a agregarlo cuando quieras desde la ficha del producto.',
    variant: 'warning',
  })
}

const addFavoriteToCart = async (product: FavoriteProduct) => {
  if (!product.available) {
    showToast({
      title: 'Producto sin stock',
      message: 'Te avisaremos cuando vuelva a estar disponible.',
      variant: 'danger',
    })
    return
  }

  addingFavoriteId.value = product.id
  try {
    await cartStore.addItem({
      id_variante: product.id,
      cantidad: 1,
      precio_unitario: product.price,
      nombre: product.name,
      imagen: product.image,
    })
    showToast({
      title: 'Producto añadido al carrito',
      message: `${product.name} se agregó a tu carrito exitosamente.`,
      variant: 'success',
    })
  } finally {
    addingFavoriteId.value = null
  }
}

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const passwordError = ref('')
const isUpdatingPassword = ref(false)

const updatePassword = () => {
  if (!passwordForm.currentPassword.trim()) {
    passwordError.value = 'Debes ingresar tu contraseña actual.'
    return
  }

  if (passwordForm.newPassword.length < 8) {
    passwordError.value = 'La nueva contraseña debe tener al menos 8 caracteres.'
    return
  }

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = 'Las contraseñas nuevas no coinciden.'
    return
  }

  passwordError.value = ''
  isUpdatingPassword.value = true

  window.setTimeout(() => {
    isUpdatingPassword.value = false
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''

    showToast({
      title: 'Contraseña actualizada',
      message: 'Cambiaste tu contraseña correctamente.',
      variant: 'success',
    })
  }, 1200)
}

const ordersCount = computed(() => orders.value.length)
const addressCount = computed(() => addresses.value.length)
const favoriteCount = computed(() => favorites.value.length)
const defaultAddress = computed(() => addresses.value.find((address) => address.isDefault) ?? null)

const isAuthenticated = computed(() => authStore.isAuthenticated)

const statusBadgeClass = (status: OrderStatus) => {
  switch (status) {
    case 'Entregado':
      return 'badge bg-success-subtle text-success'
    case 'En tránsito':
      return 'badge bg-info-subtle text-info'
    case 'En preparación':
      return 'badge bg-warning-subtle text-warning'
    case 'Cancelado':
    default:
      return 'badge bg-danger-subtle text-danger'
  }
}
</script>

<template>
  <section class="py-5 bg-light min-vh-100">
    <div class="container">
      <div class="mb-5 text-center text-md-start">
        <p class="text-uppercase text-muted fw-semibold small mb-2">Mi cuenta</p>
        <h1 class="display-6 fw-bold mb-2">Perfil de usuario</h1>
        <p class="text-muted mb-0">
          Consulta tus pedidos, administra tus datos personales y mantén tus direcciones y favoritos siempre al día.
        </p>
      </div>

      <div v-if="!isAuthenticated" class="row justify-content-center">
        <div class="col-12 col-lg-8">
          <div class="card border-0 shadow-sm rounded-4">
            <div class="card-body p-5 text-center">
              <h2 class="h4 fw-bold mb-3">Inicia sesión para ver tu perfil</h2>
              <p class="text-muted mb-4">
                Necesitamos que te autentiques para mostrar tu información personal y el historial de pedidos.
              </p>
              <RouterLink to="/login" class="btn btn-brand btn-lg px-4">Ir a iniciar sesión</RouterLink>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="d-flex flex-column gap-4">
        <div class="card border-0 shadow-sm rounded-4">
          <div class="card-body p-4 p-lg-5">
            <div class="row g-4 align-items-center">
              <div class="col-12 col-md-6">
                <h2 class="h4 fw-bold mb-2">Hola, {{ userProfile.fullName.split(' ')[0] }} 👋</h2>
                <p class="text-muted mb-0">
                  Revisa todo lo relacionado con tu cuenta. Puedes actualizar tus datos, seguir tus pedidos y gestionar tus
                  direcciones favoritas.
                </p>
              </div>
              <div class="col-12 col-md-6">
                <div class="row row-cols-1 row-cols-sm-3 g-3">
                  <div class="col">
                    <div class="summary-tile">
                      <span class="summary-value">{{ ordersCount }}</span>
                      <span class="summary-label">Pedidos</span>
                    </div>
                  </div>
                  <div class="col">
                    <div class="summary-tile">
                      <span class="summary-value">{{ addressCount }}</span>
                      <span class="summary-label">Direcciones</span>
                    </div>
                  </div>
                  <div class="col">
                    <div class="summary-tile">
                      <span class="summary-value">{{ favoriteCount }}</span>
                      <span class="summary-label">Favoritos</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card border-0 shadow-sm rounded-4">
          <div class="card-body p-4 p-lg-5">
            <div class="d-flex flex-column flex-lg-row align-items-start justify-content-between gap-4 mb-4">
              <div>
                <h2 class="h4 fw-bold mb-1">Historial de pedidos</h2>
                <p class="text-muted mb-0">Aquí encontrarás el estado actual y los detalles de cada compra.</p>
              </div>
              <RouterLink class="btn btn-outline-primary btn-sm fw-semibold px-4" to="/productos">
                Explorar productos
              </RouterLink>
            </div>

            <div class="d-flex flex-column gap-4">
              <article v-for="order in orders" :key="order.id" class="order-card">
                <header class="d-flex flex-column flex-md-row justify-content-between gap-3">
                  <div>
                    <h3 class="h5 fw-bold mb-1">Pedido #{{ order.number }}</h3>
                    <p class="text-muted small mb-2">Realizado el {{ new Date(order.date).toLocaleDateString('es-CL') }}</p>
                    <span :class="statusBadgeClass(order.status)">{{ order.status }}</span>
                  </div>
                  <div class="text-md-end">
                    <p class="mb-1 text-muted small">Total</p>
                    <p class="h5 fw-bold text-primary mb-0">{{ formatCurrency(order.total) }}</p>
                  </div>
                </header>

                <hr />

                <ul class="list-unstyled mb-3 d-flex flex-column gap-2">
                  <li v-for="item in order.items" :key="item.name" class="d-flex justify-content-between gap-3">
                    <div>
                      <p class="mb-0 fw-semibold">{{ item.name }}</p>
                      <span class="text-muted small">Cantidad: {{ item.quantity }}</span>
                    </div>
                    <div class="text-end">
                      <p class="mb-0 fw-semibold">{{ formatCurrency(item.price) }}</p>
                      <span class="text-muted small">Subtotal</span>
                    </div>
                  </li>
                </ul>

                <div class="d-flex flex-column flex-md-row justify-content-between gap-3 small text-muted">
                  <div>
                    <strong>Envío a:</strong>
                    <span>{{ order.deliveryAddress }}</span>
                  </div>
                  <div class="text-md-end">
                    <div v-if="order.trackingCode">
                      <strong>Seguimiento:</strong>
                      <span>{{ order.trackingCode }}</span>
                    </div>
                    <div v-if="order.estimatedDelivery">
                      <strong>Entrega estimada:</strong>
                      <span>{{ order.estimatedDelivery }}</span>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>

        <div class="row g-4">
          <div class="col-12 col-xl-6">
            <div class="card border-0 shadow-sm rounded-4 h-100">
              <div class="card-body p-4 p-lg-5">
                <h2 class="h4 fw-bold mb-3">Información personal</h2>
                <p class="text-muted small mb-4">
                  Mantén tus datos actualizados para agilizar futuros pedidos y recibir novedades personalizadas.
                </p>

                <form class="d-flex flex-column gap-3" @submit.prevent="savePersonalInfo">
                  <div>
                    <label for="profile-name" class="form-label">Nombre completo</label>
                    <input
                      id="profile-name"
                      v-model="personalInfoForm.fullName"
                      type="text"
                      class="form-control form-control-lg"
                      placeholder="Nombre y apellidos"
                      required
                    />
                  </div>
                  <div>
                    <label for="profile-email" class="form-label">Correo electrónico</label>
                    <input
                      id="profile-email"
                      v-model="personalInfoForm.email"
                      type="email"
                      class="form-control"
                      placeholder="correo@ejemplo.cl"
                    />
                  </div>
                  <div class="row g-3">
                    <div class="col-12 col-md-6">
                      <label for="profile-phone" class="form-label">Teléfono</label>
                      <input
                        id="profile-phone"
                        v-model="personalInfoForm.phone"
                        type="tel"
                        class="form-control"
                        placeholder="+56 9 1234 5678"
                      />
                    </div>
                    <div class="col-12 col-md-6">
                      <label for="profile-document" class="form-label">Documento</label>
                      <input
                        id="profile-document"
                        v-model="personalInfoForm.document"
                        type="text"
                        class="form-control"
                        placeholder="12.345.678-9"
                      />
                    </div>
                  </div>
                  <div>
                    <label for="profile-birthday" class="form-label">Fecha de nacimiento</label>
                    <input id="profile-birthday" v-model="personalInfoForm.birthday" type="date" class="form-control" />
                  </div>

                  <p v-if="personalInfoError" class="text-danger small mb-0">{{ personalInfoError }}</p>

                  <div class="d-flex gap-3 pt-2">
                    <AppButton type="submit" label="Guardar cambios" />
                    <AppButton type="button" variant="outline-primary" label="Restablecer" @click="resetPersonalInfo" />
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div class="col-12 col-xl-6">
            <div class="card border-0 shadow-sm rounded-4 h-100">
              <div class="card-body p-4 p-lg-5">
                <h2 class="h4 fw-bold mb-3">Cambiar contraseña</h2>
                <p class="text-muted small mb-4">
                  Usa una contraseña robusta que incluya letras, números y símbolos para proteger tu cuenta.
                </p>

                <form class="d-flex flex-column gap-3" @submit.prevent="updatePassword">
                  <div>
                    <label for="current-password" class="form-label">Contraseña actual</label>
                    <input
                      id="current-password"
                      v-model="passwordForm.currentPassword"
                      type="password"
                      class="form-control"
                      placeholder="********"
                      required
                    />
                  </div>
                  <div class="row g-3">
                    <div class="col-12 col-md-6">
                      <label for="new-password" class="form-label">Nueva contraseña</label>
                      <input
                        id="new-password"
                        v-model="passwordForm.newPassword"
                        type="password"
                        class="form-control"
                        placeholder="********"
                        minlength="8"
                        required
                      />
                    </div>
                    <div class="col-12 col-md-6">
                      <label for="confirm-password" class="form-label">Confirmar contraseña</label>
                      <input
                        id="confirm-password"
                        v-model="passwordForm.confirmPassword"
                        type="password"
                        class="form-control"
                        placeholder="********"
                        minlength="8"
                        required
                      />
                    </div>
                  </div>

                  <p v-if="passwordError" class="text-danger small mb-0">{{ passwordError }}</p>

                  <div class="pt-2">
                    <AppButton
                      type="submit"
                      label="Actualizar contraseña"
                      :disabled="isUpdatingPassword"
                      :variant="isUpdatingPassword ? 'outline-primary' : 'primary'"
                    />
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        <div class="row g-4">
          <div class="col-12 col-xl-6">
            <div class="card border-0 shadow-sm rounded-4 h-100">
              <div class="card-body p-4 p-lg-5 d-flex flex-column gap-4">
                <div class="d-flex flex-column flex-lg-row justify-content-between gap-3">
                  <div>
                    <h2 class="h4 fw-bold mb-1">Direcciones de envío</h2>
                    <p class="text-muted small mb-0">Administra dónde quieres recibir tus pedidos.</p>
                  </div>
                  <AppButton label="Nueva dirección" variant="outline-primary" size="sm" @click="startCreateAddress" />
                </div>

                <div class="d-flex flex-column gap-3">
                  <div
                    v-for="address in addresses"
                    :key="address.id"
                    class="address-card"
                    :class="{ 'address-card--active': editingAddressId === address.id }"
                  >
                    <div class="d-flex justify-content-between align-items-start gap-3">
                      <div>
                        <h3 class="h6 fw-bold mb-1">{{ address.alias }}</h3>
                        <p class="mb-1 small">{{ address.recipient }}</p>
                        <p class="mb-1 small">{{ address.street }}</p>
                        <p class="mb-1 small text-muted">{{ address.city }}, {{ address.region }}</p>
                        <p class="mb-0 small text-muted">Teléfono: {{ address.phone }}</p>
                        <p v-if="address.instructions" class="mb-0 small text-muted">{{ address.instructions }}</p>
                      </div>
                      <div class="text-end d-flex flex-column gap-2">
                        <span v-if="address.isDefault" class="badge bg-primary-subtle text-primary">Predeterminada</span>
                        <AppButton label="Editar" variant="outline-primary" size="sm" @click="editAddress(address)" />
                        <AppButton
                          v-if="!address.isDefault"
                          label="Eliminar"
                          variant="outline-primary"
                          size="sm"
                          @click="removeAddress(address.id)"
                        />
                        <AppButton
                          v-if="!address.isDefault"
                          label="Usar como principal"
                          variant="link"
                          size="sm"
                          @click="setDefaultAddress(address.id)"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div class="p-4 bg-light rounded-4">
                  <h3 class="h6 fw-bold mb-3">
                    {{ editingAddressId ? 'Editar dirección seleccionada' : 'Agregar nueva dirección' }}
                  </h3>

                  <form class="d-flex flex-column gap-3" @submit.prevent="saveAddress">
                    <div class="row g-3">
                      <div class="col-12 col-md-6">
                        <label for="address-alias" class="form-label">Alias</label>
                        <input id="address-alias" v-model="addressForm.alias" type="text" class="form-control" required />
                      </div>
                      <div class="col-12 col-md-6">
                        <label for="address-recipient" class="form-label">Destinatario</label>
                        <input
                          id="address-recipient"
                          v-model="addressForm.recipient"
                          type="text"
                          class="form-control"
                        />
                      </div>
                    </div>
                    <div>
                      <label for="address-street" class="form-label">Dirección</label>
                      <input
                        id="address-street"
                        v-model="addressForm.street"
                        type="text"
                        class="form-control"
                        placeholder="Calle y número, departamento"
                        required
                      />
                    </div>
                    <div class="row g-3">
                      <div class="col-12 col-md-6">
                        <label for="address-city" class="form-label">Comuna / Ciudad</label>
                        <input id="address-city" v-model="addressForm.city" type="text" class="form-control" required />
                      </div>
                      <div class="col-12 col-md-6">
                        <label for="address-region" class="form-label">Región</label>
                        <input id="address-region" v-model="addressForm.region" type="text" class="form-control" />
                      </div>
                    </div>
                    <div class="row g-3">
                      <div class="col-12 col-md-6">
                        <label for="address-phone" class="form-label">Teléfono</label>
                        <input id="address-phone" v-model="addressForm.phone" type="tel" class="form-control" />
                      </div>
                      <div class="col-12 col-md-6">
                        <label for="address-instructions" class="form-label">Indicaciones</label>
                        <input
                          id="address-instructions"
                          v-model="addressForm.instructions"
                          type="text"
                          class="form-control"
                          placeholder="Opcional"
                        />
                      </div>
                    </div>
                    <div class="form-check">
                      <input
                        id="address-default"
                        v-model="addressForm.isDefault"
                        class="form-check-input"
                        type="checkbox"
                      />
                      <label class="form-check-label" for="address-default">Usar como dirección principal</label>
                    </div>

                    <p v-if="addressError" class="text-danger small mb-0">{{ addressError }}</p>

                    <div class="d-flex gap-3">
                      <AppButton type="submit" label="Guardar dirección" />
                      <AppButton
                        type="button"
                        variant="outline-primary"
                        label="Cancelar"
                        @click="cancelAddressEdit"
                      />
                    </div>
                  </form>
                </div>

                <div v-if="defaultAddress" class="alert alert-info mb-0">
                  <strong>Dirección preferida:</strong>
                  {{ defaultAddress.alias }} · {{ defaultAddress.street }} ({{ defaultAddress.city }})
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 col-xl-6">
            <div class="card border-0 shadow-sm rounded-4 h-100">
              <div class="card-body p-4 p-lg-5 d-flex flex-column gap-4">
                <div class="d-flex flex-column flex-lg-row justify-content-between gap-3">
                  <div>
                    <h2 class="h4 fw-bold mb-1">Productos favoritos</h2>
                    <p class="text-muted small mb-0">Añade rápidamente tus imprescindibles al carrito.</p>
                  </div>
                </div>

                <div class="row g-3">
                  <div v-for="product in favorites" :key="product.id" class="col-12 col-md-6">
                    <div class="favorite-card h-100 d-flex flex-column">
                      <div class="favorite-card__image rounded-4 overflow-hidden mb-3">
                        <img :src="product.image" :alt="product.name" />
                      </div>
                      <h3 class="h6 fw-bold mb-1">{{ product.name }}</h3>
                      <p class="text-muted small mb-2">{{ product.description }}</p>
                      <p class="fw-semibold text-primary mb-3">{{ formatCurrency(product.price) }}</p>
                      <div class="mt-auto d-flex flex-column gap-2">
                        <AppButton
                          label="Agregar al carrito"
                          size="sm"
                          :disabled="!product.available || addingFavoriteId === product.id"
                          @click="addFavoriteToCart(product)"
                        />
                        <AppButton
                          label="Quitar de favoritos"
                          variant="outline-primary"
                          size="sm"
                          :disabled="removingFavoriteId === product.id"
                          @click="removeFavorite(product.id)"
                        />
                        <span v-if="!product.available" class="badge bg-warning-subtle text-warning">
                          No disponible temporalmente
                        </span>
                      </div>
                    </div>
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
.summary-tile {
  background: var(--bs-light);
  border-radius: 1.5rem;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: flex-start;
}

.summary-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--brand-primary);
}

.summary-label {
  font-size: 0.875rem;
  color: var(--bs-secondary-color);
}

.order-card {
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 1.5rem;
  padding: 1.5rem;
  background: #fff;
  box-shadow: 0 12px 24px rgba(34, 33, 66, 0.08);
}

.address-card {
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 1.25rem;
  padding: 1.25rem;
  background: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.address-card--active {
  border-color: var(--brand-primary);
  box-shadow: 0 8px 24px rgba(203, 164, 140, 0.25);
}

.favorite-card {
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 1.5rem;
  padding: 1.5rem;
  background: #fff;
  box-shadow: 0 8px 20px rgba(34, 33, 66, 0.08);
}

.favorite-card__image {
  width: 100%;
  background: rgba(255, 229, 217, 0.5);
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.favorite-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 575.98px) {
  .summary-tile {
    align-items: center;
    text-align: center;
  }
}
</style>
