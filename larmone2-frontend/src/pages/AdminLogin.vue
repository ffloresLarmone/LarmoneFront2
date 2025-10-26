<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authenticateUser } from '../services/authService'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = reactive({
  email: '',
  password: '',
})

const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const redirectTarget = computed(() => {
  const redirectParam = route.query.redirect
  if (typeof redirectParam === 'string' && redirectParam.length > 0) {
    return redirectParam
  }
  return '/aurora/atelier'
})

const showPermissionWarning = computed(() => route.query.reason === 'forbidden')

const handleSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!form.email || !form.password) {
    errorMessage.value = 'Ingresa tu correo y contraseña para continuar.'
    return
  }

  isSubmitting.value = true

  try {
    const user = await authenticateUser({ email: form.email, password: form.password })

    if (!user) {
      errorMessage.value = 'Credenciales inválidas. Revisa tus datos e intenta nuevamente.'
      return
    }

    if (!authStore.hasAdminAccess(user)) {
      errorMessage.value = 'Tu cuenta no tiene permisos de administrador.'
      return
    }

    authStore.login(user)
    successMessage.value = 'Acceso concedido. Redirigiendo al panel de administración…'
    await router.push(redirectTarget.value)
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message || 'No fue posible iniciar sesión. Inténtalo más tarde.'
        : 'No fue posible iniciar sesión. Inténtalo más tarde.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <section class="admin-login py-5 py-lg-6">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-12 col-md-8 col-lg-5">
          <div class="card shadow-sm border-0 rounded-4 overflow-hidden">
            <div class="card-body p-4 p-lg-5">
              <div class="text-center mb-4">
                <p class="text-uppercase text-muted fw-semibold small mb-1">Acceso restringido</p>
                <h1 class="h4 mb-0">Panel de administración</h1>
              </div>

              <div v-if="showPermissionWarning" class="alert alert-warning" role="alert">
                Tu sesión anterior no cuenta con permisos suficientes. Inicia sesión con una cuenta administradora.
              </div>

              <div v-if="errorMessage" class="alert alert-danger" role="alert">{{ errorMessage }}</div>
              <div v-if="successMessage" class="alert alert-success" role="status">{{ successMessage }}</div>

              <form class="d-grid gap-3" @submit.prevent="handleSubmit">
                <div>
                  <label for="admin-email" class="form-label">Correo electrónico</label>
                  <input
                    id="admin-email"
                    v-model="form.email"
                    type="email"
                    class="form-control"
                    placeholder="admin@larmone.cl"
                    autocomplete="username"
                    required
                  />
                </div>
                <div>
                  <label for="admin-password" class="form-label">Contraseña</label>
                  <input
                    id="admin-password"
                    v-model="form.password"
                    type="password"
                    class="form-control"
                    placeholder="••••••••"
                    autocomplete="current-password"
                    required
                  />
                </div>
                <button type="submit" class="btn btn-dark w-100" :disabled="isSubmitting">
                  <span
                    v-if="isSubmitting"
                    class="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  {{ isSubmitting ? 'Verificando credenciales…' : 'Ingresar al panel' }}
                </button>
              </form>
            </div>
          </div>
          <p class="text-center text-muted small mt-3 mb-0">
            Solo cuentas con rol <strong>administrador</strong> pueden acceder a esta sección.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.admin-login {
  background: linear-gradient(180deg, #f7f5ff 0%, #ffffff 50%);
  min-height: calc(100vh - 88px);
}
</style>
