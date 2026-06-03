<template>
  <div class="qty-stepper" role="group" :aria-label="ariaLabel">
    <button
      type="button"
      class="qty-btn"
      :disabled="modelValue <= min"
      aria-label="Decrease quantity"
      @click="$emit('decrement')"
    >
      −
    </button>
    <input
      class="qty-input"
      type="number"
      :min="min"
      :max="max"
      :value="modelValue"
      aria-label="Quantity"
      @change="onInput"
    >
    <button
      type="button"
      class="qty-btn"
      :disabled="modelValue >= max"
      aria-label="Increase quantity"
      @click="$emit('increment')"
    >
      +
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
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
  },
  ariaLabel: {
    type: String,
    default: 'Quantity'
  }
});

const emit = defineEmits(['update:modelValue', 'increment', 'decrement']);

function onInput(event) {
  const raw = Number(event.target.value);
  let next = Number.isFinite(raw) ? Math.round(raw) : props.min;
  next = Math.max(props.min, Math.min(props.max, next));
  emit('update:modelValue', next);
}
</script>

<style scoped>
.qty-stepper {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  overflow: hidden;
}

.qty-btn {
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  font-size: 1.125rem;
  line-height: 1;
  color: var(--color-text);
}

.qty-btn:hover:not(:disabled) {
  background: var(--color-text);
  color: var(--color-surface);
  opacity: 1;
}

.qty-btn:disabled {
  opacity: 0.4;
}

.qty-input {
  width: 2.25rem;
  padding: 0.35rem 0.15rem;
  border: none;
  border-left: 1px solid var(--color-border);
  border-right: 1px solid var(--color-border);
  border-radius: 0;
  text-align: center;
  font-size: 1rem;
  box-shadow: none;
  -moz-appearance: textfield;
}

.qty-input::-webkit-outer-spin-button,
.qty-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.qty-input:focus-visible {
  box-shadow: var(--focus-ring);
}

@media (max-width: 640px) {
  .qty-btn {
    width: 2.75rem;
    height: 2.75rem;
    min-width: 44px;
    min-height: 44px;
  }

  .qty-input {
    width: 2.75rem;
    min-height: 44px;
    font-size: 1.0625rem;
  }
}
</style>
