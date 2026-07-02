<template>
  <Teleport to="body">
    <Transition name="product-overlay">
      <div
        v-if="open"
        ref="panelRef"
        class="product-detail-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Product details"
      >
        <div class="product-detail-overlay__scroll" @click="onBackdropClick">
          <ProductDetail
            ref="productDetailRef"
            :slug="slug"
            :initial-product="initialProduct"
            overlay
            @close="emit('close')"
            @lightbox-change="galleryLightboxOpen = $event"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, onUnmounted, nextTick } from 'vue';
import ProductDetail from '../../pages/ProductDetail.vue';
import { useMediaQuery } from '../../composables/useMediaQuery.js';

const isDesktop = useMediaQuery('(min-width: 641px)');

const props = defineProps({
  slug: {
    type: String,
    required: true
  },
  initialProduct: {
    type: Object,
    default: null
  },
  open: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['close']);

const panelRef = ref(null);
const productDetailRef = ref(null);
const galleryLightboxOpen = ref(false);
let previousFocus = null;

function onBackdropClick(event) {
  if (!isDesktop.value || event.target !== event.currentTarget) {
    return;
  }
  if (galleryLightboxOpen.value) {
    productDetailRef.value?.closeImageLightbox();
    return;
  }
  emit('close');
}

function onEscape(event) {
  if (event.key !== 'Escape') {
    return;
  }
  if (galleryLightboxOpen.value) {
    productDetailRef.value?.closeImageLightbox();
    return;
  }
  emit('close');
}

function lockBodyScroll(locked) {
  document.body.style.overflow = locked ? 'hidden' : '';
  document.body.classList.toggle('gallery-product-open', locked);
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      previousFocus = document.activeElement;
      lockBodyScroll(true);
      window.addEventListener('keydown', onEscape);
      await nextTick();
      if (!galleryLightboxOpen.value) {
        const backControl = panelRef.value?.querySelector(
          '.product-floating-circle-button--fixed-top-left, .product-close-button'
        );
        backControl?.focus();
      }
    } else {
      galleryLightboxOpen.value = false;
      lockBodyScroll(false);
      window.removeEventListener('keydown', onEscape);
      if (previousFocus && typeof previousFocus.focus === 'function') {
        previousFocus.focus();
      }
      previousFocus = null;
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  lockBodyScroll(false);
  window.removeEventListener('keydown', onEscape);
  if (previousFocus && typeof previousFocus.focus === 'function') {
    previousFocus.focus();
  }
});
</script>

<style scoped>
.product-detail-overlay {
  position: fixed;
  inset: 0;
  z-index: 1050;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

.product-detail-overlay__scroll {
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: none;
}

@media (max-width: 640px) {
  .product-detail-overlay {
    padding-top: env(safe-area-inset-top, 0px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
    box-sizing: border-box;
  }
}

@media (min-width: 641px) {
  .product-detail-overlay {
    background: #f4f4f4;
  }

  .product-detail-overlay__scroll {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100%;
    padding: 48px;
    box-sizing: border-box;
    cursor: default;
  }
}

.product-overlay-enter-active,
.product-overlay-leave-active {
  transition: opacity 0.2s ease;
}

.product-overlay-enter-from,
.product-overlay-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .product-detail-overlay {
    will-change: opacity, transform;
  }

  .product-overlay-enter-active,
  .product-overlay-leave-active {
    transition: opacity 0.1s ease, transform 0.1s ease;
  }

  .product-overlay-enter-from,
  .product-overlay-leave-to {
    opacity: 0;
    transform: translate3d(0, 12px, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .product-overlay-enter-active,
  .product-overlay-leave-active {
    transition: opacity 0.01ms linear;
  }

  .product-overlay-enter-from,
  .product-overlay-leave-to {
    transform: none;
  }
}
</style>
