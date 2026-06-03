<template>
  <button
    type="button"
    class="cart-icon-btn"
    aria-label="Open cart"
    :aria-expanded="drawerOpen"
    @click="toggleDrawer"
  >
    <BagIcon :count="itemCount" :size="40" />
  </button>
</template>

<script setup>
import BagIcon from './BagIcon.vue';
import { useCart } from '../../composables/useCart.js';

const { itemCount, drawerOpen, toggleDrawer } = useCart();
</script>

<style scoped>
.cart-icon-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem;
  border: none;
  background: transparent;
  box-shadow: none;
  color: var(--color-text);
  cursor: pointer;
}

.cart-icon-btn:hover {
  color: var(--color-text-muted);
  background: rgba(0, 0, 0, 0.04);
}

.cart-icon-btn:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
  border-radius: var(--radius-sm);
}

@media (max-width: 640px) {
  .cart-icon-btn {
    min-width: 44px;
    min-height: 44px;
    padding: 0.5rem;
  }
}
</style>
