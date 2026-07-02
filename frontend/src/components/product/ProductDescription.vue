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
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.product-description__text {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.65;
  font-size: 0.875rem;
  font-weight: 300;
  color: var(--color-text);
}
</style>
