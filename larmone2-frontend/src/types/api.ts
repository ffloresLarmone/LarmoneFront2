export interface ImagenProducto {
  id?: string
  url: string
  alt?: string | null
  principal?: boolean
  orden?: number | null
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

export interface ProductoRatingResumen {
  total: number
  promedio: number
  distribucion: Record<string, number>
}

export interface Producto {
  id: string
  nombre: string
  slug: string
  descripcion?: string | null
  descripcionCorta?: string | null
  marca?: string | null
  precio: number
  activo: boolean
  destacado: boolean
  skuBase?: string | null
  createdAt: string
  updatedAt?: string
  imagenes?: ImagenProducto[]
  categorias?: ProductoCategoriaResumen[]
  atributos?: ProductoAtributo[]
  stockTotal?: number
  rating?: number
  ratingCount?: number
  ratingResumen?: ProductoRatingResumen
}

export interface PagedResponse<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface CarritoProductoResumen {
  id: string
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
