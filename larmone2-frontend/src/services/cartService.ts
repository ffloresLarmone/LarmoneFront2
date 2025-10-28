import type { Carrito, CarritoItem, CarritoProductoResumen } from '../types/api'

const CART_STORAGE_KEY = 'larmone_cart_v1'

const isBrowserEnvironment = () => typeof window !== 'undefined' && !!window.localStorage

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `cart-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
}

const generateItemId = (productId: string) => `${productId || 'item'}-${Math.random().toString(36).slice(2, 8)}`

const sanitizeCartProducto = (raw: unknown): CarritoProductoResumen | undefined => {
  if (!raw || typeof raw !== 'object') {
    return undefined
  }

  const producto = raw as Partial<CarritoProductoResumen>
  const id = typeof producto.id === 'string' ? producto.id : undefined
  const nombre = typeof producto.nombre === 'string' ? producto.nombre : 'Producto'
  const slug = typeof producto.slug === 'string' ? producto.slug : id ?? nombre
  const precio = typeof producto.precio === 'number' && Number.isFinite(producto.precio)
    ? producto.precio
    : 0

  return {
    id: id ?? slug,
    sku: typeof producto.sku === 'string' ? producto.sku : undefined,
    nombre,
    slug,
    precio,
    marca: typeof producto.marca === 'string' ? producto.marca : producto.marca ?? null,
    activo: producto.activo ?? true,
    destacado: producto.destacado ?? false,
    imagenes: Array.isArray(producto.imagenes) ? producto.imagenes : undefined,
  }
}

const sanitizeCartItem = (raw: unknown): CarritoItem | null => {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const item = raw as Partial<CarritoItem>
  const rawCantidad = typeof item.cantidad === 'number' ? item.cantidad : Number(item.cantidad)
  if (!Number.isFinite(rawCantidad) || rawCantidad <= 0) {
    return null
  }

  const productoId =
    typeof item.id_producto === 'string'
      ? item.id_producto
      : typeof item.producto?.id === 'string'
        ? item.producto.id
        : undefined

  if (!productoId) {
    return null
  }

  const producto = sanitizeCartProducto(item.producto)
  const cantidad = Math.floor(rawCantidad)
  const precioUnitario =
    typeof item.precioUnitario === 'number' && Number.isFinite(item.precioUnitario)
      ? item.precioUnitario
      : producto?.precio ?? 0
  const subtotal =
    typeof item.subtotal === 'number' && Number.isFinite(item.subtotal)
      ? item.subtotal
      : cantidad * precioUnitario

  return {
    id: typeof item.id === 'string' && item.id.length > 0 ? item.id : generateItemId(productoId),
    id_producto: producto?.id ?? productoId,
    cantidad,
    precioUnitario,
    subtotal,
    producto,
  }
}

const sanitizeCart = (raw: unknown): Carrito => {
  const emptyCart = createEmptyCart()

  if (!raw || typeof raw !== 'object') {
    return emptyCart
  }

  const cart = raw as Partial<Carrito>
  const items = Array.isArray(cart.items)
    ? cart.items
        .map((item) => sanitizeCartItem(item))
        .filter((item): item is CarritoItem => item !== null)
    : []

  const subtotal = items.reduce((total, item) => total + item.subtotal, 0)
  const total =
    typeof cart.total === 'number' && Number.isFinite(cart.total) ? cart.total : subtotal
  const descuento =
    typeof cart.descuento === 'number' && Number.isFinite(cart.descuento)
      ? cart.descuento
      : undefined
  const impuesto =
    typeof cart.impuesto === 'number' && Number.isFinite(cart.impuesto)
      ? cart.impuesto
      : undefined

  return {
    id: typeof cart.id === 'string' && cart.id.length > 0 ? cart.id : emptyCart.id,
    usuarioId: typeof cart.usuarioId === 'string' ? cart.usuarioId : undefined,
    items,
    subtotal,
    descuento,
    impuesto,
    total,
    updatedAt: typeof cart.updatedAt === 'string' ? cart.updatedAt : new Date().toISOString(),
  }
}

export const createEmptyCart = (): Carrito => ({
  id: generateId(),
  items: [],
  subtotal: 0,
  total: 0,
  updatedAt: new Date().toISOString(),
})

export const loadCartFromStorage = (): Carrito => {
  if (!isBrowserEnvironment()) {
    return createEmptyCart()
  }

  const stored = window.localStorage.getItem(CART_STORAGE_KEY)
  if (!stored) {
    return createEmptyCart()
  }

  try {
    const parsed = JSON.parse(stored)
    return sanitizeCart(parsed)
  } catch (error) {
    console.warn('No se pudo interpretar el carrito almacenado. Se creará uno nuevo.', error)
    return createEmptyCart()
  }
}

export const persistCartInStorage = (cart: Carrito): void => {
  if (!isBrowserEnvironment()) {
    return
  }

  const payload = JSON.stringify(cart)
  window.localStorage.setItem(CART_STORAGE_KEY, payload)
}

export const clearCartFromStorage = (): void => {
  if (!isBrowserEnvironment()) {
    return
  }
  window.localStorage.removeItem(CART_STORAGE_KEY)
}

export type { Carrito, CarritoItem } from '../types/api'
