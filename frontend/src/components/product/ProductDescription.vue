<template>
  <div v-if="text" class="product-description">
    <p class="product-description__text">{{ text }}</p>
  </div>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    default: ''
  }
});
</script>

<style scoped>
.product-description {
  margin-top: var(--space-xl);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--color-border);
}

.product-description__text {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.7;
  font-size: 1rem;
  font-weight: 400;
  color: var(--color-text);
}
</style>
