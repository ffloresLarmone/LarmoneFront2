import { defineStore } from 'pinia'
import {
  addCartItem,
  clearCart as clearCartRequest,
  getCart,
  removeCartItem as removeCartItemRequest,
  updateCartItem as updateCartItemRequest,
} from '../services/cartService'
import { FALLBACK_IMAGE, obtenerImagenPrincipal } from '../services/imageService'
import type { Carrito, CarritoItem } from '../types/api'

export interface CartItemDisplay {
  id: string
  id_producto: string
  cantidad: number
  precioUnitario: number
  nombre?: string
  imagen?: string
}

interface CartState {
  cart: Carrito | null
  loading: boolean
  error: string | null
  isDrawerOpen: boolean
}

const mapToDisplayItem = (item: CarritoItem): CartItemDisplay => {
  const principal = obtenerImagenPrincipal(item.producto?.imagenes)
  return {
    id: item.id,
    id_producto: item.id_producto,
    cantidad: item.cantidad,
    precioUnitario: item.precioUnitario,
    nombre: item.producto?.nombre,
    imagen: principal?.url ?? FALLBACK_IMAGE,
  }
}

export const useCartStore = defineStore('cart', {
  state: (): CartState => ({
    cart: null,
    loading: false,
    error: null,
    isDrawerOpen: false,
  }),
  getters: {
    items(state): CartItemDisplay[] {
      return state.cart?.items.map(mapToDisplayItem) ?? []
    },
    itemCount(state): number {
      return state.cart?.items.reduce((acc, item) => acc + item.cantidad, 0) ?? 0
    },
    totalAmount(state): number {
      if (typeof state.cart?.total === 'number') {
        return state.cart.total
      }
      return state.cart?.items.reduce(
        (acc, item) => acc + item.cantidad * item.precioUnitario,
        0,
      ) ?? 0
    },
    isEmpty(): boolean {
      return this.itemCount === 0
    },
  },
  actions: {
    openDrawer() {
      this.isDrawerOpen = true
    },
    closeDrawer() {
      this.isDrawerOpen = false
    },
    toggleDrawer() {
      this.isDrawerOpen = !this.isDrawerOpen
    },
    async refreshCart() {
      try {
        const cart = await getCart()
        this.cart = cart
        this.error = null
      } catch (error) {
        this.cart = null
        if (error instanceof Error) {
          this.error = error.message
          throw error
        }
        this.error = 'No pudimos obtener tu carrito en este momento.'
        throw new Error(this.error)
      }
    },
    async fetchCart() {
      this.loading = true
      this.error = null
      try {
        await this.refreshCart()
      } catch (error) {
        if (!(error instanceof Error)) {
          this.error = 'No pudimos obtener tu carrito en este momento.'
        }
      } finally {
        this.loading = false
      }
    },
    async addItem({ productoId, cantidad = 1 }: { productoId: string; cantidad?: number }) {
      if (!productoId) {
        throw new Error('Se requiere un identificador de producto para agregar al carrito.')
      }

      this.loading = true
      this.error = null
      try {
        await addCartItem({ productoId, cantidad })
        await this.refreshCart()
      } catch (error) {
        this.cart = null
        if (error instanceof Error) {
          this.error = error.message
          throw error
        }
        this.error = 'No pudimos agregar el producto al carrito.'
        throw new Error(this.error)
      } finally {
        this.loading = false
      }
    },
    async updateItemQuantity(id_producto: string, cantidad: number) {
      if (!id_producto) return
      if (cantidad <= 0) {
        await this.removeItem(id_producto)
        return
      }

      this.loading = true
      this.error = null
      try {
        await updateCartItemRequest({ id_producto, cantidad })
        await this.refreshCart()
      } catch (error) {
        this.cart = null
        if (error instanceof Error) {
          this.error = error.message
        } else {
          this.error = 'No fue posible actualizar la cantidad.'
        }
      } finally {
        this.loading = false
      }
    },
    async incrementItem(id_producto: string) {
      const current = this.cart?.items.find((item) => item.id_producto === id_producto)
      const nextCantidad = (current?.cantidad ?? 0) + 1
      await this.updateItemQuantity(id_producto, nextCantidad)
    },
    async decrementItem(id_producto: string) {
      const current = this.cart?.items.find((item) => item.id_producto === id_producto)
      if (!current) return
      const nextCantidad = current.cantidad - 1
      await this.updateItemQuantity(id_producto, nextCantidad)
    },
    async removeItem(id_producto: string) {
      if (!id_producto) return

      this.loading = true
      this.error = null
      try {
        await removeCartItemRequest(id_producto)
        await this.refreshCart()
      } catch (error) {
        this.cart = null
        if (error instanceof Error) {
          this.error = error.message
        } else {
          this.error = 'No pudimos eliminar el producto del carrito.'
        }
      } finally {
        this.loading = false
      }
    },
    async clearCart() {
      this.loading = true
      this.error = null
      try {
        await clearCartRequest()
        try {
          await this.refreshCart()
        } catch {
          this.cart = {
            id: this.cart?.id ?? crypto.randomUUID(),
            items: [],
            subtotal: 0,
            total: 0,
            updatedAt: new Date().toISOString(),
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          this.error = error.message
        } else {
          this.error = 'No fue posible vaciar el carrito.'
        }
        this.cart = null
      } finally {
        this.loading = false
      }
    },
  },
})
