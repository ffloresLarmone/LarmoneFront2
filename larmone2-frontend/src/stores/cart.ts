import { defineStore } from 'pinia'
import { getCart, updateCart } from '../services/cartService'
import type { Carrito, ItemCarrito } from '../types/api'

export interface CartItemDisplay extends ItemCarrito {
  precio_unitario: number
}

interface CartSnapshot {
  id_carrito: number
  items: CartItemDisplay[]
  total: number
}

interface CartState {
  cart: CartSnapshot | null
  loading: boolean
  error: string | null
  isDrawerOpen: boolean
}

const STORAGE_KEY = 'larmone-cart'

const calculateTotal = (items: CartItemDisplay[]) =>
  items.reduce((acc, item) => acc + item.cantidad * (item.precio_unitario ?? 0), 0)

const normalizeItem = (item: ItemCarrito): CartItemDisplay => ({
  id_variante: item.id_variante,
  cantidad: item.cantidad,
  precio_unitario: item.precio_unitario ?? 0,
  nombre: item.nombre,
  imagen: item.imagen,
})

const loadStoredCart = (): CartSnapshot | null => {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<CartSnapshot>
    if (!parsed || !Array.isArray(parsed.items)) return null

    const items = parsed.items
      .map((item) => ({
        id_variante: item.id_variante,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        nombre: item.nombre,
        imagen: item.imagen,
      }))
      .filter((item): item is CartItemDisplay =>
        typeof item.id_variante === 'number' && typeof item.cantidad === 'number'
      )
      .map((item) => normalizeItem({ ...item, cantidad: Math.max(1, item.cantidad) }))

    return {
      id_carrito: typeof parsed.id_carrito === 'number' ? parsed.id_carrito : Date.now(),
      items,
      total: typeof parsed.total === 'number' ? parsed.total : calculateTotal(items),
    }
  } catch (error) {
    console.warn('No fue posible recuperar el carrito almacenado', error)
    return null
  }
}

const persistCart = (cart: CartSnapshot | null) => {
  if (typeof window === 'undefined' || !cart) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
}

const toUpdatePayload = (items: CartItemDisplay[]): ItemCarrito[] =>
  items.map((item) => ({
    id_variante: item.id_variante,
    cantidad: item.cantidad,
    precio_unitario: item.precio_unitario,
  }))

const mergeWithLocalMetadata = (
  remote: Carrito,
  localItems: CartItemDisplay[]
): CartSnapshot => {
  const items = remote.items.map((item) => {
    const local = localItems.find((localItem) => localItem.id_variante === item.id_variante)
    return {
      ...normalizeItem(item),
      nombre: local?.nombre ?? item.nombre,
      imagen: local?.imagen ?? item.imagen,
    }
  })

  return {
    id_carrito: remote.id_carrito,
    items,
    total: typeof remote.total === 'number' ? remote.total : calculateTotal(items),
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
    items: (state) => state.cart?.items ?? [],
    itemCount: (state) => state.cart?.items.reduce((acc, item) => acc + item.cantidad, 0) ?? 0,
    totalAmount: (state) => state.cart?.total ?? 0,
    isEmpty(): boolean {
      return this.itemCount === 0
    },
  },
  actions: {
    async fetchCart() {
      this.loading = true
      this.error = null

      try {
        const remoteCart = await getCart()
        const snapshot = mergeWithLocalMetadata(remoteCart, this.cart?.items ?? [])
        this.cart = snapshot
        persistCart(snapshot)
      } catch (error) {
        const stored = loadStoredCart()
        if (stored) {
          this.cart = stored
        } else if (!this.cart) {
          this.cart = { id_carrito: Date.now(), items: [], total: 0 }
        }

        if (error instanceof Error) {
          this.error = error.message
        } else {
          this.error = 'No pudimos sincronizar tu carrito. Usaremos los datos locales.'
        }
      } finally {
        this.loading = false
      }
    },
    async syncCart(items: CartItemDisplay[]) {
      const snapshot: CartSnapshot = {
        id_carrito: this.cart?.id_carrito ?? Date.now(),
        items: items.map((item) => normalizeItem(item)),
        total: calculateTotal(items),
      }

      this.cart = snapshot
      persistCart(snapshot)

      try {
        const response = await updateCart({ items: toUpdatePayload(snapshot.items) })
        const merged = mergeWithLocalMetadata(response, snapshot.items)
        this.cart = merged
        persistCart(merged)
        this.error = null
      } catch (error) {
        if (error instanceof Error) {
          this.error = error.message
        } else {
          this.error = 'No pudimos sincronizar tu carrito. Guardamos los cambios localmente.'
        }
      }
    },
    ensureCartLoaded() {
      if (!this.cart) {
        const stored = loadStoredCart()
        if (stored) {
          this.cart = stored
        } else {
          this.cart = { id_carrito: Date.now(), items: [], total: 0 }
        }
      }
    },
    async addItem(item: ItemCarrito) {
      this.ensureCartLoaded()
      this.loading = true
      this.error = null

      const newItem = normalizeItem(item)
      const existingItems = this.cart?.items ?? []
      const index = existingItems.findIndex((cartItem) => cartItem.id_variante === newItem.id_variante)

      const updatedItems = index >= 0
        ? existingItems.map((cartItem, cartIndex) =>
            cartIndex === index
              ? {
                  ...cartItem,
                  cantidad: cartItem.cantidad + newItem.cantidad,
                  precio_unitario: newItem.precio_unitario || cartItem.precio_unitario,
                  nombre: newItem.nombre ?? cartItem.nombre,
                  imagen: newItem.imagen ?? cartItem.imagen,
                }
              : cartItem
          )
        : [...existingItems, newItem]

      await this.syncCart(updatedItems)
      this.loading = false
    },
    async incrementItem(id_variante: ItemCarrito['id_variante']) {
      if (!this.cart) return
      this.loading = true
      const updatedItems = this.cart.items.map((item) =>
        item.id_variante === id_variante
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      )
      await this.syncCart(updatedItems)
      this.loading = false
    },
    async decrementItem(id_variante: ItemCarrito['id_variante']) {
      if (!this.cart) return
      this.loading = true
      const updatedItems = this.cart.items
        .map((item) =>
          item.id_variante === id_variante
            ? { ...item, cantidad: Math.max(0, item.cantidad - 1) }
            : item
        )
        .filter((item) => item.cantidad > 0)
      await this.syncCart(updatedItems)
      this.loading = false
    },
    async removeItem(id_variante: ItemCarrito['id_variante']) {
      if (!this.cart) return
      this.loading = true
      const updatedItems = this.cart.items.filter((item) => item.id_variante !== id_variante)
      await this.syncCart(updatedItems)
      this.loading = false
    },
    async clearCart() {
      this.loading = true
      await this.syncCart([])
      this.loading = false
    },
    openDrawer() {
      this.isDrawerOpen = true
    },
    closeDrawer() {
      this.isDrawerOpen = false
    },
    toggleDrawer() {
      this.isDrawerOpen = !this.isDrawerOpen
    },
  },
})
