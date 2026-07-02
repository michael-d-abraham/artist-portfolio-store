<template>
  <component
    :is="asButton ? 'button' : 'router-link'"
    :to="asButton ? undefined : backTo"
    type="button"
    class="product-close-button"
    :class="{ 'product-close-button--flush': flush }"
    :aria-label="label"
    @click="onActivate"
  >
    <span class="product-close-button__icon" aria-hidden="true">×</span>
  </component>
</template>

<script setup>
const props = defineProps({
  label: {
    type: String,
    default: 'Close and return to gallery'
  },
  backTo: {
    type: String,
    default: '/gallery'
  },
  asButton: {
    type: Boolean,
    default: false
  },
  flush: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

function onActivate(event) {
  if (!props.asButton) {
    return;
  }
  event.preventDefault();
  emit('close');
}
</script>

<style scoped>
.product-close-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  margin: 0 0 var(--space-md);
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  text-decoration: none;
  cursor: pointer;
  font-family: inherit;
  border-radius: 4px;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.product-close-button--flush {
  margin: 0;
}

.product-close-button:hover {
  color: var(--color-text);
  background: rgba(0, 0, 0, 0.05);
  opacity: 1;
  text-decoration: none;
}

.product-close-button:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.product-close-button__icon {
  font-size: 1.75rem;
  line-height: 1;
  font-weight: 300;
}
</style>
