<template>
  <section class="products-page py-5">
    <div class="container">
      <header class="d-flex flex-column flex-md-row align-items-md-end justify-content-between gap-4 mb-4">
        <div>
          <h1 class="page-title mb-2">Catálogo de Productos</h1>
          <p class="page-subtitle mb-0">
            Explora nuestro catálogo y encuentra el complemento perfecto para tu estilo.
          </p>
        </div>
        <form class="filters d-flex flex-column flex-md-row gap-3" @submit.prevent="reload">
          <div class="search-wrapper position-relative">
            <input
              v-model="filters.q"
              type="search"
              class="form-control search-input"
              placeholder="Buscar por nombre o SKU"
              aria-label="Buscar productos"
            />
            <i class="bi bi-search search-icon" aria-hidden="true"></i>
          </div>
          <div class="d-flex gap-2">
            <select v-model.number="filters.size" class="form-select" aria-label="Resultados por página">
              <option :value="12">12 por página</option>
              <option :value="24">24 por página</option>
              <option :value="48">48 por página</option>
            </select>
            <button type="submit" class="btn btn-primary-soft">
              <i class="bi bi-funnel me-2" aria-hidden="true"></i>Aplicar filtros
            </button>
          </div>
        </form>
      </header>

      <div v-if="errorMessage" class="alert alert-warning" role="alert">
        {{ errorMessage }}
      </div>

      <div v-if="isLoading" class="text-center py-5" role="status">
        <div class="spinner-border text-primary" role="status" aria-hidden="true"></div>
        <p class="mt-3 mb-0">Cargando productos...</p>
      </div>

      <div v-else>
        <div v-if="products.length" class="row g-4">
          <div v-for="producto in products" :key="producto.id_producto" class="col-12 col-sm-6 col-lg-4">
            <ProductCard :producto="producto" />
          </div>
        </div>
        <div v-else class="text-center py-5 empty-state">
          <img src="https://placehold.co/320x200/FFE5D9/7A4329?text=Sin+resultados" alt="Sin resultados" class="img-fluid mb-3" />
          <h2 class="h5">No encontramos productos que coincidan con tu búsqueda.</h2>
          <p class="mb-0">Intenta ajustar los filtros o explorar otras categorías.</p>
        </div>

        <nav v-if="hasMorePages" class="pagination-wrapper d-flex justify-content-center mt-5">
          <ul class="pagination">
            <li :class="['page-item', { disabled: filters.page === 1 }]">
              <button class="page-link" type="button" @click="changePage(filters.page - 1)" :disabled="filters.page === 1">
                Anterior
              </button>
            </li>
            <li class="page-item disabled">
              <span class="page-link">Página {{ filters.page }} de {{ totalPages }}</span>
            </li>
            <li :class="['page-item', { disabled: filters.page === totalPages }]">
              <button
                class="page-link"
                type="button"
                @click="changePage(filters.page + 1)"
                :disabled="filters.page === totalPages"
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
import type { Producto } from '../types/api'

interface Filters {
  q: string
  page: number
  size: number
}

const filters = reactive<Filters>({
  q: '',
  page: 1,
  size: 12,
})

const isLoading = ref(false)
const errorMessage = ref('')
const products = ref<Producto[]>([])
const total = ref(0)

const totalPages = computed(() => {
  if (!total.value) return 1
  return Math.max(1, Math.ceil(total.value / filters.size))
})

const hasMorePages = computed(() => totalPages.value > 1)

async function loadProducts() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const response = await fetchProducts({ ...filters })
    products.value = response.items
    total.value = response.total
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Ocurrió un error al cargar los productos. Por favor intenta nuevamente.'
  } finally {
    isLoading.value = false
  }
}

function changePage(page: number) {
  if (page < 1 || page > totalPages.value) return
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
  background: radial-gradient(circle at top left, rgba(255, 232, 214, 0.9), rgba(255, 246, 237, 0.9));
  min-height: 100vh;
}

.page-title {
  font-weight: 700;
  color: #5a301d;
}

.page-subtitle {
  color: #8a5a44;
}

.filters .form-control,
.filters .form-select {
  border-radius: 999px;
  border: 1px solid rgba(197, 142, 108, 0.45);
  padding: 0.65rem 1rem;
  background-color: rgba(255, 249, 243, 0.9);
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
  color: #bb7b52;
}

.btn-primary-soft {
  border-radius: 999px;
  padding-inline: 1.5rem;
  background: linear-gradient(145deg, #bf6a3c, #e09a64);
  border: none;
  color: #fff;
  font-weight: 600;
  box-shadow: 0 10px 24px -16px rgba(191, 106, 60, 0.9);
}

.btn-primary-soft:hover {
  background: linear-gradient(145deg, #ac5930, #d2874f);
}

.alert-warning {
  background-color: rgba(255, 222, 204, 0.8);
  border: none;
  color: #7a3e22;
  border-radius: 12px;
}

.pagination .page-link {
  color: #8a5a44;
  border: none;
  border-radius: 999px;
  margin: 0 0.25rem;
  background-color: rgba(255, 236, 221, 0.9);
}

.pagination .page-link:hover {
  color: #fff;
  background: linear-gradient(145deg, #b56533, #d98b55);
}

.pagination .page-item.disabled .page-link {
  color: rgba(138, 90, 68, 0.5);
  background-color: rgba(255, 236, 221, 0.5);
}

.empty-state {
  color: #7a4c32;
}
</style>
