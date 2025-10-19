import { request } from './apiClient'
import type {
  AddCartItemPayload,
  Carrito,
  CarritoItem,
  UpdateCartItemPayload,
} from '../types/api'

export async function getCart(): Promise<Carrito> {
  return request<Carrito>('/carrito')
}

export async function addCartItem(payload: AddCartItemPayload): Promise<CarritoItem> {
  return request<CarritoItem>('/carrito', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateCartItem(payload: UpdateCartItemPayload): Promise<CarritoItem> {
  return request<CarritoItem>('/carrito', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function removeCartItem(productoId: string): Promise<{ eliminado: boolean }> {
  return request<{ eliminado: boolean }>(`/carrito/${encodeURIComponent(productoId)}`, {
    method: 'DELETE',
  })
}

export async function clearCart(): Promise<{ vaciado: boolean }> {
  return request<{ vaciado: boolean }>('/carrito', {
    method: 'DELETE',
  })
}
