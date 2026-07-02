<template>
  <div class="product-quantity">
    <span class="product-quantity__label">Quantity <span class="product-quantity__required" aria-hidden="true">*</span></span>
    <QuantityStepper
      :model-value="modelValue"
      :min="min"
      :max="max"
      aria-label="Product quantity"
      @increment="$emit('increment')"
      @decrement="$emit('decrement')"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </div>
</template>

<script setup>
import QuantityStepper from '../cart/QuantityStepper.vue';
import { CART_QUANTITY_MIN, CART_QUANTITY_MAX } from '@shared/cartQuantity.js';

defineProps({
  modelValue: {
    type: Number,
    required: true
  },
  min: {
    type: Number,
    default: CART_QUANTITY_MIN
  },
  max: {
    type: Number,
    default: CART_QUANTITY_MAX
  }
});

defineEmits(['update:modelValue', 'increment', 'decrement']);
</script>

<style scoped>
.product-quantity {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
  margin-bottom: 0;
}

.product-quantity__label {
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.product-quantity__required {
  color: var(--color-text);
}
</style>
