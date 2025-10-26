<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import ProductImagesModal from '../components/products/ProductImagesModal.vue'
import type {
  ActualizarEnvioEstadoPayload,
  CrearProductoPayload,
  Producto,
  ProductoAtributo,
  ProductoCategoriaResumen,
  Venta,
} from '../types/api'
import {
  createProduct,
  deactivateProduct,
  fetchProductById,
  fetchProductBySlug,
  fetchProducts,
  updateProduct,
  type FetchProductsParams,
} from '../services/productService'
import { mapearProductosConImagenes } from '../services/imageService'
import {
  cancelVenta,
  fetchVentas,
  updateEnvioEstado,
  type FetchVentasParams,
} from '../services/salesService'

interface TabConfig {
  id: string
  label: string
  description: string
  icon: string
}

const PRODUCTOS_PAGE_SIZE = 8
const VENTAS_PAGE_SIZE = 8

const tabs: TabConfig[] = [
  {
    id: 'products',
    label: 'Productos',
    description: 'Administra el catálogo, precios, inventario y visibilidad de los productos.',
    icon: 'bi-box-seam',
  },
  {
    id: 'orders',
    label: 'Pedidos',
    description: 'Supervisa y actualiza el estado de los pedidos confirmados por los clientes.',
    icon: 'bi-receipt-cutoff',
  },
  {
    id: 'manual-sales',
    label: 'Ventas manuales',
    description: 'Registra ventas directas realizadas fuera del canal digital.',
    icon: 'bi-clipboard-check',
  },
  {
    id: 'reports',
    label: 'Reportes',
    description: 'Genera reportes de cierre con los períodos que necesites analizar.',
    icon: 'bi-graph-up-arrow',
  },
]

const activeTab = ref<TabConfig['id']>('products')
const activeTabConfig = computed(() => tabs.find((tab) => tab.id === activeTab.value) ?? tabs[0])
const setActiveTab = (id: TabConfig['id']) => {
  activeTab.value = id
}

const productos = ref<Array<Producto & { _thumb?: string }>>([])
const productosLoading = ref(false)
const productosError = ref('')
const productosPagination = reactive({
  page: 1,
  pageSize: PRODUCTOS_PAGE_SIZE,
  total: 0,
  totalPages: 0,
})
const productoFilters = reactive({
  q: '',
  soloActivos: true,
})
const totalProductosActivos = ref(0)
const productoOperacionEnCurso = ref<string | null>(null)
const productoBuscando = ref(false)

const productoEnEdicion = ref<Producto | null>(null)
const productoSeleccionado = ref<string | null>(null)
const productoSeleccionadoModel = computed<string>({
  get: () => productoSeleccionado.value ?? '',
  set: (value) => {
    if (typeof value !== 'string') {
      productoSeleccionado.value = null
      return
    }
    const sanitized = value.trim()
    productoSeleccionado.value = sanitized.length > 0 ? sanitized : null
  },
})

const mostrarFormularioProducto = ref(false)
const formularioProductoVisible = computed(() => mostrarFormularioProducto.value || productoEnEdicion.value !== null)
const esModoEdicionProducto = computed(() => productoEnEdicion.value !== null)

const productoParaImagenes = ref<Producto | null>(null)
const mostrarModalImagenes = ref(false)

const productoForm = reactive({
  nombre: '',
  slug: '',
  descripcion: '',
  marca: '',
  skuBase: '',
  precio: '',
  activo: true,
  destacado: false,
  pesoGramos: '',
  volumenMl: '',
  categoriasTexto: '',
  atributosTexto: '',
})
const productFormSubmitting = ref(false)
const productFormSuccess = ref('')
const productFormError = ref('')

const ventas = ref<Venta[]>([])
const ventasLoading = ref(false)
const ventasError = ref('')
const ventasFeedback = ref('')
const ventaOperacionEnCurso = ref<string | null>(null)
const ventasPagination = reactive({
  page: 1,
  pageSize: VENTAS_PAGE_SIZE,
  total: 0,
  totalPages: 0,
})
const ventasFilters = reactive({
  estado: '',
  q: '',
})

const estadoPredefinidos = ['CREADA', 'PAGADA', 'PENDIENTE_ENVIO', 'ENVIADA', 'ENTREGADA', 'CANCELADA']

const estadosSelectOptions = computed(() => {
  const encontrados = new Set<string>(estadoPredefinidos)
  ventas.value.forEach((venta) => {
    if (venta.estado) {
      encontrados.add(venta.estado)
    }
  })
  return Array.from(encontrados).map((estado) => ({
    value: estado,
    label: estadoLabel(estado),
  }))
})

const metricProductosActivos = computed(() => totalProductosActivos.value)
const metricPedidosPendientes = computed(
  () =>
    ventas.value.filter((venta) => venta.estado?.toLowerCase().includes('pend')).length,
)
const metricProductosSinImagen = computed(
  () => productos.value.filter((producto) => !producto.imagenes?.length).length,
)
const metricTotalVentas = computed(() => ventasPagination.total)

const formatCurrency = (value: number | undefined | null) => {
  const amount = typeof value === 'number' && !Number.isNaN(value) ? value : 0
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDateTime = (iso: string | undefined | null) => {
  if (!iso) return 'Sin fecha'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const estadoLabel = (estado: string | undefined | null) => {
  if (!estado) return 'Sin estado'
  const normalized = estado.toUpperCase()
  const map: Record<string, string> = {
    CREADA: 'Creada',
    PAGADA: 'Pagada',
    PENDIENTE_ENVIO: 'Pendiente de envío',
    ENVIADA: 'Enviada',
    ENTREGADA: 'Entregada',
    CANCELADA: 'Cancelada',
  }
  return map[normalized] ?? estado
}

const badgeClassForEstado = (estado: string | undefined | null) => {
  if (!estado) {
    return 'text-bg-secondary'
  }
  const normalized = estado.toUpperCase()
  const map: Record<string, string> = {
    CREADA: 'text-bg-secondary',
    PAGADA: 'text-bg-info',
    PENDIENTE_ENVIO: 'text-bg-warning',
    ENVIADA: 'text-bg-primary',
    ENTREGADA: 'text-bg-success',
    CANCELADA: 'text-bg-danger',
  }
  return map[normalized] ?? 'text-bg-secondary'
}

const resetProductoForm = () => {
  productoForm.nombre = ''
  productoForm.slug = ''
  productoForm.descripcion = ''
  productoForm.marca = ''
  productoForm.skuBase = ''
  productoForm.precio = ''
  productoForm.activo = true
  productoForm.destacado = false
  productoForm.pesoGramos = ''
  productoForm.volumenMl = ''
  productoForm.categoriasTexto = ''
  productoForm.atributosTexto = ''
}

const serializarCategorias = (categorias?: ProductoCategoriaResumen[]): string => {
  if (!categorias?.length) {
    return ''
  }
  return categorias
    .map((categoria) => categoria?.categoria?.id ?? '')
    .filter((id) => id.length > 0)
    .join(', ')
}

const parseCategorias = (texto: string): string[] => {
  return texto
    .split(/[;,\n]/)
    .map((segmento) => segmento.trim())
    .filter((segmento) => segmento.length > 0)
}

const serializarAtributos = (atributos?: ProductoAtributo[]): string => {
  if (!atributos?.length) {
    return ''
  }
  return atributos
    .map((atributo) => `${atributo.clave} = ${atributo.valor}`)
    .join('\n')
}

const parseAtributos = (texto: string): ProductoAtributo[] => {
  const lineas = texto
    .split(/\n+/)
    .map((linea) => linea.trim())
    .filter((linea) => linea.length > 0)

  return lineas
    .map((linea) => {
      const separador = linea.search(/[:=]/)
      if (separador === -1) {
        return null
      }
      const clave = linea.slice(0, separador).trim()
      const valor = linea.slice(separador + 1).trim()
      if (!clave || !valor) {
        return null
      }
      return {
        clave,
        valor,
      }
    })
    .filter((atributo): atributo is ProductoAtributo => atributo !== null)
}

const limpiarPayload = <T extends Record<string, unknown>>(payload: T): T => {
  const limpio: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) {
      limpio[key] = value
    }
  }
  return limpio as T
}

const prepararNuevoProducto = () => {
  productoEnEdicion.value = null
  productoSeleccionado.value = null
  mostrarFormularioProducto.value = true
  resetProductoForm()
  productFormSuccess.value = ''
  productFormError.value = ''
}

const rellenarFormularioProducto = (producto: Producto) => {
  productoEnEdicion.value = producto
  productoSeleccionado.value = producto.id
  mostrarFormularioProducto.value = true
  productoForm.nombre = producto.nombre ?? ''
  productoForm.slug = producto.slug ?? ''
  productoForm.descripcion = producto.descripcion ?? ''
  productoForm.marca = producto.marca ?? ''
  productoForm.skuBase = producto.skuBase ?? ''
  productoForm.precio = typeof producto.precio === 'number' ? producto.precio.toString() : ''
  productoForm.activo = producto.activo ?? true
  productoForm.destacado = producto.destacado ?? false
  productoForm.pesoGramos =
    typeof producto.pesoGramos === 'number' && !Number.isNaN(producto.pesoGramos)
      ? producto.pesoGramos.toString()
      : ''
  productoForm.volumenMl =
    typeof producto.volumenMl === 'number' && !Number.isNaN(producto.volumenMl)
      ? producto.volumenMl.toString()
      : ''
  productoForm.categoriasTexto = serializarCategorias(producto.categorias)
  productoForm.atributosTexto = serializarAtributos(producto.atributos)
  productFormSuccess.value = ''
  productFormError.value = ''
}

const editarProducto = (producto: Producto) => {
  rellenarFormularioProducto(producto)
}

const cerrarFormularioProducto = () => {
  mostrarFormularioProducto.value = false
  productoEnEdicion.value = null
  resetProductoForm()
  productFormSuccess.value = ''
  productFormError.value = ''
}

const limpiarBusquedaProducto = () => {
  productoSeleccionado.value = null
}

const abrirModalImagenes = (producto: Producto) => {
  productoParaImagenes.value = producto
  mostrarModalImagenes.value = true
}

const cerrarModalImagenes = async () => {
  mostrarModalImagenes.value = false
  productoParaImagenes.value = null
  await cargarProductos(productosPagination.page)
}

const refrescarMetricasProductosActivos = async () => {
  try {
    const respuesta = await fetchProducts({
      page: 1,
      pageSize: 1,
      soloActivos: true,
    })
    totalProductosActivos.value = respuesta.total
  } catch (error) {
    console.error('No fue posible actualizar la métrica de productos activos', error)
  }
}

const cargarProductos = async (page = productosPagination.page) => {
  productosLoading.value = true
  productosError.value = ''
  try {
    const params: FetchProductsParams = {
      page,
      pageSize: productosPagination.pageSize,
      soloActivos: productoFilters.soloActivos,
    }
    if (productoFilters.q.trim().length > 0) {
      params.q = productoFilters.q.trim()
    }

    const respuesta = await fetchProducts(params)
    const items = await mapearProductosConImagenes(respuesta.items)
    productos.value = items
    productosPagination.page = respuesta.page
    productosPagination.pageSize = respuesta.pageSize
    productosPagination.total = respuesta.total
    productosPagination.totalPages = respuesta.totalPages

    if (productoFilters.soloActivos) {
      totalProductosActivos.value = respuesta.total
    }

    if (productoEnEdicion.value) {
      const actualizado = items.find((item) => item.id === productoEnEdicion.value?.id)
      if (actualizado) {
        rellenarFormularioProducto(actualizado)
      }
    }
  } catch (error) {
    productosError.value =
      error instanceof Error
        ? error.message
        : 'No fue posible cargar los productos. Intenta nuevamente.'
  } finally {
    productosLoading.value = false
  }
}

const aplicarFiltrosProductos = async () => {
  productosPagination.page = 1
  await cargarProductos(1)
  if (!productoFilters.soloActivos) {
    await refrescarMetricasProductosActivos()
  }
}

const limpiarFiltrosProductos = async () => {
  productoFilters.q = ''
  productoFilters.soloActivos = true
  await aplicarFiltrosProductos()
}

const cambiarPaginaProductos = async (page: number) => {
  if (page < 1 || page > productosPagination.totalPages || productosLoading.value) {
    return
  }
  await cargarProductos(page)
}

const buscarProductoPorIdentificador = async () => {
  if (!productoSeleccionado.value) {
    productFormError.value = 'Ingresa un identificador o slug válido para buscar el producto.'
    return
  }

  productFormError.value = ''
  productFormSuccess.value = ''
  productoBuscando.value = true

  try {
    let producto: Producto
    try {
      producto = await fetchProductById(productoSeleccionado.value)
    } catch (error) {
      producto = await fetchProductBySlug(productoSeleccionado.value)
    }
    rellenarFormularioProducto(producto)
    productFormSuccess.value = 'Producto cargado correctamente desde la API.'
  } catch (error) {
    productFormError.value =
      error instanceof Error
        ? error.message
        : 'No fue posible recuperar el producto solicitado.'
  } finally {
    productoBuscando.value = false
  }
}

const onSubmitProducto = async () => {
  productFormError.value = ''
  productFormSuccess.value = ''

  const precio = Number(productoForm.precio)
  if (!productoForm.nombre.trim()) {
    productFormError.value = 'El nombre del producto es obligatorio.'
    return
  }
  if (!productoForm.slug.trim()) {
    productFormError.value = 'El slug del producto es obligatorio.'
    return
  }
  if (Number.isNaN(precio)) {
    productFormError.value = 'Debes ingresar un precio válido.'
    return
  }

  const categorias = parseCategorias(productoForm.categoriasTexto)
  const atributos = parseAtributos(productoForm.atributosTexto)

  const payloadBase: CrearProductoPayload = {
    nombre: productoForm.nombre.trim(),
    slug: productoForm.slug.trim(),
    descripcion: productoForm.descripcion.trim() || undefined,
    marca: productoForm.marca.trim() || undefined,
    skuBase: productoForm.skuBase.trim() || undefined,
    precio,
    activo: productoForm.activo,
    destacado: productoForm.destacado,
    pesoGramos:
      productoForm.pesoGramos.trim().length > 0
        ? Number(productoForm.pesoGramos)
        : undefined,
    volumenMl:
      productoForm.volumenMl.trim().length > 0
        ? Number(productoForm.volumenMl)
        : undefined,
    categorias: categorias.length ? categorias : undefined,
    atributos: atributos.length ? atributos : undefined,
  }

  const payload = limpiarPayload(payloadBase)

  productFormSubmitting.value = true
  try {
    let respuesta: Producto
    if (productoEnEdicion.value) {
      respuesta = await updateProduct(productoEnEdicion.value.id, payload)
      productFormSuccess.value = 'Producto actualizado correctamente.'
    } else {
      respuesta = await createProduct(payload)
      productFormSuccess.value = 'Producto creado correctamente.'
    }

    rellenarFormularioProducto(respuesta)
    await cargarProductos(productoEnEdicion.value ? productosPagination.page : 1)
    await refrescarMetricasProductosActivos()
  } catch (error) {
    productFormError.value =
      error instanceof Error
        ? error.message
        : 'No fue posible guardar el producto. Intenta nuevamente.'
  } finally {
    productFormSubmitting.value = false
  }
}

const desactivarProducto = async (producto: Producto) => {
  if (!producto.activo) {
    productFormSuccess.value = 'El producto ya se encuentra inactivo.'
    return
  }

  const confirmar = window.confirm(
    `¿Deseas desactivar el producto "${producto.nombre}"? Esta acción ocultará el producto del catálogo.`,
  )
  if (!confirmar) {
    return
  }

  productoOperacionEnCurso.value = producto.id
  productFormError.value = ''
  productFormSuccess.value = ''

  try {
    const respuesta = await deactivateProduct(producto.id)
    productFormSuccess.value = `Producto "${respuesta.nombre}" desactivado correctamente.`
    if (productoEnEdicion.value?.id === producto.id) {
      productoEnEdicion.value = { ...productoEnEdicion.value, activo: false }
      productoForm.activo = false
    }
    await cargarProductos(productosPagination.page)
    await refrescarMetricasProductosActivos()
  } catch (error) {
    productFormError.value =
      error instanceof Error
        ? error.message
        : 'No fue posible desactivar el producto. Intenta nuevamente.'
  } finally {
    productoOperacionEnCurso.value = null
  }
}

const cargarVentas = async (page = ventasPagination.page) => {
  ventasLoading.value = true
  ventasError.value = ''
  ventasFeedback.value = ''
  try {
    const params: FetchVentasParams = {
      page,
      pageSize: ventasPagination.pageSize,
    }
    if (ventasFilters.estado) {
      params.estado = ventasFilters.estado
    }
    if (ventasFilters.q.trim().length > 0) {
      params.q = ventasFilters.q.trim()
    }

    const respuesta = await fetchVentas(params)
    ventas.value = respuesta.items
    ventasPagination.page = respuesta.page
    ventasPagination.pageSize = respuesta.pageSize
    ventasPagination.total = respuesta.total
    ventasPagination.totalPages = respuesta.totalPages
  } catch (error) {
    ventasError.value =
      error instanceof Error
        ? error.message
        : 'No fue posible cargar los pedidos. Intenta nuevamente.'
  } finally {
    ventasLoading.value = false
  }
}

const aplicarFiltrosVentas = async () => {
  ventasPagination.page = 1
  await cargarVentas(1)
}

const limpiarFiltrosVentas = async () => {
  ventasFilters.estado = ''
  ventasFilters.q = ''
  await aplicarFiltrosVentas()
}

const cambiarPaginaVentas = async (page: number) => {
  if (page < 1 || page > ventasPagination.totalPages || ventasLoading.value) {
    return
  }
  await cargarVentas(page)
}

const cancelarPedido = async (venta: Venta) => {
  const referencia = venta.numero ?? venta.id
  const confirmacion = window.confirm(`¿Deseas cancelar el pedido ${referencia}?`)
  if (!confirmacion) {
    return
  }

  const motivo = window.prompt('Motivo de cancelación (opcional):', '') ?? ''
  ventaOperacionEnCurso.value = venta.id
  ventasFeedback.value = ''
  ventasError.value = ''

  try {
    const payload = motivo.trim().length ? { motivo: motivo.trim() } : {}
    await cancelVenta(venta.id, payload)
    ventasFeedback.value = `Pedido ${referencia} cancelado correctamente.`
    await cargarVentas(ventasPagination.page)
  } catch (error) {
    ventasError.value =
      error instanceof Error
        ? error.message
        : 'No fue posible cancelar el pedido. Intenta nuevamente.'
  } finally {
    ventaOperacionEnCurso.value = null
  }
}

const actualizarEstadoEnvioPedido = async (venta: Venta) => {
  if (!venta.envio?.id) {
    ventasFeedback.value = 'Este pedido no tiene un envío registrado para actualizar.'
    return
  }

  const nuevoEstado = window.prompt(
    'Ingresa el nuevo estado logístico del envío:',
    venta.envio.estado ?? '',
  )
  if (!nuevoEstado || nuevoEstado.trim().length === 0) {
    return
  }

  const detalle = window.prompt('Detalle adicional (opcional):', '') ?? ''
  const ubicacion = window.prompt('Ubicación (opcional):', '') ?? ''

  const payload: ActualizarEnvioEstadoPayload = {
    estado: nuevoEstado.trim(),
  }
  if (detalle.trim().length > 0) {
    payload.detalle = detalle.trim()
  }
  if (ubicacion.trim().length > 0) {
    payload.ubicacion = ubicacion.trim()
  }

  ventaOperacionEnCurso.value = venta.id
  ventasFeedback.value = ''
  ventasError.value = ''

  try {
    await updateEnvioEstado(venta.envio.id, payload)
    ventasFeedback.value = 'Estado del envío actualizado correctamente.'
    await cargarVentas(ventasPagination.page)
  } catch (error) {
    ventasError.value =
      error instanceof Error
        ? error.message
        : 'No fue posible actualizar el estado del envío. Intenta nuevamente.'
  } finally {
    ventaOperacionEnCurso.value = null
  }
}

onMounted(async () => {
  await refrescarMetricasProductosActivos()
  await Promise.all([cargarProductos(1), cargarVentas(1)])
})
</script>

<template>
  <section class="admin-dashboard py-5">
    <div class="container">
      <header class="dashboard-hero rounded-4 p-4 p-md-5 text-white mb-4">
        <div class="row g-4 align-items-center">
          <div class="col-lg-7">
            <p class="badge text-uppercase fw-semibold tracking-wide text-bg-dark-subtle mb-3">Backoffice Larmone</p>
            <h1 class="display-6 fw-bold mb-3">Centro de administración</h1>
            <p class="lead mb-0 opacity-75">
              Gestiona productos, pedidos y reportes desde un único panel pensado para mantener el negocio bajo
              control.
            </p>
          </div>
          <div class="col-lg-5">
            <div class="quick-metrics card border-0 text-dark">
              <div class="card-body p-4">
                <h2 class="h6 text-uppercase text-muted mb-3">Accesos rápidos</h2>
                <div class="row g-3">
                  <div class="col-6">
                    <div class="metric-tile rounded-3 p-3">
                      <p class="small text-uppercase text-muted mb-1">Productos activos</p>
                      <p class="h4 fw-bold mb-0">{{ metricProductosActivos }}</p>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="metric-tile rounded-3 p-3">
                      <p class="small text-uppercase text-muted mb-1">Pedidos pendientes</p>
                      <p class="h4 fw-bold mb-0">{{ metricPedidosPendientes }}</p>
                    </div>
                  </div>
                  <div class="col-12">
                    <div class="metric-tile rounded-3 p-3 d-flex justify-content-between align-items-center">
                      <div>
                        <p class="small text-uppercase text-muted mb-1">Actualización requerida</p>
                        <p class="mb-0 d-flex align-items-center gap-2">
                          <i class="bi bi-upload"></i>
                          <span v-if="metricProductosSinImagen">
                            Subir fotos a {{ metricProductosSinImagen }}
                            {{ metricProductosSinImagen === 1 ? 'producto' : 'productos' }}
                          </span>
                          <span v-else>No hay pendientes de imágenes</span>
                        </p>
                      </div>
                      <span class="badge text-bg-light text-muted">Pedidos: {{ metricTotalVentas }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div class="card shadow-sm border-0 overflow-hidden">
        <div class="card-header bg-white border-0 pb-0">
          <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-md-between gap-3">
            <div>
              <p class="text-uppercase text-muted fw-semibold small mb-1">Área seleccionada</p>
              <h2 class="h4 mb-0">{{ activeTabConfig.label }}</h2>
              <p class="text-muted mb-0">{{ activeTabConfig.description }}</p>
            </div>
            <nav class="tab-navigation nav nav-pills flex-wrap gap-2" role="tablist">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                class="nav-link d-flex align-items-center gap-2"
                :class="{ active: activeTab === tab.id }"
                type="button"
                role="tab"
                :aria-selected="activeTab === tab.id"
                @click="setActiveTab(tab.id)"
              >
                <i :class="['bi', tab.icon]"></i>
                <span>{{ tab.label }}</span>
              </button>
            </nav>
          </div>
        </div>

        <div class="card-body p-4 p-lg-5">
          <div v-if="activeTab === 'products'" class="tab-panel" role="tabpanel">
            <div class="row g-4">
              <div class="col-12">
                <section class="panel">
                  <form class="row g-3 align-items-end" @submit.prevent="aplicarFiltrosProductos">
                    <div class="col-12 col-md-6">
                      <label class="form-label">Buscar producto</label>
                      <input
                        type="search"
                        class="form-control"
                        placeholder="Nombre, SKU o slug"
                        v-model="productoFilters.q"
                      />
                    </div>
                    <div class="col-12 col-md-3">
                      <label class="form-label">Solo activos</label>
                      <div class="form-check form-switch">
                        <input
                          class="form-check-input"
                          type="checkbox"
                          id="soloActivos"
                          v-model="productoFilters.soloActivos"
                        />
                        <label class="form-check-label" for="soloActivos">
                          {{ productoFilters.soloActivos ? 'Mostrando activos' : 'Incluyendo inactivos' }}
                        </label>
                      </div>
                    </div>
                    <div class="col-12 col-md-3 d-flex gap-2">
                      <button type="submit" class="btn btn-primary flex-grow-1">
                        <i class="bi bi-search me-1"></i>
                        Aplicar filtros
                      </button>
                      <button type="button" class="btn btn-outline-secondary" @click="limpiarFiltrosProductos">
                        Limpiar
                      </button>
                    </div>
                  </form>
                </section>
              </div>

              <div class="col-12 col-xl-6">
                <section class="panel h-100">
                  <header class="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
                    <div>
                      <h3 class="h5 mb-1">
                        {{ esModoEdicionProducto ? 'Editar producto' : 'Crear nuevo producto' }}
                      </h3>
                      <p class="text-muted small mb-0">
                        Completa los campos para publicar un producto o selecciona uno existente desde el inventario.
                      </p>
                    </div>
                    <div class="d-flex gap-2">
                      <button
                        v-if="!formularioProductoVisible"
                        type="button"
                        class="btn btn-sm btn-primary"
                        @click="prepararNuevoProducto"
                      >
                        <i class="bi bi-plus-lg me-1"></i>
                        Agregar nuevo producto
                      </button>
                      <button
                        v-else
                        type="button"
                        class="btn btn-sm btn-outline-secondary"
                        @click="cerrarFormularioProducto"
                      >
                        <i class="bi bi-x-lg me-1"></i>
                        Cerrar formulario
                      </button>
                    </div>
                  </header>

                  <div class="mb-4">
                    <label class="form-label fw-semibold">Buscar producto existente</label>
                    <div class="row g-2 align-items-end">
                      <div class="col-12 col-md-7">
                        <input
                          type="text"
                          class="form-control"
                          placeholder="Ej: prod-123 o vestido-aurora"
                          v-model="productoSeleccionadoModel"
                        />
                      </div>
                      <div class="col-12 col-md-5 d-flex gap-2">
                        <button
                          type="button"
                          class="btn btn-outline-primary flex-grow-1"
                          :disabled="productoBuscando || !productoSeleccionado"
                          @click="buscarProductoPorIdentificador"
                        >
                          <span
                            v-if="productoBuscando"
                            class="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Cargar producto
                        </button>
                        <button type="button" class="btn btn-outline-secondary" @click="limpiarBusquedaProducto">
                          Limpiar
                        </button>
                      </div>
                    </div>
                    <small class="text-muted d-block mt-1">
                      Ingresa el identificador expuesto por la API para cargarlo en el formulario y editarlo.
                    </small>
                  </div>

                  <div v-if="productFormSuccess" class="alert alert-success" role="status">
                    {{ productFormSuccess }}
                  </div>
                  <div v-if="productFormError" class="alert alert-danger" role="alert">
                    {{ productFormError }}
                  </div>

                  <div v-if="formularioProductoVisible">
                    <form class="row g-3" @submit.prevent="onSubmitProducto">
                      <div class="col-12 col-md-6">
                        <label class="form-label">Slug público</label>
                        <input
                          type="text"
                          class="form-control"
                          placeholder="Ej: vestido-aurora"
                          v-model="productoForm.slug"
                          required
                        />
                      </div>
                      <div class="col-12">
                        <label class="form-label">Nombre</label>
                        <input
                          type="text"
                          class="form-control"
                          placeholder="Ej: Vestido seda Aurora"
                          v-model="productoForm.nombre"
                          required
                        />
                      </div>
                      <div class="col-12">
                        <label class="form-label">Descripción</label>
                        <textarea
                          class="form-control"
                          rows="3"
                          placeholder="Detalle del producto"
                          v-model="productoForm.descripcion"
                        ></textarea>
                      </div>
                      <div class="col-12 col-md-6">
                        <label class="form-label">Marca</label>
                        <input type="text" class="form-control" v-model="productoForm.marca" />
                      </div>
                      <div class="col-12 col-md-6">
                        <label class="form-label">SKU base</label>
                        <input type="text" class="form-control" v-model="productoForm.skuBase" />
                      </div>
                      <div class="col-12 col-md-6">
                        <label class="form-label">Precio</label>
                        <div class="input-group">
                          <span class="input-group-text">$</span>
                          <input type="number" min="0" class="form-control" v-model="productoForm.precio" required />
                        </div>
                      </div>
                      <div class="col-12 col-md-6">
                        <label class="form-label">Peso (gramos)</label>
                        <input type="number" min="0" class="form-control" v-model="productoForm.pesoGramos" />
                      </div>
                      <div class="col-12 col-md-6">
                        <label class="form-label">Volumen (ml)</label>
                        <input type="number" min="0" class="form-control" v-model="productoForm.volumenMl" />
                      </div>
                      <div class="col-12 col-md-6">
                        <label class="form-label d-block">Estado</label>
                        <div class="d-flex flex-wrap gap-3">
                          <div class="form-check form-switch">
                            <input
                              class="form-check-input"
                              type="checkbox"
                              id="activo"
                              v-model="productoForm.activo"
                            />
                            <label class="form-check-label" for="activo">Activo</label>
                          </div>
                          <div class="form-check form-switch">
                            <input
                              class="form-check-input"
                              type="checkbox"
                              id="destacado"
                              v-model="productoForm.destacado"
                            />
                            <label class="form-check-label" for="destacado">Destacado</label>
                          </div>
                        </div>
                      </div>
                      <div class="col-12">
                        <label class="form-label">Categorías (IDs separadas por coma)</label>
                        <textarea
                          class="form-control"
                          rows="2"
                          placeholder="cat-verano, cat-novedades"
                          v-model="productoForm.categoriasTexto"
                        ></textarea>
                      </div>
                      <div class="col-12">
                        <label class="form-label">Atributos (clave = valor por línea)</label>
                        <textarea
                          class="form-control"
                          rows="3"
                          placeholder="tipoPiel = seca"
                          v-model="productoForm.atributosTexto"
                        ></textarea>
                      </div>
                      <div class="col-12">
                        <div class="alert alert-info small mb-0" role="status">
                          <i class="bi bi-images me-2"></i>
                          Las imágenes se gestionan desde la grilla de inventario con el botón
                          <strong>Imágenes</strong>.
                        </div>
                      </div>
                      <div class="col-12 d-flex flex-wrap gap-2">
                        <button type="submit" class="btn btn-primary" :disabled="productFormSubmitting">
                          <span
                            v-if="productFormSubmitting"
                            class="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Guardar cambios
                        </button>
                        <button type="button" class="btn btn-outline-secondary" @click="cerrarFormularioProducto">
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                  <div v-else class="alert alert-light border" role="status">
                    Selecciona «Agregar nuevo producto» o el botón «Editar» de la grilla para modificar un producto.
                  </div>
                </section>
              </div>

              <div class="col-12 col-xl-6">
                <section class="panel h-100">
                  <header class="d-flex justify-content-between align-items-center mb-3">
                    <h3 class="h5 mb-0">Control de inventario</h3>
                    <button class="btn btn-sm btn-outline-secondary" type="button" @click="cargarProductos()">
                      <i class="bi bi-arrow-repeat me-1"></i>
                      Actualizar
                    </button>
                  </header>

                  <div v-if="productosLoading" class="text-center py-5" role="status">
                    <div class="spinner-border text-primary" role="status" aria-hidden="true"></div>
                    <p class="mt-3 mb-0">Cargando productos…</p>
                  </div>

                  <div v-else>
                    <div v-if="productosError" class="alert alert-danger" role="alert">{{ productosError }}</div>

                    <div v-else>
                      <div v-if="productos.length === 0" class="alert alert-light border text-center" role="status">
                        sin registros para mostrar.
                      </div>

                      <div v-else class="table-responsive">
                        <table class="table align-middle">
                          <thead>
                            <tr>
                              <th scope="col">Producto</th>
                              <th scope="col" class="text-end">Precio</th>
                              <th scope="col" class="text-end">Stock</th>
                              <th scope="col" class="text-end">Estado</th>
                              <th scope="col" class="text-end">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="producto in productos" :key="producto.id">
                              <td>
                                <div class="d-flex align-items-center gap-3">
                                  <img
                                    v-if="producto._thumb"
                                    :src="producto._thumb"
                                    alt="Miniatura"
                                    class="rounded"
                                    width="48"
                                    height="48"
                                  />
                                  <div>
                                    <p class="fw-semibold mb-0">{{ producto.nombre }}</p>
                                    <small class="text-muted">SKU: {{ producto.skuBase || '—' }}</small>
                                  </div>
                                </div>
                              </td>
                              <td class="text-end">{{ formatCurrency(producto.precio) }}</td>
                              <td class="text-end">{{ producto.stockTotal ?? '—' }}</td>
                              <td class="text-end">
                                <span
                                  class="badge"
                                  :class="producto.activo ? 'text-bg-success' : 'text-bg-secondary'"
                                >
                                  {{ producto.activo ? 'Activo' : 'Inactivo' }}
                                </span>
                              </td>
                              <td class="text-end">
                                <div class="d-flex justify-content-end gap-2">
                                  <button class="btn btn-sm btn-outline-primary" type="button" @click="editarProducto(producto)">
                                    Editar
                                  </button>
                                  <button
                                    class="btn btn-sm btn-outline-secondary"
                                    type="button"
                                    @click="abrirModalImagenes(producto)"
                                  >
                                    Imágenes
                                  </button>
                                  <button
                                    class="btn btn-sm btn-outline-danger"
                                    type="button"
                                    :disabled="productoOperacionEnCurso === producto.id || !producto.activo"
                                    @click="desactivarProducto(producto)"
                                  >
                                    <span
                                      v-if="productoOperacionEnCurso === producto.id"
                                      class="spinner-border spinner-border-sm me-1"
                                      role="status"
                                      aria-hidden="true"
                                    ></span>
                                    Desactivar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <nav
                        v-if="productosPagination.totalPages > 1"
                        class="d-flex justify-content-between align-items-center mt-3"
                        aria-label="Paginación de productos"
                      >
                        <button
                          class="btn btn-sm btn-outline-secondary"
                          type="button"
                          :disabled="productosPagination.page === 1 || productosLoading"
                          @click="cambiarPaginaProductos(productosPagination.page - 1)"
                        >
                          Anterior
                        </button>
                        <span class="text-muted small">
                          Página {{ productosPagination.page }} de {{ productosPagination.totalPages }}
                        </span>
                        <button
                          class="btn btn-sm btn-outline-secondary"
                          type="button"
                          :disabled="
                            productosPagination.page === productosPagination.totalPages || productosLoading
                          "
                          @click="cambiarPaginaProductos(productosPagination.page + 1)"
                        >
                          Siguiente
                        </button>
                      </nav>
                      <p class="text-muted small mt-2 mb-0">Total registros: {{ productosPagination.total }}</p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>

          <div v-else-if="activeTab === 'orders'" class="tab-panel" role="tabpanel">
            <div class="row g-4">
              <div class="col-12 col-xl-4">
                <section class="panel h-100">
                  <h3 class="h5 mb-3">Filtros rápidos</h3>
                  <form class="d-grid gap-3" @submit.prevent="aplicarFiltrosVentas">
                    <div>
                      <label class="form-label">Buscar por cliente o referencia</label>
                      <input
                        type="search"
                        class="form-control"
                        placeholder="Nombre, correo o referencia"
                        v-model="ventasFilters.q"
                      />
                    </div>
                    <div>
                      <label class="form-label">Estado del pedido</label>
                      <select class="form-select" v-model="ventasFilters.estado">
                        <option value="">Todos los estados</option>
                        <option v-for="estado in estadosSelectOptions" :key="estado.value" :value="estado.value">
                          {{ estado.label }}
                        </option>
                      </select>
                    </div>
                    <div class="d-flex gap-2">
                      <button type="submit" class="btn btn-primary flex-grow-1">Aplicar filtros</button>
                      <button type="button" class="btn btn-outline-secondary" @click="limpiarFiltrosVentas">
                        Limpiar
                      </button>
                    </div>
                  </form>
                  <div class="alert alert-info mt-4" role="status">
                    <i class="bi bi-info-circle me-2"></i>
                    Puedes refinar la búsqueda por estado logístico o referencia de pago para agilizar las gestiones.
                  </div>
                </section>
              </div>
              <div class="col-12 col-xl-8">
                <section class="panel h-100">
                  <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                    <h3 class="h5 mb-0">Pedidos recientes</h3>
                    <button class="btn btn-sm btn-outline-secondary" type="button" @click="cargarVentas()">
                      <i class="bi bi-arrow-clockwise me-1"></i>
                      Actualizar lista
                    </button>
                  </div>

                  <div v-if="ventasFeedback" class="alert alert-success" role="status">{{ ventasFeedback }}</div>
                  <div v-if="ventasError" class="alert alert-danger" role="alert">{{ ventasError }}</div>

                  <div v-if="ventasLoading" class="text-center py-5" role="status">
                    <div class="spinner-border text-primary" role="status" aria-hidden="true"></div>
                    <p class="mt-3 mb-0">Cargando pedidos…</p>
                  </div>

                  <div v-else>
                    <div v-if="ventas.length === 0" class="alert alert-light border text-center" role="status">
                      sin registros para mostrar.
                    </div>

                    <div v-else class="list-group order-list">
                      <article
                        v-for="venta in ventas"
                        :key="venta.id"
                        class="list-group-item list-group-item-action flex-column align-items-start"
                      >
                        <div class="d-flex w-100 justify-content-between flex-wrap gap-2">
                          <div>
                            <h4 class="h6 mb-1">Pedido #{{ venta.numero ?? venta.id }}</h4>
                            <p class="mb-1 text-muted">
                              Cliente:
                              <span>{{ venta.usuario?.nombre ?? 'Sin nombre' }}</span>
                              <span v-if="venta.usuario?.email"> · {{ venta.usuario.email }}</span>
                            </p>
                            <p class="mb-1 text-muted small">Creado: {{ formatDateTime(venta.createdAt) }}</p>
                          </div>
                          <span
                            class="badge rounded-pill align-self-center"
                            :class="badgeClassForEstado(venta.estado)"
                          >
                            {{ estadoLabel(venta.estado) }}
                          </span>
                        </div>
                        <p class="mb-2">
                          Total pagado: {{ formatCurrency(venta.total) }} · {{ venta.items.length }}
                          {{ venta.items.length === 1 ? 'producto' : 'productos' }}
                        </p>
                        <ul class="list-unstyled mb-3 small text-muted" v-if="venta.items.length">
                          <li v-for="item in venta.items" :key="item.id">
                            {{ item.cantidad }}× {{ item.nombre ?? item.productoId }} —
                            {{ formatCurrency(item.subtotal) }}
                          </li>
                        </ul>
                        <div class="d-flex flex-wrap gap-2">
                          <button
                            class="btn btn-sm btn-outline-primary"
                            type="button"
                            :disabled="ventaOperacionEnCurso === venta.id || !venta.envio?.id"
                            @click="actualizarEstadoEnvioPedido(venta)"
                          >
                            <span
                              v-if="ventaOperacionEnCurso === venta.id && venta.envio?.id"
                              class="spinner-border spinner-border-sm me-1"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            <i class="bi bi-truck me-1"></i>
                            Actualizar envío
                          </button>
                          <button
                            class="btn btn-sm btn-outline-danger"
                            type="button"
                            :disabled="ventaOperacionEnCurso === venta.id"
                            @click="cancelarPedido(venta)"
                          >
                            <span
                              v-if="ventaOperacionEnCurso === venta.id"
                              class="spinner-border spinner-border-sm me-1"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            <i class="bi bi-x-circle me-1"></i>
                            Cancelar pedido
                          </button>
                        </div>
                      </article>
                    </div>

                    <nav
                      v-if="ventasPagination.totalPages > 1"
                      class="d-flex justify-content-between align-items-center mt-3"
                      aria-label="Paginación de pedidos"
                    >
                      <button
                        class="btn btn-sm btn-outline-secondary"
                        type="button"
                        :disabled="ventasPagination.page === 1 || ventasLoading"
                        @click="cambiarPaginaVentas(ventasPagination.page - 1)"
                      >
                        Anterior
                      </button>
                      <span class="text-muted small">
                        Página {{ ventasPagination.page }} de {{ ventasPagination.totalPages }}
                      </span>
                      <button
                        class="btn btn-sm btn-outline-secondary"
                        type="button"
                        :disabled="ventasPagination.page === ventasPagination.totalPages || ventasLoading"
                        @click="cambiarPaginaVentas(ventasPagination.page + 1)"
                      >
                        Siguiente
                      </button>
                    </nav>
                    <p class="text-muted small mt-2 mb-0">Total pedidos: {{ ventasPagination.total }}</p>
                  </div>
                </section>
              </div>
            </div>
          </div>

          <div v-else-if="activeTab === 'manual-sales'" class="tab-panel" role="tabpanel">
            <div class="row g-4">
              <div class="col-12 col-lg-7">
                <section class="panel h-100">
                  <h3 class="h5 mb-3">Registrar venta</h3>
                  <form class="row g-3">
                    <div class="col-12">
                      <label class="form-label">Cliente</label>
                      <input type="text" class="form-control" placeholder="Nombre o razón social" />
                    </div>
                    <div class="col-12 col-md-6">
                      <label class="form-label">Tipo de documento</label>
                      <select class="form-select">
                        <option>Boleta</option>
                        <option>Factura</option>
                      </select>
                    </div>
                    <div class="col-12 col-md-6">
                      <label class="form-label">Número de documento</label>
                      <input type="text" class="form-control" placeholder="Ej: 123456" />
                    </div>
                    <div class="col-12">
                      <label class="form-label">Productos</label>
                      <textarea class="form-control" rows="3" placeholder="Detalle de productos vendidos"></textarea>
                    </div>
                    <div class="col-12 col-md-6">
                      <label class="form-label">Subtotal</label>
                      <div class="input-group">
                        <span class="input-group-text">$</span>
                        <input type="number" min="0" class="form-control" />
                      </div>
                    </div>
                    <div class="col-12 col-md-6">
                      <label class="form-label">Descuento aplicado</label>
                      <div class="input-group">
                        <span class="input-group-text">$</span>
                        <input type="number" min="0" class="form-control" />
                      </div>
                    </div>
                    <div class="col-12 col-md-6">
                      <label class="form-label">Método de pago</label>
                      <select class="form-select">
                        <option>Tarjeta</option>
                        <option>Transferencia</option>
                        <option>Efectivo</option>
                      </select>
                    </div>
                    <div class="col-12 col-md-6">
                      <label class="form-label">Total</label>
                      <div class="input-group">
                        <span class="input-group-text">$</span>
                        <input type="number" min="0" class="form-control" />
                      </div>
                    </div>
                    <div class="col-12">
                      <label class="form-label">Observaciones</label>
                      <textarea class="form-control" rows="2" placeholder="Notas internas"></textarea>
                    </div>
                    <div class="col-12 d-flex gap-2">
                      <button type="submit" class="btn btn-primary">Confirmar venta</button>
                      <button type="reset" class="btn btn-outline-secondary">Limpiar</button>
                    </div>
                  </form>
                </section>
              </div>
              <div class="col-12 col-lg-5">
                <section class="panel h-100">
                  <h3 class="h5 mb-3">Historial manual</h3>
                  <ul class="list-group list-group-flush">
                    <li class="list-group-item px-0">
                      <div class="d-flex justify-content-between">
                        <div>
                          <p class="mb-1 fw-semibold">Venta #M-204</p>
                          <small class="text-muted">Boleta · 18 mayo</small>
                        </div>
                        <p class="fw-semibold mb-0">$59.990</p>
                      </div>
                      <p class="mb-0 text-muted small">Cliente: Boutique Local</p>
                    </li>
                    <li class="list-group-item px-0">
                      <div class="d-flex justify-content-between">
                        <div>
                          <p class="mb-1 fw-semibold">Venta #M-203</p>
                          <small class="text-muted">Factura · 17 mayo</small>
                        </div>
                        <p class="fw-semibold mb-0">$109.990</p>
                      </div>
                      <p class="mb-0 text-muted small">Cliente: Producciones Boreal</p>
                    </li>
                    <li class="list-group-item px-0">
                      <div class="d-flex justify-content-between">
                        <div>
                          <p class="mb-1 fw-semibold">Venta #M-202</p>
                          <small class="text-muted">Boleta · 16 mayo</small>
                        </div>
                        <p class="fw-semibold mb-0">$39.990</p>
                      </div>
                      <p class="mb-0 text-muted small">Cliente: Tienda Étoile</p>
                    </li>
                  </ul>
                </section>
              </div>
            </div>
          </div>

          <div v-else class="tab-panel" role="tabpanel">
            <div class="row g-4">
              <div class="col-12 col-lg-6">
                <section class="panel h-100">
                  <h3 class="h5 mb-3">Generar reporte</h3>
                  <form class="row g-3">
                    <div class="col-12 col-md-6">
                      <label class="form-label">Desde</label>
                      <input type="date" class="form-control" />
                    </div>
                    <div class="col-12 col-md-6">
                      <label class="form-label">Hasta</label>
                      <input type="date" class="form-control" />
                    </div>
                    <div class="col-12">
                      <label class="form-label">Tipo de reporte</label>
                      <select class="form-select">
                        <option>Ventas totales</option>
                        <option>Productos más vendidos</option>
                        <option>Descuentos aplicados</option>
                        <option>Inventario crítico</option>
                      </select>
                    </div>
                    <div class="col-12">
                      <label class="form-label">Formato</label>
                      <div class="d-flex flex-wrap gap-3">
                        <div class="form-check">
                          <input class="form-check-input" type="radio" name="report-format" id="format-pdf" checked />
                          <label class="form-check-label" for="format-pdf">PDF</label>
                        </div>
                        <div class="form-check">
                          <input class="form-check-input" type="radio" name="report-format" id="format-xlsx" />
                          <label class="form-check-label" for="format-xlsx">Excel</label>
                        </div>
                        <div class="form-check">
                          <input class="form-check-input" type="radio" name="report-format" id="format-csv" />
                          <label class="form-check-label" for="format-csv">CSV</label>
                        </div>
                      </div>
                    </div>
                    <div class="col-12">
                      <label class="form-label">Enviar por correo</label>
                      <input type="email" class="form-control" placeholder="administracion@larmone.cl" />
                    </div>
                    <div class="col-12 d-flex gap-2">
                      <button type="submit" class="btn btn-primary">Generar</button>
                      <button type="reset" class="btn btn-outline-secondary">Limpiar</button>
                    </div>
                  </form>
                </section>
              </div>
              <div class="col-12 col-lg-6">
                <section class="panel h-100">
                  <h3 class="h5 mb-3">Resumen del período</h3>
                  <div class="row g-3">
                    <div class="col-12 col-sm-6">
                      <div class="summary-card rounded-4 p-3">
                        <p class="text-uppercase small text-muted mb-1">Ventas totales</p>
                        <p class="h4 mb-0 fw-bold">$489.000</p>
                        <p class="small text-success mb-0">
                          <i class="bi bi-arrow-up-right me-1"></i>
                          +8% vs período anterior
                        </p>
                      </div>
                    </div>
                    <div class="col-12 col-sm-6">
                      <div class="summary-card rounded-4 p-3">
                        <p class="text-uppercase small text-muted mb-1">Margen estimado</p>
                        <p class="h4 mb-0 fw-bold">$189.000</p>
                        <p class="small text-success mb-0">
                          <i class="bi bi-activity me-1"></i>
                          38% de margen
                        </p>
                      </div>
                    </div>
                    <div class="col-12 col-sm-6">
                      <div class="summary-card rounded-4 p-3">
                        <p class="text-uppercase small text-muted mb-1">Descuentos aplicados</p>
                        <p class="h4 mb-0 fw-bold">$39.500</p>
                        <p class="small text-muted mb-0">Campañas activas: 3</p>
                      </div>
                    </div>
                    <div class="col-12 col-sm-6">
                      <div class="summary-card rounded-4 p-3">
                        <p class="text-uppercase small text-muted mb-1">Inventario crítico</p>
                        <p class="h4 mb-0 fw-bold">5 SKU</p>
                        <p class="small text-muted mb-0">Reponer antes de 7 días</p>
                      </div>
                    </div>
                  </div>
                  <div class="alert alert-warning mt-4" role="alert">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Revisa los descuentos vigentes antes de cerrar el mes.
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <ProductImagesModal
      :show="mostrarModalImagenes"
      :producto="productoParaImagenes"
      @close="cerrarModalImagenes"
      @imagenes-actualizadas="cargarProductos(productosPagination.page)"
    />
  </section>
</template>

<style scoped>
.admin-dashboard {
  background: linear-gradient(180deg, #f6f4ff 0%, #ffffff 40%);
  min-height: calc(100vh - 88px);
}

.dashboard-hero {
  background: radial-gradient(circle at top right, rgba(103, 82, 255, 0.8), rgba(46, 29, 126, 0.9));
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 20px 40px rgba(23, 16, 82, 0.25);
}

.dashboard-hero .badge {
  letter-spacing: 0.1em;
  background-color: rgba(255, 255, 255, 0.16) !important;
}

.quick-metrics {
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 28px rgba(18, 18, 46, 0.18);
}

.metric-tile {
  background: rgba(246, 244, 255, 0.9);
  border: 1px solid rgba(103, 82, 255, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.metric-tile:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(103, 82, 255, 0.2);
}

.tab-navigation .nav-link {
  border-radius: 999px;
  border: 1px solid transparent;
  color: #4a4a68;
  font-weight: 500;
  padding-inline: 1.1rem;
}

.tab-navigation .nav-link.active {
  background-color: #6752ff;
  border-color: #6752ff;
  color: #fff;
  box-shadow: 0 10px 20px rgba(103, 82, 255, 0.3);
}

.panel {
  background: #ffffff;
  border: 1px solid rgba(103, 82, 255, 0.08);
  border-radius: 1.25rem;
  padding: 1.5rem;
  box-shadow: 0 12px 24px rgba(15, 14, 36, 0.08);
}

.panel h3 {
  color: #272752;
}

.summary-card {
  background: rgba(103, 82, 255, 0.08);
  border: 1px solid rgba(103, 82, 255, 0.15);
}

.order-list .list-group-item {
  border-left: 0;
  border-right: 0;
  border-bottom: 1px solid rgba(103, 82, 255, 0.1);
  padding-inline: 0;
}

@media (max-width: 991.98px) {
  .dashboard-hero {
    text-align: center;
  }

  .quick-metrics {
    margin-inline: auto;
    max-width: 340px;
  }
}

@media (max-width: 575.98px) {
  .panel {
    padding: 1.25rem;
  }

  .tab-navigation {
    width: 100%;
  }

  .tab-navigation .nav-link {
    flex: 1 1 auto;
    justify-content: center;
  }

  .dashboard-hero {
    padding: 2.5rem 1.5rem;
  }
}
</style>
