<template>
  <div class="product-info">
    <h1 class="product-info__title">{{ title }}</h1>
    <p v-if="price != null" class="product-info__price">{{ price }}</p>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  price: {
    type: String,
    default: null
  }
});
</script>

<style scoped>
.product-info {
  margin-bottom: var(--space-lg);
}

.product-info__title {
  margin: 0 0 10px;
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.35;
  color: var(--color-text);
  letter-spacing: 0.02em;
}

.product-info__price {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.3;
  color: #444;
}
</style>
