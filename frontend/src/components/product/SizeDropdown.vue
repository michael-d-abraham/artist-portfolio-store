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
  margin-bottom: 0;
}

.size-dropdown__label {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.size-dropdown__select {
  width: 100%;
  min-height: 40px;
  padding: 0.5rem 0.6rem;
  font-size: 0.875rem;
  appearance: none;
  background: var(--color-surface);
  color: var(--color-text);
}
</style>
