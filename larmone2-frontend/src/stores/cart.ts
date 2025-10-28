import { defineStore } from 'pinia'
import {
  clearCartFromStorage,
  createEmptyCart,
  loadCartFromStorage,
  persistCartInStorage,
} from '../services/cartService'
import { FALLBACK_IMAGE, obtenerImagenPrincipal } from '../services/imageService'
import { fetchAllProducts } from '../services/productService'
import type { Carrito, CarritoItem, CarritoProductoResumen, Producto } from '../types/api'

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
  inventory: Record<string, Producto>
  inventoryLoading: boolean
  inventoryError: string | null
  inventoryLastFetched: number | null
}

type InventoryMap = Record<string, Producto>

const STOCK_REFRESH_INTERVAL_MS = 15000
const MIN_REFRESH_INTERVAL_MS = 4000

let inventoryPoller: ReturnType<typeof setInterval> | undefined
let ongoingInventoryRequest: Promise<Producto[]> | null = null

const isBrowserEnvironment = () => typeof window !== 'undefined'

const createProductLookup = (productos: Producto[]): InventoryMap => {
  return productos.reduce<InventoryMap>((acc, producto) => {
    if (producto.id) {
      acc[producto.id] = producto
    }
    if (producto.id_producto) {
      acc[producto.id_producto] = producto
    }
    return acc
  }, {})
}

const resolveProductId = (producto: Producto | undefined, fallbackId: string): string => {
  if (!producto) {
    return fallbackId
  }
  if (typeof producto.id === 'string' && producto.id.length > 0) {
    return producto.id
  }
  if (typeof producto.id_producto === 'string' && producto.id_producto.length > 0) {
    return producto.id_producto
  }
  return fallbackId
}

const toCartProductoResumen = (producto: Producto, fallbackId: string): CarritoProductoResumen => ({
  id: resolveProductId(producto, fallbackId),
  sku: producto.sku,
  nombre: producto.nombre,
  slug: producto.slug,
  precio: typeof producto.precio === 'number' && Number.isFinite(producto.precio) ? producto.precio : 0,
  marca: typeof producto.marca === 'string' ? producto.marca : producto.marca ?? null,
  activo: producto.activo,
  destacado: producto.destacado ?? false,
  imagenes: Array.isArray(producto.imagenes) ? producto.imagenes : undefined,
})

const parseNumeric = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      return undefined
    }
    const parsed = Number(trimmed)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return undefined
}

const resolveAvailableStock = (producto?: Producto): number | undefined => {
  if (!producto) {
    return undefined
  }

  const candidates: Array<unknown> = [
    (producto as Producto & { stockTotal?: number }).stockTotal,
    (producto as unknown as Record<string, unknown>).stockDisponible,
    (producto as unknown as Record<string, unknown>).stock_disponible,
    (producto as unknown as Record<string, unknown>).stock,
  ]

  for (const candidate of candidates) {
    const numeric = parseNumeric(candidate)
    if (typeof numeric === 'number') {
      return numeric
    }
  }

  return undefined
}

const recalcCartWithInventory = (cart: Carrito, inventory: InventoryMap): Carrito => {
  const descuento =
    typeof cart.descuento === 'number' && Number.isFinite(cart.descuento) && cart.descuento > 0
      ? cart.descuento
      : undefined
  const impuesto =
    typeof cart.impuesto === 'number' && Number.isFinite(cart.impuesto) && cart.impuesto > 0
      ? cart.impuesto
      : undefined

  const items: CarritoItem[] = []
  let subtotal = 0

  for (const item of cart.items) {
    if (!item) {
      continue
    }

    const currentCantidad = Math.max(0, Math.floor(Number(item.cantidad) || 0))
    if (currentCantidad <= 0) {
      continue
    }

    const productFromInventory =
      inventory[item.id_producto] ??
      (item.producto?.id ? inventory[item.producto.id] : undefined)

    const resolvedProductId = resolveProductId(productFromInventory, item.id_producto)
    const resumen = productFromInventory
      ? toCartProductoResumen(productFromInventory, resolvedProductId)
      : item.producto
    const precioUnitario =
      typeof item.precioUnitario === 'number' && Number.isFinite(item.precioUnitario)
        ? item.precioUnitario
        : resumen?.precio ?? 0

    const itemSubtotal = currentCantidad * precioUnitario
    subtotal += itemSubtotal

    items.push({
      id: typeof item.id === 'string' && item.id.length > 0 ? item.id : `${resolvedProductId}-item`,
      id_producto: resolvedProductId,
      cantidad: currentCantidad,
      precioUnitario,
      subtotal: itemSubtotal,
      producto: resumen,
    })
  }

  const totalBase = subtotal - (descuento ?? 0) + (impuesto ?? 0)
  const total = totalBase >= 0 ? totalBase : 0

  return {
    ...cart,
    items,
    subtotal,
    descuento,
    impuesto,
    total,
    updatedAt: new Date().toISOString(),
  }
}

const ensureCart = (cart: Carrito | null): Carrito => {
  if (cart) {
    return cart
  }
  return createEmptyCart()
}

const mapToDisplayItem = (item: CarritoItem, inventory: InventoryMap): CartItemDisplay => {
  const producto = inventory[item.id_producto] ?? (item.producto ? { ...item.producto } : undefined)
  const nombre = producto?.nombre ?? item.producto?.nombre
  const imagenes =
    producto && 'imagenes' in producto && Array.isArray(producto.imagenes)
      ? producto.imagenes
      : item.producto?.imagenes
  const principal = obtenerImagenPrincipal(imagenes)

  return {
    id: item.id,
    id_producto: item.id_producto,
    cantidad: item.cantidad,
    precioUnitario: item.precioUnitario,
    nombre: nombre ?? 'Producto',
    imagen: principal?.url ?? FALLBACK_IMAGE,
  }
}

export const useCartStore = defineStore('cart', {
  state: (): CartState => ({
    cart: null,
    loading: false,
    error: null,
    isDrawerOpen: false,
    inventory: {},
    inventoryLoading: false,
    inventoryError: null,
    inventoryLastFetched: null,
  }),
  getters: {
    items(state): CartItemDisplay[] {
      if (!state.cart) {
        return []
      }
      return state.cart.items.map((item) => mapToDisplayItem(item, this.inventory))
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
        const storedCart = loadCartFromStorage()
        const recalculated = recalcCartWithInventory(storedCart, this.inventory)
        this.cart = recalculated
        this.error = null
        persistCartInStorage(recalculated)
      } catch (error) {
        this.cart = createEmptyCart()
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
        if (isBrowserEnvironment()) {
          this.startInventoryPolling()
          await this.refreshInventory(true)
        }
      } catch (error) {
        if (!(error instanceof Error)) {
          this.error = 'No pudimos obtener tu carrito en este momento.'
        }
      } finally {
        this.loading = false
      }
    },
    async refreshInventory(force = false) {
      const now = Date.now()
      if (!force && this.inventoryLastFetched !== null) {
        const elapsed = now - this.inventoryLastFetched
        if (elapsed < MIN_REFRESH_INTERVAL_MS) {
          return
        }
      }

      const shouldStartRequest = !ongoingInventoryRequest
      if (shouldStartRequest) {
        this.inventoryLoading = true
        this.inventoryError = null
        ongoingInventoryRequest = fetchAllProducts({ admin: false, includeInactive: true })
      }

      try {
        const productos = await ongoingInventoryRequest!
        this.inventory = createProductLookup(productos)
        this.inventoryLastFetched = Date.now()
        this.inventoryError = null
        if (this.cart) {
          const recalculated = recalcCartWithInventory(this.cart, this.inventory)
          this.cart = recalculated
          persistCartInStorage(recalculated)
        }
      } catch (error) {
        if (error instanceof Error) {
          this.inventoryError = error.message
        } else {
          this.inventoryError = 'No fue posible actualizar el inventario.'
        }
        throw error
      } finally {
        if (shouldStartRequest) {
          ongoingInventoryRequest = null
          this.inventoryLoading = false
        }
      }
    },
    startInventoryPolling() {
      if (!isBrowserEnvironment()) {
        return
      }
      if (inventoryPoller) {
        return
      }
      this.refreshInventory(true).catch(() => undefined)
      inventoryPoller = window.setInterval(() => {
        this.refreshInventory(true).catch(() => undefined)
      }, STOCK_REFRESH_INTERVAL_MS)
    },
    stopInventoryPolling() {
      if (inventoryPoller) {
        clearInterval(inventoryPoller)
        inventoryPoller = undefined
      }
    },
    async ensureProductAvailability(productId: string, desiredQuantity: number) {
      await this.refreshInventory(true)

      const producto = this.inventory[productId]
      const fallbackId = this.cart?.items.find((item) => item.id_producto === productId)?.producto?.id
      const resolved = producto ?? (fallbackId ? this.inventory[fallbackId] : undefined)

      if (!resolved) {
        this.error = 'No pudimos localizar el producto en inventario.'
        throw new Error(this.error)
      }

      const stockDisponible = resolveAvailableStock(resolved)
      if (typeof stockDisponible === 'number' && desiredQuantity > stockDisponible) {
        this.error = `Solo hay ${stockDisponible} unidades disponibles de ${resolved.nombre}.`
        throw new Error(this.error)
      }

      return resolved
    },
    async addItem({ productoId, cantidad = 1 }: { productoId: string; cantidad?: number }) {
      if (!productoId) {
        throw new Error('Se requiere un identificador de producto para agregar al carrito.')
      }

      const sanitizedCantidad = Math.max(1, Math.floor(cantidad))
      this.loading = true
      this.error = null

      try {
        const cart = ensureCart(this.cart)
        const existingItem = cart.items.find((item) => item.id_producto === productoId)
        const currentCantidad = existingItem?.cantidad ?? 0
        const desiredCantidad = currentCantidad + sanitizedCantidad

        const producto = await this.ensureProductAvailability(productoId, desiredCantidad)
        const resumen = toCartProductoResumen(producto, productoId)
        const resolvedProductId = resolveProductId(producto, productoId)
        const precioUnitario =
          typeof producto.precio === 'number' && Number.isFinite(producto.precio)
            ? producto.precio
            : existingItem?.precioUnitario ?? resumen.precio ?? 0
        const updatedItems = existingItem
          ? cart.items.map((item) =>
              item.id_producto === productoId
                ? {
                    ...item,
                    id_producto: resolvedProductId,
                    cantidad: desiredCantidad,
                    precioUnitario,
                    subtotal: desiredCantidad * precioUnitario,
                    producto: resumen,
                  }
                : item,
            )
          : [
              ...cart.items,
              {
                id: `${resolvedProductId}-item`,
                id_producto: resolvedProductId,
                cantidad: desiredCantidad,
                precioUnitario,
                subtotal: desiredCantidad * precioUnitario,
                producto: resumen,
              },
            ]

        const updatedCart = recalcCartWithInventory(
          {
            ...cart,
            items: updatedItems,
          },
          this.inventory,
        )

        this.cart = updatedCart
        persistCartInStorage(updatedCart)
      } catch (error) {
        if (error instanceof Error) {
          this.error = error.message
        } else {
          this.error = 'No pudimos agregar el producto al carrito.'
        }
        throw error instanceof Error ? error : new Error(this.error)
      } finally {
        this.loading = false
      }
    },
    async updateItemQuantity(id_producto: string, cantidad: number) {
      if (!id_producto) {
        return
      }

      const sanitizedCantidad = Math.floor(cantidad)
      if (sanitizedCantidad <= 0) {
        await this.removeItem(id_producto)
        return
      }

      this.loading = true
      this.error = null

      try {
        const cart = ensureCart(this.cart)
        const existingItem = cart.items.find((item) => item.id_producto === id_producto)
        if (!existingItem) {
          this.error = 'No encontramos el producto en tu carrito.'
          throw new Error(this.error)
        }

        const producto = await this.ensureProductAvailability(id_producto, sanitizedCantidad)
        const resumen = toCartProductoResumen(producto, id_producto)
        const resolvedProductId = resolveProductId(producto, id_producto)
        const precioUnitario =
          typeof producto.precio === 'number' && Number.isFinite(producto.precio)
            ? producto.precio
            : existingItem.precioUnitario

        const updatedItems = cart.items.map((item) =>
          item.id_producto === id_producto
            ? {
                ...item,
                id_producto: resolvedProductId,
                cantidad: sanitizedCantidad,
                precioUnitario,
                subtotal: sanitizedCantidad * precioUnitario,
                producto: resumen,
              }
            : item,
        )

        const updatedCart = recalcCartWithInventory(
          {
            ...cart,
            items: updatedItems,
          },
          this.inventory,
        )

        this.cart = updatedCart
        persistCartInStorage(updatedCart)
      } catch (error) {
        if (error instanceof Error) {
          this.error = error.message
        } else {
          this.error = 'No fue posible actualizar la cantidad.'
        }
        throw error instanceof Error ? error : new Error(this.error)
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
      if (!current) {
        return
      }
      const nextCantidad = current.cantidad - 1
      await this.updateItemQuantity(id_producto, nextCantidad)
    },
    async removeItem(id_producto: string) {
      if (!id_producto) {
        return
      }

      this.loading = true
      this.error = null

      try {
        const cart = ensureCart(this.cart)
        const updatedItems = cart.items.filter((item) => item.id_producto !== id_producto)
        const updatedCart = recalcCartWithInventory(
          {
            ...cart,
            items: updatedItems,
          },
          this.inventory,
        )
        this.cart = updatedCart
        persistCartInStorage(updatedCart)
      } catch (error) {
        if (error instanceof Error) {
          this.error = error.message
        } else {
          this.error = 'No pudimos eliminar el producto del carrito.'
        }
        throw error instanceof Error ? error : new Error(this.error)
      } finally {
        this.loading = false
      }
    },
    async clearCart() {
      this.loading = true
      this.error = null

      try {
        clearCartFromStorage()
        const freshCart = createEmptyCart()
        const recalculated = recalcCartWithInventory(freshCart, this.inventory)
        this.cart = recalculated
        persistCartInStorage(recalculated)
      } catch (error) {
        if (error instanceof Error) {
          this.error = error.message
        } else {
          this.error = 'No fue posible vaciar el carrito.'
        }
        this.cart = createEmptyCart()
        throw error instanceof Error ? error : new Error(this.error)
      } finally {
        this.loading = false
      }
    },
  },
})
