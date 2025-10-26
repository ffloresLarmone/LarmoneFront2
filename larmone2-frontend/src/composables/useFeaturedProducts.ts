import { computed, onMounted, ref, type ComputedRef, type Ref } from 'vue'
import { fetchProducts } from '../services/productService'
import { FALLBACK_IMAGE, mapearProductosConImagenes } from '../services/imageService'
import type { Producto } from '../types/api'

export interface ProductSummary {
  id: string
  name: string
  description: string
  price: number
  image: string
  tags: string[]
}

interface UseFeaturedProducts {
  products: Ref<ProductSummary[]>
  loading: Ref<boolean>
  error: Ref<string | null>
  hasProducts: ComputedRef<boolean>
  reload: () => Promise<void>
}

export const useFeaturedProducts = (): UseFeaturedProducts => {
  const products = ref<ProductSummary[]>([])
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  const loadProducts = async () => {
    loading.value = true
    error.value = null
    products.value = []

    try {
      const response = await fetchProducts({
        page: 1,
        pageSize: 6,
        soloActivos: true,
        orden: 'recientes',
      })

      const enriched = await mapearProductosConImagenes(response.items)

      products.value = enriched.map((producto) => mapToSummary(producto))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'No pudimos cargar los productos destacados.'
      products.value = []
    } finally {
      loading.value = false
    }
  }

  onMounted(async () => {
    await loadProducts()
  })

  const hasProducts = computed(() => products.value.length > 0)

  return {
    products,
    loading,
    error,
    hasProducts,
    reload: loadProducts,
  }
}

function mapToSummary(producto: Producto & { _thumb?: string }): ProductSummary {
  const tags: string[] = []

  if (producto.destacado) {
    tags.push('Destacado')
  }

  if (producto.marca) {
    tags.push(producto.marca)
  } else if (typeof producto.marcaId === 'number') {
    tags.push(`Marca #${producto.marcaId}`)
  }

  if (producto.categorias?.length) {
    const categoria = producto.categorias[0]?.categoria?.nombre
    if (categoria) {
      tags.push(categoria)
    }
  }

  return {
    id: producto.id,
    name: producto.nombre,
    description:
      producto.descripcionCorta ??
      producto.descripcionLarga ??
      producto.descripcion ??
      'Muy pronto conocerás todos los detalles de este producto en nuestro catálogo.',
    price: producto.precio ?? 0,
    image: producto._thumb ?? FALLBACK_IMAGE,
    tags: tags.slice(0, 3),
  }
}
