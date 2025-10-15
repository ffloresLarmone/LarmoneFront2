<script setup lang="ts">
import HeroBanner from '../components/organisms/HeroBanner.vue'
import FeaturedProductsSection from '../components/organisms/FeaturedProductsSection.vue'
import OffersSpotlight from '../components/organisms/OffersSpotlight.vue'
import { useToast } from '../composables/useToast'
import { useCartStore } from '../stores/cart'
import type { ProductSummary } from '../composables/useFeaturedProducts'

const { showToast } = useToast()
const cartStore = useCartStore()

const handleCta = () => {
  showToast({
    title: 'Descubre tu ritual',
    message: 'Personaliza tu rutina de belleza con recomendaciones a tu medida.',
    variant: 'info',
  })
}

const hashFromId = (id: string): number => {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

const handleAddToCart = async (product: ProductSummary) => {
  try {
    await cartStore.addItem({
      id_variante: hashFromId(product.id),
      cantidad: 1,
      precio_unitario: product.price,
      nombre: product.name,
      imagen: product.image,
    })

    if (cartStore.error) {
      showToast({
        title: 'Carrito sincronizado parcialmente',
        message: cartStore.error,
        variant: 'warning',
      })
    } else {
      showToast({
        title: 'Añadido a tu bolsa',
        message: `${product.name} está listo para completar tu look.`,
        variant: 'success',
      })
    }

    cartStore.openDrawer()
  } catch (error) {
    showToast({
      title: 'No pudimos agregarlo',
      message:
        cartStore.error ??
        (error instanceof Error
          ? error.message
          : 'No pudimos actualizar tu carrito, vuelve a intentarlo en unos segundos.'),
      variant: 'danger',
    })
  }
}

const handleExplore = () => {
  showToast({
    title: 'Te avisaremos',
    message: 'Te notificaremos tan pronto tengamos nuevos esenciales para ti.',
    variant: 'primary',
  })
}
</script>

<template>
  <main class="flex-grow-1">
    <HeroBanner @cta="handleCta" />
    <FeaturedProductsSection @add-to-cart="handleAddToCart" @explore="handleExplore" />
    <OffersSpotlight />
  </main>
</template>
