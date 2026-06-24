<template>
  <li class="cart-item">
    <img
      class="cart-item__thumb"
      :src="item.imageUrl"
      :alt="item.name"
      width="100"
      height="100"
      loading="lazy"
    >
    <div class="cart-item__body">
      <div class="cart-item__top">
        <div class="cart-item__meta">
          <h3 class="cart-item__name">{{ item.name }}</h3>
          <p class="cart-item__price">{{ unitPrice }}</p>
          <p v-if="item.optionLabel" class="cart-item__option">{{ item.optionLabel }}</p>
        </div>
        <button
          type="button"
          class="cart-item__remove"
          aria-label="Remove item"
          @click="$emit('remove')"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V7h14z"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </button>
      </div>
      <div class="cart-item__bottom">
        <QuantityStepper
          :model-value="item.quantity"
          aria-label="Item quantity"
          @increment="$emit('increment')"
          @decrement="$emit('decrement')"
          @update:model-value="$emit('update:quantity', $event)"
        />
        <p class="cart-item__line-total">{{ lineTotal }}</p>
      </div>
    </div>
  </li>
</template>

<script setup>
import { computed } from 'vue';
import QuantityStepper from './QuantityStepper.vue';
import { formatMoneyFromCents } from '../../utils/money.js';

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  lineTotalCents: {
    type: Number,
    required: true
  }
});

defineEmits(['remove', 'increment', 'decrement', 'update:quantity']);

const unitPrice = computed(() => formatMoneyFromCents(props.item.priceCents, 'usd'));
const lineTotal = computed(() => formatMoneyFromCents(props.lineTotalCents, 'usd'));
</script>

<style scoped>
.cart-item {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--color-border);
  list-style: none;
}

.cart-item__thumb {
  width: 88px;
  height: 88px;
  flex-shrink: 0;
  object-fit: contain;
  object-position: center;
  background: var(--color-product-image-bg);
  border: none;
}

.cart-item__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--space-sm);
}

.cart-item__top {
  display: flex;
  gap: var(--space-sm);
  align-items: flex-start;
}

.cart-item__meta {
  flex: 1;
  min-width: 0;
}

.cart-item__name {
  margin: 0 0 0.2rem;
  font-family: var(--font-sans);
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: 0.02em;
  color: var(--color-text);
}

.cart-item__price {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--color-text-muted);
}

.cart-item__option {
  margin: 0.25rem 0 0;
  font-size: 0.9375rem;
  color: var(--color-text-muted);
}

.cart-item__remove {
  flex-shrink: 0;
  padding: 0.25rem;
  border: none;
  background: transparent;
  box-shadow: none;
  color: var(--color-text-muted);
  line-height: 0;
}

.cart-item__remove:hover {
  color: var(--color-text);
  background: rgba(0, 0, 0, 0.04);
}

.cart-item__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
}

.cart-item__line-total {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  letter-spacing: 0.04em;
}
</style>
