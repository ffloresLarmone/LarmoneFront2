import { request } from './apiClient'
import type { Carrito, CarritoActualizar } from '../types/api'

export async function getCart(): Promise<Carrito> {
  return request<Carrito>('/carrito')
}

export async function updateCart(payload: CarritoActualizar): Promise<Carrito> {
  return request<Carrito>('/carrito', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
