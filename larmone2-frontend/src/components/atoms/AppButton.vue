<script setup lang="ts">
import { computed } from 'vue'

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline-primary'
  | 'outline-light'
  | 'light'
  | 'link'

type ButtonSize = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    label?: string
    variant?: ButtonVariant
    size?: ButtonSize
    type?: 'button' | 'submit' | 'reset'
    block?: boolean
    disabled?: boolean
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
    block: false,
    disabled: false,
  },
)

const emit = defineEmits<{ (event: 'click', value: MouseEvent): void }>()

const sizeClass = computed(() => {
  if (props.size === 'lg') return 'btn-lg'
  if (props.size === 'sm') return 'btn-sm'
  return ''
})

const variantClass = computed(() => {
  if (props.variant === 'primary') return 'btn-brand'
  if (props.variant === 'secondary') return 'btn-secondary'
  return `btn-${props.variant}`
})

const blockClass = computed(() => (props.block ? 'w-100' : ''))

const handleClick = (event: MouseEvent) => {
  if (props.disabled) return
  emit('click', event)
}
</script>

<template>
  <button
    :type="props.type"
    class="btn fw-semibold"
    :class="[variantClass, sizeClass, blockClass]"
    :disabled="props.disabled"
    @click="handleClick"
  >
    <slot>{{ props.label }}</slot>
  </button>
</template>
