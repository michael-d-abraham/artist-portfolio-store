<template>
  <footer class="cart-footer">
    <div class="cart-footer__divider" />
    <div class="cart-footer__row">
      <span class="cart-footer__label">Estimated total</span>
      <span class="cart-footer__total">${{ totalFormatted }}</span>
    </div>
    <router-link to="/checkout" class="btn-primary cart-footer__cta" @click="$emit('checkout')">
      Checkout
    </router-link>
  </footer>
</template>

<script setup>
defineProps({
  totalFormatted: {
    type: String,
    required: true
  }
});

defineEmits(['checkout']);
</script>

<style scoped>
.cart-footer {
  flex-shrink: 0;
  padding: var(--space-lg);
  padding-top: var(--space-md);
  background: var(--color-surface);
}

.cart-footer__divider {
  height: 1px;
  background: var(--color-border);
  margin-bottom: var(--space-md);
}

.cart-footer__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.cart-footer__label {
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.cart-footer__total {
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--color-text);
  letter-spacing: 0.04em;
}

.cart-footer__cta {
  display: block;
  width: 100%;
  padding: 0.85rem 1rem;
  font-size: 0.9375rem;
  letter-spacing: 0.1em;
  text-align: center;
  text-decoration: none;
  box-sizing: border-box;
}

@media (max-width: 640px) {
  .cart-footer {
    position: sticky;
    bottom: 0;
    z-index: 1;
    padding-bottom: max(var(--space-lg), env(safe-area-inset-bottom, 0px));
    background: var(--color-surface);
    border-top: 1px solid var(--color-border);
  }

  .cart-footer__cta {
    min-height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
  }
}
</style>
