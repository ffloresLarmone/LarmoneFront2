export interface ImagenProducto {
  id?: string
  url: string
  alt?: string | null
  principal?: boolean
  orden?: number | null
}

export interface Marca {
  id: number
  nombre: string
  slug: string
  activo: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ProductoCategoriaResumen {
  categoria: {
    id: string
    nombre: string
    slug: string
  }
}

export interface ProductoAtributo {
  clave: string
  valor: string
}

export type ProductoAtributosJson = Record<string, unknown>

export interface ProductoRatingResumen {
  total: number
  promedio: number
  distribucion: Record<string, number>
}

export interface Producto {
  id: string
  id_producto?: string
  sku: string
  nombre: string
  slug: string
  descripcion?: string | null
  descripcionCorta?: string | null
  descripcionLarga?: string | null
  marca?: string | null
  marcaId?: number | null
  tasaImpuestoId?: number | null
  precio?: number | null
  activo: boolean
  destacado?: boolean
  skuBase?: string | null
  pesoGramos?: number | null
  volumenMl?: number | null
  createdAt?: string
  updatedAt?: string
  creadoEn?: string
  actualizadoEn?: string | null
  eliminado?: boolean
  eliminadoEn?: string | null
  rowver?: string
  imagenes?: ImagenProducto[]
  categorias?: ProductoCategoriaResumen[]
  atributos?: ProductoAtributo[]
  atributosJson?: ProductoAtributosJson | null
  stockTotal?: number
  rating?: number
  ratingCount?: number
  ratingResumen?: ProductoRatingResumen
}

export interface ProductoStockDetalle {
  productoId: string
  bodega?: string | null
  cantidad: number
  stockMin?: number | null
  alertaBajoStock?: boolean
}

export interface ProductoStockGlobal {
  productoId: string
  stockTotal: number
  porBodega: ProductoStockDetalle[]
}

export interface ActualizarStockMinPayload {
  bodega?: string | null
  stockMin: number
}

export interface ActualizarStockPayload {
  stock: number
  bodega?: string | null
  motivo?: string | null
}

export interface RegistrarEntradaInventarioPayload {
  productoId: string
  cantidad: number
  bodegaNombre?: string | null
  motivo?: string | null
  refTipo?: string | null
  refId?: string | null
}

export interface RegistrarSalidaInventarioPayload {
  productoId: string
  cantidad: number
  bodegaNombre?: string | null
  motivo?: string | null
  refTipo?: string | null
  refId?: string | null
  permitirNegativo?: boolean
}

export interface RegistrarAjusteInventarioPayload {
  productoId: string
  delta: number
  bodegaNombre?: string | null
  motivo?: string | null
}

export interface CrearMarcaPayload {
  nombre: string
  slug: string
  activo?: boolean
}

export type ActualizarMarcaPayload = Partial<CrearMarcaPayload>

export interface CrearProductoPayload {
  sku: string
  nombre: string
  slug: string
  descripcion?: string | null
  descripcion_corta?: string | null
  descripcion_larga?: string | null
  marca?: string | null
  id_marca?: number | null
  id_tasa_impuesto?: number | null
  precio?: number | null
  stockTotal?: number | null
  activo?: boolean
  destacado?: boolean
  pesoGramos?: number | null
  volumenMl?: number | null
  categorias?: string[]
  imagenes?: ImagenProducto[]
  atributos?: ProductoAtributo[]
  atributosJson?: ProductoAtributosJson | null
}

export type ActualizarProductoPayload = Partial<CrearProductoPayload>

export interface PagedResponse<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface CarritoProductoResumen {
  id: string
  sku?: string
  nombre: string
  slug: string
  precio: number
  marca?: string | null
  activo?: boolean
  destacado?: boolean
  imagenes?: ImagenProducto[]
}

export interface CarritoItem {
  id: string
  productoId: string
  cantidad: number
  precioUnitario: number
  subtotal: number
  producto?: CarritoProductoResumen
  createdAt?: string
  updatedAt?: string
}

export interface Carrito {
  id: string
  usuarioId?: string
  items: CarritoItem[]
  subtotal: number
  descuento?: number
  impuesto?: number
  total: number
  updatedAt: string
}

export interface AddCartItemPayload {
  productoId: string
  cantidad: number
}

export interface UpdateCartItemPayload {
  productoId: string
  cantidad: number
}

export interface VentaItemDetalle {
  id: string
  productoId: string
  sku?: string
  nombre?: string
  slug?: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export interface VentaPago {
  referencia?: string
  metodo?: string
  estado?: string
}

export interface VentaEnvioEstado {
  estado: string
  detalle?: string | null
  ubicacion?: string | null
  registradoEn: string
}

export interface VentaEnvio {
  id: string
  estado: string
  detalle?: string | null
  ubicacion?: string | null
  historial?: VentaEnvioEstado[]
  actualizadoEn?: string
  codigoSeguimiento?: string | null
}

export interface VentaUsuario {
  id?: string
  nombre?: string | null
  email?: string | null
  telefono?: string | null
}

export interface Venta {
  id: string
  numero?: string
  estado: string
  total: number
  subtotal?: number
  descuento?: number | null
  impuesto?: number | null
  createdAt: string
  updatedAt?: string
  usuario?: VentaUsuario | null
  items: VentaItemDetalle[]
  pago?: VentaPago | null
  envio?: VentaEnvio | null
}

export interface CancelarVentaPayload {
  motivo?: string
}

export interface ActualizarEnvioEstadoPayload {
  estado: string
  detalle?: string | null
  ubicacion?: string | null
}
