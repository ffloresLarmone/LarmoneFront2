export interface ImagenProducto {
  id_imagen: number
  url_publica: string
  mime_type: string
  principal: boolean
}

export interface Producto {
  id_producto: number
  sku: string
  nombre: string
  slug: string
  activo: boolean
  creado_en: string
  imagenes: ImagenProducto[]
}

export interface ProductoCrear {
  sku: string
  nombre: string
  slug: string
  descripcion_corta?: string
  descripcion_larga?: string
  activo?: boolean
}

export interface ProductoEditar extends ProductoCrear {}

export interface ItemCarrito {
  id_variante: number
  cantidad: number
  precio_unitario?: number
}

export interface Carrito {
  id_carrito: number
  items: ItemCarrito[]
  total: number
}

export interface CarritoActualizar {
  items: ItemCarrito[]
}

export interface Pedido {
  id_pedido: number
  codigo_publico: string
  total: number
  estado: string
  creado_en: string
}

export interface PagedResponse<T> {
  items: T[]
  page: number
  size: number
  total: number
}
