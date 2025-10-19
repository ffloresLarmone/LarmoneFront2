<script setup lang="ts">
import { computed, ref } from 'vue'
import ProductImageManager from '../components/products/ProductImageManager.vue'
import type { ImagenProducto } from '../types/api'

interface TabConfig {
  id: string
  label: string
  description: string
  icon: string
}

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

const imagenesProducto = ref<ImagenProducto[]>([])

const resumenImagenes = computed(() => {
  const total = imagenesProducto.value.length
  if (!total) return ''
  return `${total} ${total === 1 ? 'imagen' : 'imágenes'} registradas`
})

const manejarImagenesActualizadas = (imagenes: ImagenProducto[]) => {
  imagenesProducto.value = imagenes
}
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
                      <p class="h4 fw-bold mb-0">128</p>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="metric-tile rounded-3 p-3">
                      <p class="small text-uppercase text-muted mb-1">Pedidos pendientes</p>
                      <p class="h4 fw-bold mb-0">14</p>
                    </div>
                  </div>
                  <div class="col-12">
                    <div class="metric-tile rounded-3 p-3">
                      <p class="small text-uppercase text-muted mb-1">Actualización requerida</p>
                      <p class="mb-0 d-flex align-items-center gap-2">
                        <i class="bi bi-upload"></i>
                        Subir fotos a 6 productos
                      </p>
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
              <div class="col-12 col-xl-6">
                <section class="panel h-100">
                  <header class="d-flex justify-content-between align-items-center mb-3">
                    <h3 class="h5 mb-0">Ficha de producto</h3>
                    <button class="btn btn-sm btn-outline-primary">
                      <i class="bi bi-plus-lg me-1"></i>
                      Nuevo producto
                    </button>
                  </header>
                  <form class="row g-3">
                    <div class="col-12 col-md-6">
                      <label class="form-label">ID del producto</label>
                      <input
                        type="text"
                        class="form-control"
                        placeholder="Ej: prod-123"
                        v-model="productoSeleccionadoModel"
                      />
                      <small class="text-muted d-block mt-1">
                        Ingresa el identificador o slug expuesto por la API para consultar las imágenes.
                      </small>
                    </div>
                    <div class="col-12">
                      <label class="form-label">Nombre</label>
                      <input type="text" class="form-control" placeholder="Ej: Vestido seda Aurora" />
                    </div>
                    <div class="col-12">
                      <label class="form-label">Descripción</label>
                      <textarea class="form-control" rows="3" placeholder="Detalles del producto"></textarea>
                    </div>
                    <div class="col-12 col-md-6">
                      <label class="form-label">Precio base</label>
                      <div class="input-group">
                        <span class="input-group-text">$</span>
                        <input type="number" min="0" class="form-control" placeholder="0" />
                      </div>
                    </div>
                    <div class="col-12 col-md-6">
                      <label class="form-label">Descuento (%)</label>
                      <input type="number" min="0" max="100" class="form-control" placeholder="Ej: 10" />
                    </div>
                    <div class="col-12 col-md-6">
                      <label class="form-label">Inventario total</label>
                      <input type="number" min="0" class="form-control" placeholder="Ej: 50" />
                    </div>
                    <div class="col-12 col-md-6">
                      <label class="form-label">Stock disponible</label>
                      <input type="number" min="0" class="form-control" placeholder="Ej: 48" />
                    </div>
                    <div class="col-12">
                      <label class="form-label">Etiquetas para filtros</label>
                      <input type="text" class="form-control" placeholder="Ej: fiesta, seda, colección verano" />
                    </div>
                    <div class="col-12">
                      <label class="form-label">Visibilidad</label>
                      <div class="d-flex flex-wrap gap-3">
                        <div class="form-check">
                          <input class="form-check-input" type="radio" name="visibility" id="visible" checked />
                          <label class="form-check-label" for="visible">Visible</label>
                        </div>
                        <div class="form-check">
                          <input class="form-check-input" type="radio" name="visibility" id="hidden" />
                          <label class="form-check-label" for="hidden">Oculto</label>
                        </div>
                        <div class="form-check">
                          <input class="form-check-input" type="radio" name="visibility" id="blocked" />
                          <label class="form-check-label" for="blocked">Bloqueado</label>
                        </div>
                      </div>
                    </div>
                    <div class="col-12">
                      <label class="form-label d-flex justify-content-between align-items-center">
                        Imágenes del producto
                        <span v-if="resumenImagenes" class="badge bg-light text-muted">{{ resumenImagenes }}</span>
                      </label>
                      <ProductImageManager
                        :id-producto="productoSeleccionado"
                        @imagenes-actualizadas="manejarImagenesActualizadas"
                      />
                    </div>
                    <div class="col-12 d-flex gap-2">
                      <button type="submit" class="btn btn-primary">Guardar cambios</button>
                      <button type="reset" class="btn btn-outline-secondary">Descartar</button>
                    </div>
                  </form>
                </section>
              </div>
              <div class="col-12 col-xl-6">
                <section class="panel h-100">
                  <header class="d-flex justify-content-between align-items-center mb-3">
                    <h3 class="h5 mb-0">Control de inventario</h3>
                    <button class="btn btn-sm btn-outline-secondary">
                      <i class="bi bi-arrow-repeat me-1"></i>
                      Sincronizar
                    </button>
                  </header>
                  <div class="table-responsive">
                    <table class="table align-middle">
                      <thead>
                        <tr>
                          <th scope="col">Producto</th>
                          <th scope="col" class="text-end">Stock</th>
                          <th scope="col" class="text-end">Bloqueado</th>
                          <th scope="col" class="text-end">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <p class="fw-semibold mb-0">Vestido Aurora</p>
                            <small class="text-muted">SKU: AUR-001</small>
                          </td>
                          <td class="text-end">24</td>
                          <td class="text-end">0</td>
                          <td class="text-end">
                            <button class="btn btn-sm btn-link">Editar</button>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <p class="fw-semibold mb-0">Blusa Coral</p>
                            <small class="text-muted">SKU: COR-014</small>
                          </td>
                          <td class="text-end">12</td>
                          <td class="text-end">4</td>
                          <td class="text-end">
                            <button class="btn btn-sm btn-link">Editar</button>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <p class="fw-semibold mb-0">Chaqueta Boreal</p>
                            <small class="text-muted">SKU: BOR-209</small>
                          </td>
                          <td class="text-end">6</td>
                          <td class="text-end">2</td>
                          <td class="text-end">
                            <button class="btn btn-sm btn-link">Editar</button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div class="alert alert-info mt-3" role="alert">
                    <i class="bi bi-info-circle me-2"></i>
                    Ajusta el inventario para sincronizarlo con el stock disponible en tienda física.
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
                  <div class="d-grid gap-3">
                    <div>
                      <label class="form-label">Buscar por cliente</label>
                      <input type="search" class="form-control" placeholder="Nombre, correo o RUT" />
                    </div>
                    <div>
                      <label class="form-label">Estado del pedido</label>
                      <select class="form-select">
                        <option>Pendiente de envío</option>
                        <option>Creado</option>
                        <option>Enviado</option>
                        <option>Cerrado</option>
                      </select>
                    </div>
                    <div>
                      <label class="form-label">Rango de fechas</label>
                      <div class="row g-2">
                        <div class="col-6">
                          <input type="date" class="form-control" />
                        </div>
                        <div class="col-6">
                          <input type="date" class="form-control" />
                        </div>
                      </div>
                    </div>
                    <button class="btn btn-primary">Aplicar filtros</button>
                  </div>
                </section>
              </div>
              <div class="col-12 col-xl-8">
                <section class="panel h-100">
                  <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                    <h3 class="h5 mb-0">Pedidos recientes</h3>
                    <button class="btn btn-sm btn-outline-secondary">
                      <i class="bi bi-arrow-clockwise me-1"></i>
                      Actualizar lista
                    </button>
                  </div>
                  <div class="list-group order-list">
                    <article class="list-group-item list-group-item-action flex-column align-items-start">
                      <div class="d-flex w-100 justify-content-between flex-wrap gap-2">
                        <div>
                          <h4 class="h6 mb-1">Pedido #10231</h4>
                          <p class="mb-1 text-muted">Cliente: Ana Rojas · ana@correo.cl</p>
                        </div>
                        <span class="badge rounded-pill text-bg-warning align-self-center">Pendiente de envío</span>
                      </div>
                      <p class="mb-2">Total pagado: $149.990 · 3 productos</p>
                      <div class="d-flex flex-wrap gap-2">
                        <button class="btn btn-sm btn-outline-primary">
                          <i class="bi bi-truck me-1"></i>
                          Marcar como enviado
                        </button>
                        <button class="btn btn-sm btn-outline-secondary">
                          <i class="bi bi-person-vcard me-1"></i>
                          Ver datos del cliente
                        </button>
                        <button class="btn btn-sm btn-outline-secondary">
                          <i class="bi bi-file-earmark-arrow-up me-1"></i>
                          Cargar boleta/factura
                        </button>
                      </div>
                    </article>
                    <article class="list-group-item list-group-item-action flex-column align-items-start">
                      <div class="d-flex w-100 justify-content-between flex-wrap gap-2">
                        <div>
                          <h4 class="h6 mb-1">Pedido #10224</h4>
                          <p class="mb-1 text-muted">Cliente: Claudia Díaz · claudiadiaz@mail.com</p>
                        </div>
                        <span class="badge rounded-pill text-bg-success align-self-center">Enviado</span>
                      </div>
                      <p class="mb-2">Total pagado: $89.990 · 1 producto</p>
                      <div class="d-flex flex-wrap gap-2">
                        <button class="btn btn-sm btn-outline-secondary">
                          <i class="bi bi-person-vcard me-1"></i>
                          Ver datos del cliente
                        </button>
                        <button class="btn btn-sm btn-outline-secondary">
                          <i class="bi bi-file-earmark-arrow-up me-1"></i>
                          Adjuntar documento
                        </button>
                        <button class="btn btn-sm btn-outline-secondary">
                          <i class="bi bi-check2-circle me-1"></i>
                          Cerrar pedido
                        </button>
                      </div>
                    </article>
                    <article class="list-group-item list-group-item-action flex-column align-items-start">
                      <div class="d-flex w-100 justify-content-between flex-wrap gap-2">
                        <div>
                          <h4 class="h6 mb-1">Pedido #10212</h4>
                          <p class="mb-1 text-muted">Cliente: Felipe Morales · felipe@ejemplo.com</p>
                        </div>
                        <span class="badge rounded-pill text-bg-secondary align-self-center">Cerrado</span>
                      </div>
                      <p class="mb-2">Total pagado: $59.990 · 2 productos</p>
                      <div class="d-flex flex-wrap gap-2">
                        <button class="btn btn-sm btn-outline-secondary">
                          <i class="bi bi-receipt me-1"></i>
                          Ver detalle
                        </button>
                        <button class="btn btn-sm btn-outline-secondary">
                          <i class="bi bi-file-earmark-arrow-up me-1"></i>
                          Actualizar documento
                        </button>
                      </div>
                    </article>
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
