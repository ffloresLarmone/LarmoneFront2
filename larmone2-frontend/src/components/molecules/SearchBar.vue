<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    placeholder?: string
  }>(),
  {
    placeholder: 'Buscar productos...'
  },
)

const emit = defineEmits<{ (event: 'search', value: string): void }>()

const query = ref('')

const handleSubmit = () => {
  emit('search', query.value.trim())
}
</script>

<template>
  <form class="d-flex" role="search" @submit.prevent="handleSubmit">
    <div class="input-group">
      <span class="input-group-text bg-white border-end-0"><i class="bi bi-search text-muted" /></span>
      <input
        v-model="query"
        :placeholder="props.placeholder"
        class="form-control border-start-0"
        type="search"
        aria-label="Buscar"
      />
    </div>
  </form>
</template>
