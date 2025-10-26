import { request } from './apiClient'
import type {
  ActualizarProductoPayload,
  CrearProductoPayload,
  ImagenProducto,
  PagedResponse,
  Producto,
} from '../types/api'

export interface FetchProductsParams {
  q?: string
  page?: number
  pageSize?: number
  categorias?: string[]
  minPrecio?: number
  maxPrecio?: number
  orden?: 'recientes' | 'precio_asc' | 'precio_desc' | 'nombre_asc'
  soloActivos?: boolean
}

const buildQueryString = (params: FetchProductsParams): string => {
  const query = new URLSearchParams()

  if (params.q) {
    query.set('q', params.q)
  }
  if (typeof params.page === 'number' && params.page > 0) {
    query.set('page', params.page.toString())
  }
  if (typeof params.pageSize === 'number' && params.pageSize > 0) {
    query.set('pageSize', params.pageSize.toString())
  }
  if (params.categorias?.length) {
    query.set('categorias', params.categorias.join(','))
  }
  if (typeof params.minPrecio === 'number') {
    query.set('minPrecio', params.minPrecio.toString())
  }
  if (typeof params.maxPrecio === 'number') {
    query.set('maxPrecio', params.maxPrecio.toString())
  }
  if (params.orden) {
    query.set('orden', params.orden)
  }
  if (params.soloActivos === false) {
    query.set('soloActivos', 'false')
  }

  const queryString = query.toString()
  return queryString ? `?${queryString}` : ''
}

export async function fetchProducts(
  params: FetchProductsParams = {},
): Promise<PagedResponse<Producto>> {
  const queryString = buildQueryString(params)
  return request<PagedResponse<Producto>>(`/productos${queryString}`)
}

export async function fetchProductById(id: string): Promise<Producto> {
  return request<Producto>(`/productos/${encodeURIComponent(id)}`)
}

export async function fetchProductBySlug(slug: string): Promise<Producto> {
  return request<Producto>(`/productos/slug/${encodeURIComponent(slug)}`)
}

export async function createProduct(payload: CrearProductoPayload): Promise<Producto> {
  return request<Producto>('/productos', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateProduct(
  id: string,
  payload: ActualizarProductoPayload,
): Promise<Producto> {
  return request<Producto>(`/productos/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deactivateProduct(id: string): Promise<Producto> {
  return request<Producto>(`/productos/${encodeURIComponent(id)}/desactivar`, {
    method: 'PATCH',
  })
}

export interface CrearImagenProductoPayload {
  url: string
  alt?: string | null
  principal?: boolean
  orden?: number | null
}

export type ActualizarImagenProductoPayload = Partial<CrearImagenProductoPayload>

export async function createProductImage(
  productId: string,
  payload: CrearImagenProductoPayload,
): Promise<ImagenProducto> {
  return request<ImagenProducto>(`/productos/${encodeURIComponent(productId)}/imagenes`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateProductImage(
  productId: string,
  imageId: string,
  payload: ActualizarImagenProductoPayload,
): Promise<ImagenProducto> {
  return request<ImagenProducto>(
    `/productos/${encodeURIComponent(productId)}/imagenes/${encodeURIComponent(imageId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  )
}

export async function deleteProductImage(productId: string, imageId: string): Promise<void> {
  await request<void>(`/productos/${encodeURIComponent(productId)}/imagenes/${encodeURIComponent(imageId)}`, {
    method: 'DELETE',
  })
}
