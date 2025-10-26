import { request } from './apiClient'
import type {
  ActualizarEnvioEstadoPayload,
  CancelarVentaPayload,
  PagedResponse,
  Venta,
  VentaEnvio,
} from '../types/api'

export interface FetchVentasParams {
  page?: number
  pageSize?: number
  usuarioId?: string
  estado?: string
  q?: string
}

const buildQueryString = (params: FetchVentasParams): string => {
  const query = new URLSearchParams()

  if (typeof params.page === 'number' && params.page > 0) {
    query.set('page', params.page.toString())
  }

  if (typeof params.pageSize === 'number' && params.pageSize > 0) {
    query.set('pageSize', params.pageSize.toString())
  }

  if (params.usuarioId) {
    query.set('usuarioId', params.usuarioId)
  }

  if (params.estado) {
    query.set('estado', params.estado)
  }

  if (params.q) {
    query.set('q', params.q)
  }

  const queryString = query.toString()
  return queryString ? `?${queryString}` : ''
}

export async function fetchVentas(
  params: FetchVentasParams = {},
): Promise<PagedResponse<Venta>> {
  const queryString = buildQueryString(params)
  return request<PagedResponse<Venta>>(`/ventas${queryString}`)
}

export async function cancelVenta(
  ventaId: string,
  payload: CancelarVentaPayload = {},
): Promise<Venta> {
  const body = Object.keys(payload).length > 0 ? JSON.stringify(payload) : undefined

  return request<Venta>(`/ventas/${encodeURIComponent(ventaId)}/cancelar`, {
    method: 'PATCH',
    body,
  })
}

export async function updateEnvioEstado(
  envioId: string,
  payload: ActualizarEnvioEstadoPayload,
): Promise<VentaEnvio> {
  return request<VentaEnvio>(`/envios/${encodeURIComponent(envioId)}/estado`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
