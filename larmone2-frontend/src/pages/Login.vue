<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '../components/atoms/AppButton.vue'
import { useAuthStore } from '../stores/auth'

type Mode = 'login' | 'register'

const router = useRouter()
const authStore = useAuthStore()

const mode = ref<Mode>('login')
const isSubmitting = ref(false)
const feedbackMessage = ref('')
const feedbackType = ref<'success' | 'error' | ''>('')

const loginForm = reactive({
  email: '',
  password: '',
  remember: false,
})

const registerForm = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
})

const cardTitle = computed(() => (mode.value === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta Larmone'))
const submitLabel = computed(() => {
  if (isSubmitting.value) {
    return mode.value === 'login' ? 'Ingresando…' : 'Registrando…'
  }

  return mode.value === 'login' ? 'Ingresar' : 'Crear cuenta'
})

const complementaryText = computed(() =>
  mode.value === 'login'
    ? '¿Aún no tienes cuenta? '
    : '¿Ya tienes una cuenta? ',
)

const complementaryLinkLabel = computed(() => (mode.value === 'login' ? 'Regístrate aquí' : 'Inicia sesión'))

const resetFeedback = () => {
  feedbackMessage.value = ''
  feedbackType.value = ''
}

const switchMode = (value: Mode) => {
  if (mode.value === value) return
  mode.value = value
  resetFeedback()
  isSubmitting.value = false
}

const handleSubmit = () => {
  resetFeedback()

  if (mode.value === 'login') {
    if (!loginForm.email || !loginForm.password) return

    isSubmitting.value = true

    setTimeout(() => {
      authStore.login(loginForm.email)
      isSubmitting.value = false
      router.push('/productos')
    }, 600)
    return
  }

  if (!registerForm.firstName || !registerForm.lastName || !registerForm.email || !registerForm.password) {
    feedbackMessage.value = 'Por favor completa todos los campos requeridos.'
    feedbackType.value = 'error'
    return
  }

  if (registerForm.password !== registerForm.confirmPassword) {
    feedbackMessage.value = 'Las contraseñas no coinciden. Intenta nuevamente.'
    feedbackType.value = 'error'
    return
  }

  if (!registerForm.acceptTerms) {
    feedbackMessage.value = 'Debes aceptar los términos y condiciones para continuar.'
    feedbackType.value = 'error'
    return
  }

  isSubmitting.value = true

  setTimeout(() => {
    isSubmitting.value = false
    feedbackMessage.value = '¡Tu cuenta ha sido creada! Ahora puedes iniciar sesión.'
    feedbackType.value = 'success'
    switchMode('login')
    loginForm.email = registerForm.email
  }, 800)
}
</script>

<template>
  <section class="login-page py-5 py-lg-6">
    <div class="container">
      <div class="row justify-content-center align-items-center g-5">
        <div class="col-12 col-lg-6 d-none d-lg-block">
          <div class="login-hero rounded-4 p-5 text-white shadow-lg">
            <p class="text-uppercase letter-spacing mb-3">Bienvenido a Larmone</p>
            <h1 class="display-6 fw-bold mb-4">Tu estilo empieza con una gran historia</h1>
            <p class="fs-5 opacity-75 mb-0">
              Descubre prendas que celebran tu personalidad. Inicia sesión para continuar tu viaje o crea una cuenta y
              déjate inspirar por nuestra colección.
            </p>
          </div>
        </div>
        <div class="col-12 col-lg-6">
          <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div class="bg-light p-4">
              <div class="btn-group w-100" role="group" aria-label="Modo de acceso">
                <button
                  type="button"
                  class="btn btn-lg"
                  :class="mode === 'login' ? 'btn-dark' : 'btn-outline-dark'"
                  @click="switchMode('login')"
                >
                  Iniciar sesión
                </button>
                <button
                  type="button"
                  class="btn btn-lg"
                  :class="mode === 'register' ? 'btn-dark' : 'btn-outline-dark'"
                  @click="switchMode('register')"
                >
                  Crear cuenta
                </button>
              </div>
            </div>
            <div class="p-4 p-lg-5">
              <h2 class="h3 fw-bold mb-4 text-center">{{ cardTitle }}</h2>
              <form class="d-flex flex-column gap-4" @submit.prevent="handleSubmit">
                <template v-if="mode === 'login'">
                  <div>
                    <label for="login-email" class="form-label fw-semibold">Correo electrónico</label>
                    <input
                      id="login-email"
                      v-model="loginForm.email"
                      type="email"
                      class="form-control form-control-lg"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                  <div>
                    <label for="login-password" class="form-label fw-semibold">Contraseña</label>
                    <input
                      id="login-password"
                      v-model="loginForm.password"
                      type="password"
                      class="form-control form-control-lg"
                      placeholder="********"
                      required
                    />
                  </div>
                  <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div class="form-check">
                      <input id="remember" v-model="loginForm.remember" class="form-check-input" type="checkbox" />
                      <label class="form-check-label" for="remember">Recordarme</label>
                    </div>
                    <a href="#" class="small text-decoration-underline">¿Olvidaste tu contraseña?</a>
                  </div>
                </template>

                <template v-else>
                  <div class="row g-3">
                    <div class="col-12 col-md-6">
                      <label for="register-firstName" class="form-label fw-semibold">Nombre</label>
                      <input
                        id="register-firstName"
                        v-model="registerForm.firstName"
                        type="text"
                        class="form-control form-control-lg"
                        placeholder="Andrea"
                        required
                      />
                    </div>
                    <div class="col-12 col-md-6">
                      <label for="register-lastName" class="form-label fw-semibold">Apellido</label>
                      <input
                        id="register-lastName"
                        v-model="registerForm.lastName"
                        type="text"
                        class="form-control form-control-lg"
                        placeholder="López"
                        required
                      />
                    </div>
                    <div class="col-12">
                      <label for="register-email" class="form-label fw-semibold">Correo electrónico</label>
                      <input
                        id="register-email"
                        v-model="registerForm.email"
                        type="email"
                        class="form-control form-control-lg"
                        placeholder="andrea@email.com"
                        required
                      />
                    </div>
                    <div class="col-12 col-md-6">
                      <label for="register-phone" class="form-label fw-semibold">Teléfono</label>
                      <input
                        id="register-phone"
                        v-model="registerForm.phone"
                        type="tel"
                        class="form-control form-control-lg"
                        placeholder="55 1234 5678"
                      />
                    </div>
                    <div class="col-12 col-md-6">
                      <label for="register-password" class="form-label fw-semibold">Contraseña</label>
                      <input
                        id="register-password"
                        v-model="registerForm.password"
                        type="password"
                        class="form-control form-control-lg"
                        placeholder="Crea una contraseña segura"
                        required
                      />
                    </div>
                    <div class="col-12">
                      <label for="register-confirm" class="form-label fw-semibold">Confirma tu contraseña</label>
                      <input
                        id="register-confirm"
                        v-model="registerForm.confirmPassword"
                        type="password"
                        class="form-control form-control-lg"
                        placeholder="Repite tu contraseña"
                        required
                      />
                    </div>
                    <div class="col-12">
                      <div class="form-check">
                        <input
                          id="register-terms"
                          v-model="registerForm.acceptTerms"
                          class="form-check-input"
                          type="checkbox"
                          required
                        />
                        <label class="form-check-label" for="register-terms">
                          Acepto los <a href="#" class="text-decoration-underline">términos y condiciones</a>
                        </label>
                      </div>
                    </div>
                  </div>
                </template>

                <div v-if="feedbackMessage" class="alert" :class="feedbackType === 'success' ? 'alert-success' : 'alert-danger'">
                  {{ feedbackMessage }}
                </div>

                <AppButton :disabled="isSubmitting" type="submit" :label="submitLabel" size="lg" />
              </form>
              <p class="text-center text-muted mt-4 mb-0 small">
                {{ complementaryText }}
                <button class="btn btn-link p-0 align-baseline text-decoration-underline" type="button" @click="switchMode(mode === 'login' ? 'register' : 'login')">
                  {{ complementaryLinkLabel }}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.login-page {
  background: linear-gradient(135deg, #f8f9fb 0%, #eef2ff 45%, #fef6fb 100%);
  min-height: calc(100vh - 88px);
}

.login-hero {
  background: linear-gradient(140deg, rgba(65, 105, 225, 0.9), rgba(238, 130, 238, 0.9));
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.letter-spacing {
  letter-spacing: 0.35em;
}

.btn-group .btn {
  font-weight: 600;
}

.btn-group .btn-dark {
  border-color: #212529;
}

.alert {
  border-radius: 0.75rem;
  padding: 0.85rem 1.1rem;
}
</style>
