<template>
  <div v-if="sizeLabel" class="size-dropdown">
    <label class="size-dropdown__label" :for="inputId">Size</label>
    <select :id="inputId" class="size-dropdown__select" :value="sizeLabel" disabled>
      <option :value="sizeLabel">{{ sizeLabel }}</option>
    </select>
  </div>
</template>

<script setup>
import { useId } from 'vue';

defineProps({
  sizeLabel: {
    type: String,
    default: ''
  }
});

const inputId = useId();
</script>

<style scoped>
.size-dropdown {
  margin-bottom: var(--space-lg);
}

.size-dropdown__label {
  display: block;
  margin-bottom: var(--space-sm);
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text);
}

.size-dropdown__select {
  width: 100%;
  min-height: 44px;
  padding: 0.65rem 0.6rem;
  appearance: none;
  background: var(--color-surface);
  color: var(--color-text);
}
</style>
