import { defineStore } from 'pinia'
import { getCart, updateCart } from '../services/cartService'
import type { Carrito, CarritoActualizar, ItemCarrito } from '../types/api'

interface CartState {
  cart: Carrito | null
  loading: boolean
  error: string | null
}

export const useCartStore = defineStore('cart', {
  state: (): CartState => ({
    cart: null,
    loading: false,
    error: null,
  }),
  getters: {
    itemCount: (state) => state.cart?.items.reduce((acc, item) => acc + item.cantidad, 0) ?? 0,
  },
  actions: {
    async fetchCart() {
      this.loading = true
      this.error = null
      try {
        this.cart = await getCart()
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'No se pudo cargar el carrito'
      } finally {
        this.loading = false
      }
    },
    async addItem(item: ItemCarrito) {
      this.loading = true
      this.error = null
      try {
        const currentItems = this.cart?.items ?? []
        const existingIndex = currentItems.findIndex((i) => i.id_variante === item.id_variante)
        let updatedItems: ItemCarrito[]
        if (existingIndex >= 0) {
          updatedItems = currentItems.map((i, idx) =>
            idx === existingIndex ? { ...i, cantidad: i.cantidad + item.cantidad } : i
          )
        } else {
          updatedItems = [...currentItems, item]
        }
        this.cart = await updateCart({ items: updatedItems })
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'No se pudo actualizar el carrito'
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
