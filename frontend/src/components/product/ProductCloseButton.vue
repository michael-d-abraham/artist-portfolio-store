<template>
  <ProductFloatingCircleButton
    v-if="isMobile"
    icon="close"
    size="lg"
    class="product-close-button"
    :class="mobileRootClass"
    :placement="mobilePlacement"
    :to="mobileTo"
    :aria-label="label"
    @click="onActivate"
  />
  <component
    v-else
    :is="rootTag"
    :to="rootTag === 'router-link' ? backTo : undefined"
    type="button"
    class="product-close-button"
    :class="rootClass"
    :aria-label="label"
    @click="onActivate"
  >
    <svg
      class="product-close-button__icon"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1.25 1.25l9.5 9.5M10.75 1.25l-9.5 9.5"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
      />
    </svg>
  </component>
</template>

<script setup>
import { computed } from 'vue';
import { useMediaQuery } from '../../composables/useMediaQuery.js';
import ProductFloatingCircleButton from './ProductFloatingCircleButton.vue';

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
  },
  placement: {
    type: String,
    default: 'inline',
    validator: (value) => ['inline', 'overlay', 'fullscreen'].includes(value)
  }
});

const emit = defineEmits(['close']);

const isMobile = useMediaQuery('(max-width: 640px)');

const rootTag = computed(() => {
  if (props.placement !== 'inline' || props.asButton) {
    return 'button';
  }
  return 'router-link';
});

const rootClass = computed(() => ({
  'product-close-button--flush': props.flush,
  [`product-close-button--${props.placement}`]: props.placement !== 'inline'
}));

const mobileRootClass = computed(() => ({
  'product-close-button--flush': props.flush,
  [`product-close-button--${props.placement}`]: props.placement !== 'inline'
}));

const mobilePlacement = computed(() => {
  if (props.placement === 'overlay') {
    return 'overlay-close';
  }
  if (props.placement === 'fullscreen') {
    return 'mobile-viewer-close';
  }
  return 'inline';
});

const mobileTo = computed(() => {
  if (props.placement !== 'inline' || props.asButton) {
    return '';
  }
  return props.backTo;
});

function onActivate(event) {
  if (!isMobile.value && rootTag.value === 'router-link') {
    return;
  }
  if (isMobile.value && mobileTo.value) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  emit('close');
}
</script>

<style scoped>
.product-close-button:not(.product-floating-circle-button) {
  --product-close-circle-size: clamp(2.25rem, 5vw, 2.75rem);
  --product-close-icon-size: calc(var(--product-close-circle-size) * 0.36);
  --product-close-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  --product-close-shadow-hover: 0 3px 12px rgba(0, 0, 0, 0.14);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--product-close-circle-size);
  height: var(--product-close-circle-size);
  min-width: var(--product-close-circle-size);
  min-height: var(--product-close-circle-size);
  margin: 0 0 var(--space-md);
  padding: 0;
  border: none;
  outline: none;
  border-radius: 50%;
  background: #fff;
  color: rgba(38, 38, 38, 0.82);
  box-shadow: var(--product-close-shadow);
  text-decoration: none;
  cursor: pointer;
  font-family: inherit;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition:
    box-shadow 0.15s ease,
    transform 0.15s ease,
    color 0.15s ease;
}

.product-close-button--flush {
  margin: 0;
}

.product-close-button:not(.product-floating-circle-button):hover {
  color: rgba(20, 20, 20, 0.92);
  box-shadow: var(--product-close-shadow-hover);
}

.product-close-button:not(.product-floating-circle-button):active {
  transform: scale(0.96);
}

.product-close-button:not(.product-floating-circle-button):focus,
.product-close-button:not(.product-floating-circle-button):focus-visible,
.product-close-button:not(.product-floating-circle-button):focus-within,
.product-close-button:not(.product-floating-circle-button):active:focus,
.product-close-button:not(.product-floating-circle-button):active:focus-visible {
  outline: none;
  box-shadow: var(--product-close-shadow);
}

.product-close-button:not(.product-floating-circle-button):hover:focus,
.product-close-button:not(.product-floating-circle-button):hover:focus-visible {
  box-shadow: var(--product-close-shadow-hover);
}

.product-close-button--overlay:not(.product-floating-circle-button) {
  --product-close-circle-size: clamp(2.625rem, 6.25vw, 3.125rem);
  --product-close-top-inset: clamp(10px, 2.5vw, 16px);
  --product-close-left-inset: clamp(12px, 3vw, 20px);

  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + var(--product-close-top-inset));
  left: calc(env(safe-area-inset-left, 0px) + var(--product-close-left-inset));
  right: auto;
  z-index: 1061;
}

@media (max-width: 640px) {
  .product-close-button--inline:not(.product-floating-circle-button) {
    --product-close-circle-size: clamp(2.625rem, 6.25vw, 3.125rem);
  }

  .product-close-button.product-floating-circle-button {
    margin: 0 0 var(--space-md);
  }

  .product-close-button.product-floating-circle-button--flush {
    margin: 0;
  }
}

.product-close-button--fullscreen:not(.product-floating-circle-button) {
  position: absolute;
  top: calc(env(safe-area-inset-top, 0px) + 12px);
  right: calc(env(safe-area-inset-right, 0px) + 12px);
  z-index: 3;
}

.product-close-button__icon {
  width: var(--product-close-icon-size);
  height: var(--product-close-icon-size);
  display: block;
  flex-shrink: 0;
  outline: none;
  pointer-events: none;
}

.product-close-button__icon path {
  vector-effect: non-scaling-stroke;
}
</style>
