<template>
  <button
    type="button"
    class="product-floating-circle-button"
    :class="placementClass"
    :disabled="disabled"
    :aria-label="ariaLabel"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  ariaLabel: {
    type: String,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
  placement: {
    type: String,
    default: '',
    validator: (value) => (
      !value
      || [
        'fixed-top-left',
        'overlay-prev',
        'overlay-next',
        'lightbox-prev',
        'lightbox-next'
      ].includes(value)
    )
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => value === 'md' || value === 'lg'
  }
});

defineEmits(['click']);

const placementClass = computed(() => {
  const classes = [];
  if (props.placement) {
    classes.push(`product-floating-circle-button--${props.placement}`);
  }
  if (props.size === 'lg') {
    classes.push('product-floating-circle-button--lg');
  }
  return classes;
});
</script>

<style scoped>
.product-floating-circle-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  min-width: 36px;
  min-height: 36px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: rgba(0, 0, 0, 0.7);
  box-shadow:
    0 1px 4px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  font-family: inherit;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease, opacity 0.15s ease;
}

.product-floating-circle-button--lg {
  width: 48px;
  height: 48px;
  min-width: 44px;
  min-height: 44px;
}

.product-floating-circle-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.94);
  color: rgba(0, 0, 0, 0.85);
}

.product-floating-circle-button:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.product-floating-circle-button:disabled {
  opacity: 0.32;
  background: rgba(255, 255, 255, 0.55);
  color: rgba(0, 0, 0, 0.3);
  cursor: default;
}

.product-floating-circle-button--overlay-prev,
.product-floating-circle-button--overlay-next,
.product-floating-circle-button--lightbox-prev,
.product-floating-circle-button--lightbox-next {
  position: absolute;
  top: 50%;
  z-index: 10;
  transform: translateY(-50%);
}

.product-floating-circle-button--overlay-prev:active:not(:disabled),
.product-floating-circle-button--overlay-next:active:not(:disabled),
.product-floating-circle-button--lightbox-prev:active:not(:disabled),
.product-floating-circle-button--lightbox-next:active:not(:disabled) {
  transform: translateY(-50%) scale(0.94);
}

.product-floating-circle-button--overlay-prev,
.product-floating-circle-button--lightbox-prev {
  left: 10px;
}

.product-floating-circle-button--overlay-next,
.product-floating-circle-button--lightbox-next {
  right: 10px;
}

.product-floating-circle-button--fixed-top-left {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + 8px);
  left: calc(env(safe-area-inset-left, 0px) + 12px);
  z-index: 1061;
}

.product-floating-circle-button--fixed-top-left:active:not(:disabled) {
  transform: scale(0.94);
}
</style>
