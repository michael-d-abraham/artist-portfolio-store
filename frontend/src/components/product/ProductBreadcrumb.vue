<template>
  <router-link :to="backTo" class="product-breadcrumb">
    <svg class="product-breadcrumb__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <span>{{ label }}</span>
  </router-link>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    default: 'Back to Gallery'
  },
  backTo: {
    type: String,
    default: '/'
  }
});
</script>

<style scoped>
.product-breadcrumb {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-text);
  text-decoration: none;
  font-size: 0.9375rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  margin: 0 0 var(--space-md);
  min-height: 44px;
}

.product-breadcrumb:hover {
  opacity: 0.55;
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

.product-breadcrumb__icon {
  flex-shrink: 0;
}
</style>
