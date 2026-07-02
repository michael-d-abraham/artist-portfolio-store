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
  margin-bottom: 0;
}

.product-info__title {
  margin: 0 0 4px;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--color-text);
  letter-spacing: 0.03em;
}

.product-info__price {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 500;
  line-height: 1.3;
  color: var(--color-text-muted);
}
</style>
