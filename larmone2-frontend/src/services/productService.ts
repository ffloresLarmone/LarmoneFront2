import { request } from './apiClient'
import type { PagedResponse, Producto } from '../types/api'

export interface FetchProductsParams {
  q?: string
  page?: number
  size?: number
}

export async function fetchProducts(params: FetchProductsParams = {}): Promise<PagedResponse<Producto>> {
  const query = new URLSearchParams()
  if (params.q) {
    query.set('q', params.q)
  }
  if (params.page) {
    query.set('page', params.page.toString())
  }
  if (params.size) {
    query.set('size', params.size.toString())
  }
  const queryString = query.toString()
  const url = `/productos${queryString ? `?${queryString}` : ''}`
  return request<PagedResponse<Producto>>(url)
}

export async function fetchProductById(id: number): Promise<Producto> {
  return request<Producto>(`/productos/${id}`)
}
