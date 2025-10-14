<script setup lang="ts">
import AppButton from '../components/atoms/AppButton.vue'

const handleSubmit = () => {
  // Por implementar cuando se integre la autenticación real
}
</script>

<template>
  <section class="py-5">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-12 col-md-8 col-lg-5">
          <div class="card border-0 shadow-sm rounded-4 p-4 p-lg-5">
            <h1 class="h3 fw-bold mb-4 text-center">Iniciar sesión</h1>
            <form class="d-flex flex-column gap-3" @submit.prevent="handleSubmit">
              <div>
                <label for="email" class="form-label fw-semibold">Correo electrónico</label>
                <input id="email" type="email" class="form-control form-control-lg" placeholder="tu@email.com" required />
              </div>
              <div>
                <label for="password" class="form-label fw-semibold">Contraseña</label>
                <input id="password" type="password" class="form-control form-control-lg" placeholder="********" required />
              </div>
              <div class="d-flex justify-content-between align-items-center">
                <div class="form-check">
                  <input id="remember" class="form-check-input" type="checkbox" />
                  <label class="form-check-label" for="remember">Recordarme</label>
                </div>
                <a href="#" class="small text-decoration-underline">¿Olvidaste tu contraseña?</a>
              </div>
              <AppButton type="submit" label="Ingresar" size="lg" />
            </form>
            <p class="text-center text-muted mt-4 mb-0 small">
              ¿Aún no tienes cuenta? <a href="#" class="text-decoration-underline">Crea una ahora</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
