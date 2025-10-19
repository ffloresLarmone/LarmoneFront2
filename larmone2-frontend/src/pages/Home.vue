<script setup lang="ts">
import HeroBanner from '../components/organisms/HeroBanner.vue'
import FeaturedProductsSection from '../components/organisms/FeaturedProductsSection.vue'
import OffersSpotlight from '../components/organisms/OffersSpotlight.vue'
import { useToast } from '../composables/useToast'
import type { ProductSummary } from '../composables/useFeaturedProducts'

const { showToast } = useToast()

const handleCta = () => {
  showToast({
    title: 'Descubre tu ritual',
    message: 'Personaliza tu rutina de belleza con recomendaciones a tu medida.',
    variant: 'info',
  })
}

const handleAddToCart = (product: ProductSummary) => {
  showToast({
    title: 'Explora el catálogo',
    message: `Encuentra ${product.name} en el catálogo oficial para añadirlo con stock real.`,
    variant: 'info',
  })
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
