import { request, withAdminRole } from './apiClient'
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

type ProductoResponse = Producto & {
  id_producto?: string | null
  stock_total?: number | string | null
  stock_disponible?: number | string | null
  stockDisponible?: number | string | null
  stock?: number | string | null
}

const parseNumeric = (value: unknown): number | undefined => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return undefined
    }
    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

const resolveStockTotal = (producto: ProductoResponse): number | undefined => {
  const candidates: Array<number | undefined> = [
    parseNumeric(producto.stockTotal),
    parseNumeric(producto.stock_total),
    parseNumeric(producto.stock_disponible),
    parseNumeric(producto.stockDisponible),
    parseNumeric(producto.stock),
  ]

  return candidates.find((value) => typeof value === 'number')
}

const normalizeProducto = (producto: ProductoResponse): Producto => {
  const rawId = typeof producto.id === 'string' ? producto.id.trim() : ''
  const legacyId =
    typeof producto.id_producto === 'string' ? producto.id_producto.trim() : ''

  const finalId = rawId.length > 0 ? rawId : legacyId
  const stockTotal = resolveStockTotal(producto)

  return {
    ...producto,
    id: finalId,
    id_producto: legacyId.length > 0 ? legacyId : finalId || undefined,
    stockTotal: typeof stockTotal === 'number' ? stockTotal : undefined,
  }
}

const mapearProductos = (
  respuesta: PagedResponse<ProductoResponse>,
): PagedResponse<Producto> => ({
  ...respuesta,
  items: respuesta.items.map((item) => normalizeProducto(item)),
})

const applyAdminRole = (
  baseOptions: RequestInit | undefined,
  requireAdmin: boolean,
): RequestInit | undefined => {
  if (requireAdmin) {
    return withAdminRole(baseOptions ?? {})
  }
  return baseOptions
}

export async function fetchProducts(
  params: FetchProductsParams = {},
  options?: { admin?: boolean },
): Promise<PagedResponse<Producto>> {
  const queryString = buildQueryString(params)
  const respuesta = await request<PagedResponse<ProductoResponse>>(
    `/productos${queryString}`,
    applyAdminRole(undefined, options?.admin === true),
  )
  return mapearProductos(respuesta)
}

export async function fetchProductById(
  id: string,
  options?: { admin?: boolean },
): Promise<Producto> {
  const respuesta = await request<ProductoResponse>(
    `/productos/${encodeURIComponent(id)}`,
    applyAdminRole(undefined, options?.admin === true),
  )
  return normalizeProducto(respuesta)
}

export async function fetchProductBySlug(
  slug: string,
  options?: { admin?: boolean },
): Promise<Producto> {
  const respuesta = await request<ProductoResponse>(
    `/productos/slug/${encodeURIComponent(slug)}`,
    applyAdminRole(undefined, options?.admin === true),
  )
  return normalizeProducto(respuesta)
}

export async function createProduct(
  payload: CrearProductoPayload,
  options?: { admin?: boolean },
): Promise<Producto> {
  const respuesta = await request<ProductoResponse>(
    '/productos',
    applyAdminRole(
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      options?.admin ?? true,
    ),
  )
  return normalizeProducto(respuesta)
}

export async function updateProduct(
  id: string,
  payload: ActualizarProductoPayload,
  options?: { admin?: boolean },
)
: Promise<Producto> {
  console.log(JSON.stringify(payload))
  const respuesta = await request<ProductoResponse>(
    `/productos/${encodeURIComponent(id)}`,
    applyAdminRole(
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      options?.admin ?? true,
    ),
  )
  return normalizeProducto(respuesta)
}

export async function deactivateProduct(
  id: string,
  options?: { admin?: boolean },
): Promise<Producto> {
  const respuesta = await request<ProductoResponse>(
    `/productos/${encodeURIComponent(id)}/desactivar`,
    applyAdminRole({ method: 'PATCH' }, options?.admin ?? true),
  )
  return normalizeProducto(respuesta)
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
  return request<ImagenProducto>(
    `/productos/${encodeURIComponent(productId)}/imagenes`,
    withAdminRole({
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  )
}

export async function updateProductImage(
  productId: string,
  imageId: string,
  payload: ActualizarImagenProductoPayload,
): Promise<ImagenProducto> {
  return request<ImagenProducto>(
    `/productos/${encodeURIComponent(productId)}/imagenes/${encodeURIComponent(imageId)}`,
    withAdminRole({
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  )
}

export async function deleteProductImage(productId: string, imageId: string): Promise<void> {
  await request<void>(
    `/productos/${encodeURIComponent(productId)}/imagenes/${encodeURIComponent(imageId)}`,
    withAdminRole({
      method: 'DELETE',
    }),
  )
}
