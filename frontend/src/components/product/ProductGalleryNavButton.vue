<template>
  <ProductFloatingCircleButton
    :placement="`${context}-${direction}`"
    :icon="direction"
    size="md"
    :aria-label="direction === 'prev' ? 'Previous image' : 'Next image'"
    :disabled="disabled"
    @click="$emit('click', $event)"
  />
</template>

<script setup>
import ProductFloatingCircleButton from './ProductFloatingCircleButton.vue';

defineProps({
  direction: {
    type: String,
    required: true,
    validator: (value) => value === 'prev' || value === 'next'
  },
  context: {
    type: String,
    required: true,
    validator: (value) => value === 'overlay' || value === 'lightbox'
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

defineEmits(['click']);
</script>
