<template>
  <component
    :is="rootTag"
    :to="rootTag === 'router-link' ? to : undefined"
    type="button"
    class="product-floating-circle-button"
    :class="rootClass"
    :disabled="rootTag === 'button' ? disabled : undefined"
    :aria-label="ariaLabel"
    @click="onClick"
  >
    <svg
      v-if="icon"
      class="product-floating-circle-button__icon"
      :viewBox="iconViewBox"
      fill="none"
      aria-hidden="true"
    >
      <path
        v-for="(path, index) in iconPaths"
        :key="index"
        :d="path.d"
        stroke="currentColor"
        :stroke-width="path.strokeWidth"
        :stroke-linecap="path.strokeLinecap"
        :stroke-linejoin="path.strokeLinejoin"
      />
    </svg>
    <slot v-else />
  </component>
</template>

<script setup>
import { computed } from 'vue';
import {
  PRODUCT_CIRCLE_ICON_PATHS,
  PRODUCT_CIRCLE_ICON_VIEWBOX
} from './productCircleIcons.js';

const props = defineProps({
  ariaLabel: {
    type: String,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
  icon: {
    type: String,
    default: '',
    validator: (value) => (
      !value || ['close', 'prev', 'next', 'expand'].includes(value)
    )
  },
  placement: {
    type: String,
    default: '',
    validator: (value) => (
      !value
      || [
        'inline',
        'overlay-close',
        'fixed-top-left',
        'overlay-prev',
        'overlay-next',
        'lightbox-prev',
        'lightbox-next',
        'mobile-viewer-close',
        'stage-enlarge'
      ].includes(value)
    )
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => value === 'md' || value === 'lg'
  },
  to: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['click']);

const rootTag = computed(() => (props.to ? 'router-link' : 'button'));

const rootClass = computed(() => {
  const classes = [];
  if (props.placement) {
    classes.push(`product-floating-circle-button--${props.placement}`);
  }
  if (props.size === 'lg') {
    classes.push('product-floating-circle-button--lg');
  }
  return classes;
});

const iconViewBox = computed(() => (
  props.icon ? PRODUCT_CIRCLE_ICON_VIEWBOX[props.icon] : ''
));

const iconPaths = computed(() => (
  props.icon ? PRODUCT_CIRCLE_ICON_PATHS[props.icon] : []
));

function onClick(event) {
  emit('click', event);
}
</script>

<style scoped>
.product-floating-circle-button {
  --product-circle-size: 36px;
  --product-circle-icon-size: 14px;
  --product-circle-shadow:
    0 1px 4px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(0, 0, 0, 0.05);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--product-circle-size);
  height: var(--product-circle-size);
  min-width: var(--product-circle-size);
  min-height: var(--product-circle-size);
  margin: 0;
  padding: 0;
  border: none;
  outline: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: rgba(0, 0, 0, 0.7);
  box-shadow: var(--product-circle-shadow);
  text-decoration: none;
  cursor: pointer;
  font-family: inherit;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease, opacity 0.15s ease;
}

.product-floating-circle-button--lg {
  --product-circle-size: 48px;
  --product-circle-icon-size: 17px;
  --product-close-circle-size: 48px;
  min-width: 44px;
  min-height: 44px;
}

.product-floating-circle-button__icon {
  width: var(--product-circle-icon-size);
  height: var(--product-circle-icon-size);
  display: block;
  flex-shrink: 0;
  pointer-events: none;
}

.product-floating-circle-button__icon path {
  vector-effect: non-scaling-stroke;
}

.product-floating-circle-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.94);
  color: rgba(0, 0, 0, 0.85);
}

.product-floating-circle-button:focus,
.product-floating-circle-button:focus-visible,
.product-floating-circle-button:focus-within,
.product-floating-circle-button:active:focus,
.product-floating-circle-button:active:focus-visible {
  outline: none;
  box-shadow: var(--product-circle-shadow);
}

.product-floating-circle-button:hover:focus,
.product-floating-circle-button:hover:focus-visible {
  box-shadow: var(--product-circle-shadow);
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

.product-floating-circle-button--fixed-top-left,
.product-floating-circle-button--overlay-close {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + clamp(10px, 2.5vw, 16px));
  left: calc(env(safe-area-inset-left, 0px) + clamp(12px, 3vw, 20px));
  z-index: 1061;
}

.product-floating-circle-button--fixed-top-left {
  top: calc(env(safe-area-inset-top, 0px) + 8px);
  left: calc(env(safe-area-inset-left, 0px) + 12px);
}

.product-floating-circle-button--fixed-top-left:active:not(:disabled),
.product-floating-circle-button--overlay-close:active:not(:disabled) {
  transform: scale(0.94);
}

.product-floating-circle-button--mobile-viewer-close {
  position: absolute;
  top: calc(env(safe-area-inset-top, 0px) + 12px);
  right: calc(env(safe-area-inset-right, 0px) + 12px);
  z-index: 3;
}

.product-floating-circle-button--mobile-viewer-close:active:not(:disabled) {
  transform: scale(0.94);
}

.product-floating-circle-button--inline:active:not(:disabled) {
  transform: scale(0.94);
}

.product-floating-circle-button--stage-enlarge {
  position: absolute;
  right: 0;
  bottom: 0;
  z-index: 10;
}

.product-floating-circle-button--stage-enlarge:active:not(:disabled) {
  transform: scale(0.94);
}

@media (max-width: 640px) {
  .product-floating-circle-button--stage-enlarge {
    right: 6px;
    bottom: 6px;
  }
}
</style>
