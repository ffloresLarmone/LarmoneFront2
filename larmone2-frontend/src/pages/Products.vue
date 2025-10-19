<template>
  <section class="products-page py-5">
    <div class="container">
      <header class="page-header rounded-4 shadow-sm bg-white p-4 p-lg-5 mb-5">
        <div class="d-flex flex-column flex-lg-row align-items-lg-end justify-content-between gap-4">
          <div>
            <p class="text-uppercase text-muted fw-semibold small mb-2">Catálogo Larmone</p>
            <h1 class="page-title mb-2">Nuestros esenciales para tu rutina</h1>
            <p class="page-subtitle mb-0">
              Explora el catálogo y encuentra el complemento perfecto para tu estilo.
            </p>
          </div>
          <form class="filters card border-0 shadow-sm" @submit.prevent="reload">
            <div class="card-body d-flex flex-column flex-md-row align-items-md-center gap-3">
              <div class="search-wrapper position-relative flex-grow-1">
                <input
                  v-model="filters.q"
                  type="search"
                  class="form-control search-input"
                  placeholder="Buscar por nombre o SKU"
                  aria-label="Buscar productos"
                />
                <i class="bi bi-search search-icon" aria-hidden="true"></i>
              </div>
              <div class="d-flex flex-column flex-md-row gap-2 w-100 w-md-auto">
                <select
                  v-model.number="filters.pageSize"
                  class="form-select"
                  aria-label="Resultados por página"
                >
                  <option :value="12">12 por página</option>
                  <option :value="24">24 por página</option>
                  <option :value="48">48 por página</option>
                </select>
                <AppButton
                  type="submit"
                  class="d-inline-flex align-items-center justify-content-center gap-2"
                >
                  <i class="bi bi-funnel" aria-hidden="true"></i>
                  Aplicar filtros
                </AppButton>
              </div>
            </div>
          </form>
        </div>
      </header>

      <div v-if="errorMessage" class="alert alert-warning brand-alert" role="alert">
        {{ errorMessage }}
      </div>

      <div v-if="isLoading" class="text-center py-5" role="status">
        <div class="spinner-border text-primary" role="status" aria-hidden="true"></div>
        <p class="mt-3 mb-0">Cargando productos...</p>
      </div>

      <div v-else>
        <div v-if="products.length" class="row g-4">
          <div v-for="producto in products" :key="producto.id" class="col-12 col-sm-6 col-lg-4">
            <ProductCard :producto="producto" />
          </div>
        </div>
        <div v-else class="text-center py-5 empty-state">
          <img
            src="https://placehold.co/320x200/FBE7F5/8C4FB9?text=Sin+resultados"
            alt="Sin resultados"
            class="img-fluid mb-3"
          />
          <h2 class="h5">No encontramos productos que coincidan con tu búsqueda.</h2>
          <p class="mb-4 text-muted">Intenta ajustar los filtros o explorar otras categorías.</p>
          <AppButton variant="secondary" @click="reload">Ver catálogo completo</AppButton>
        </div>

        <nav v-if="hasMorePages" class="pagination-wrapper d-flex justify-content-center mt-5">
          <ul class="pagination">
            <li :class="['page-item', { disabled: filters.page === 1 }]">
              <button class="page-link" type="button" @click="changePage(filters.page - 1)" :disabled="filters.page === 1">
                Anterior
              </button>
            </li>
            <li class="page-item disabled">
              <span class="page-link">Página {{ filters.page }} de {{ displayTotalPages }}</span>
            </li>
            <li :class="['page-item', { disabled: filters.page === displayTotalPages }]">
              <button
                class="page-link"
                type="button"
                @click="changePage(filters.page + 1)"
                :disabled="filters.page === displayTotalPages"
              >
                Siguiente
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import ProductCard from '../components/products/ProductCard.vue'
import { fetchProducts } from '../services/productService'
import { mapearProductosConImagenes } from '../services/imageService'
import type { Producto } from '../types/api'
import AppButton from '../components/atoms/AppButton.vue'

interface Filters {
  q: string
  page: number
  pageSize: number
}

const filters = reactive<Filters>({
  q: '',
  page: 1,
  pageSize: 12,
})

const isLoading = ref(false)
const errorMessage = ref('')
type ProductoConThumb = Producto & { _thumb?: string }

const products = ref<ProductoConThumb[]>([])
const total = ref(0)
const totalPages = ref(1)

const displayTotalPages = computed(() => Math.max(1, totalPages.value))

const hasMorePages = computed(() => displayTotalPages.value > 1)

async function loadProducts() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const response = await fetchProducts({
      q: filters.q,
      page: filters.page,
      pageSize: filters.pageSize,
    })
    products.value = await mapearProductosConImagenes(response.items)
    total.value = response.total
    totalPages.value = response.totalPages || Math.max(1, Math.ceil(response.total / response.pageSize))
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Ocurrió un error al cargar los productos. Por favor intenta nuevamente.'
    products.value = []
    total.value = 0
    totalPages.value = 1
  } finally {
    isLoading.value = false
  }
}

function changePage(page: number) {
  if (page < 1 || page > displayTotalPages.value) return
  filters.page = page
  loadProducts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function reload() {
  filters.page = 1
  loadProducts()
}

onMounted(() => {
  loadProducts()
})
</script>

<style scoped>
.products-page {
  background: linear-gradient(180deg, rgba(233, 30, 99, 0.04), rgba(140, 79, 185, 0.03));
  min-height: 100vh;
}

.page-header {
  border: 1px solid rgba(140, 79, 185, 0.12);
  background: rgba(255, 255, 255, 0.92);
}

.page-title {
  font-weight: 700;
  background: linear-gradient(120deg, var(--brand-primary), var(--brand-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-subtitle {
  color: var(--neutral-500);
}

.filters {
  border-radius: var(--radius-lg);
}

.filters .form-control,
.filters .form-select {
  border-radius: var(--radius-pill);
  border: 1px solid rgba(140, 79, 185, 0.15);
  padding: 0.65rem 1rem;
  background-color: rgba(255, 255, 255, 0.85);
}

.filters .form-select:focus,
.filters .form-control:focus {
  box-shadow: 0 0 0 0.2rem rgba(233, 30, 99, 0.15);
  border-color: rgba(233, 30, 99, 0.35);
}

.search-wrapper {
  min-width: 240px;
}

.search-input {
  padding-left: 2.5rem;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--brand-primary);
}

.brand-alert {
  background-color: rgba(233, 30, 99, 0.12);
  border: 1px solid rgba(233, 30, 99, 0.2);
  color: var(--brand-primary);
  border-radius: var(--radius-md);
}

.pagination .page-link {
  color: var(--neutral-500);
  border: none;
  border-radius: var(--radius-pill);
  margin: 0 0.25rem;
  background-color: rgba(233, 30, 99, 0.08);
  padding-inline: 1.25rem;
}

.pagination .page-link:hover {
  color: #fff;
  background: linear-gradient(130deg, var(--brand-primary), var(--brand-secondary));
}

.pagination .page-item.disabled .page-link {
  color: rgba(108, 93, 115, 0.6);
  background-color: rgba(233, 30, 99, 0.08);
  opacity: 0.6;
}

.empty-state {
  color: var(--neutral-700);
}
</style>
