<template>
  <ProductFloatingCircleButton
    :placement="`${context}-${direction}`"
    :aria-label="direction === 'prev' ? 'Previous image' : 'Next image'"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <svg
      class="product-gallery-nav-button__icon"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        v-if="direction === 'prev'"
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        v-else
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </ProductFloatingCircleButton>
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

<style scoped>
.product-gallery-nav-button__icon {
  display: block;
  flex-shrink: 0;
}
</style>
