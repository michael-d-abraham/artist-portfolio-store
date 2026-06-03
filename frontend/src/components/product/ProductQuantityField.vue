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

defineProps({
  modelValue: {
    type: Number,
    required: true
  },
  min: {
    type: Number,
    default: 1
  },
  max: {
    type: Number,
    default: 99
  }
});

defineEmits(['update:modelValue', 'increment', 'decrement']);
</script>

<style scoped>
.product-quantity {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.product-quantity__label {
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text);
}

.product-quantity__required {
  color: var(--color-text);
}
</style>
