import { request, withAdminRole } from './apiClient'
import type {
  ActualizarMarcaPayload,
  CrearMarcaPayload,
  Marca,
  PagedResponse,
} from '../types/api'

export interface FetchBrandsParams {
  page?: number
  pageSize?: number
}

const buildQueryString = (params: FetchBrandsParams): string => {
  const query = new URLSearchParams()

  if (typeof params.page === 'number' && params.page > 0) {
    query.set('page', params.page.toString())
  }

  if (typeof params.pageSize === 'number' && params.pageSize > 0) {
    query.set('pageSize', params.pageSize.toString())
  }

  const queryString = query.toString()
  return queryString ? `?${queryString}` : ''
}

export async function fetchBrands(
  params: FetchBrandsParams = {},
): Promise<PagedResponse<Marca>> {
  const queryString = buildQueryString(params)
  return request<PagedResponse<Marca>>(`/marcas${queryString}`, withAdminRole())
}

export async function createBrand(payload: CrearMarcaPayload): Promise<Marca> {
  return request<Marca>(
    '/marcas',
    withAdminRole({
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  )
}

export async function updateBrand(
  id: number | string,
  payload: ActualizarMarcaPayload,
): Promise<Marca> {
  return request<Marca>(
    `/marcas/${encodeURIComponent(id)}`,
    withAdminRole({
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  )
}

export async function deleteBrand(id: number | string): Promise<void> {
  await request(
    `/marcas/${encodeURIComponent(id)}`,
    withAdminRole({
      method: 'DELETE',
    }),
  )
}
