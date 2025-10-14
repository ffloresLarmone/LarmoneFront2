import { computed, onMounted, ref, type ComputedRef, type Ref } from 'vue'

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

const mockProducts: ProductSummary[] = [
  {
    id: 'lipstick-rose',
    name: 'Labial Rosa Aurora',
    description: 'Acabado satinado con ácido hialurónico para labios hidratados todo el día.',
    price: 19.99,
    image:
      'https://images.unsplash.com/photo-1612810806695-30ba14fb733c?auto=format&fit=crop&w=400&q=80',
    tags: ['Best seller', 'Vegano'],
  },
  {
    id: 'serum-glow',
    name: 'Suero Glow Vitamina C',
    description: 'Fórmula iluminadora con antioxidantes que unifican el tono de la piel.',
    price: 34.5,
    image:
      'https://images.unsplash.com/photo-1619946794135-5bc917a27793?auto=format&fit=crop&w=400&q=80',
    tags: ['Nuevo', 'Libre de parabenos'],
  },
  {
    id: 'palette-midnight',
    name: 'Paleta Midnight Muse',
    description: '12 tonos intensos inspirados en el atardecer. Incluye espejo panorámico.',
    price: 42.0,
    image:
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=400&q=80',
    tags: ['Edición limitada'],
  },
]

export const useFeaturedProducts = (): UseFeaturedProducts => {
  const products = ref<ProductSummary[]>([])
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  const loadProducts = async () => {
    loading.value = true
    error.value = null

    try {
      await new Promise((resolve) => {
        globalThis.setTimeout(resolve, 600)
      })

      products.value = [...mockProducts]
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
