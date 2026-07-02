<template>
  <div
    class="mobile-fullscreen-viewer"
    role="dialog"
    aria-modal="true"
    aria-label="Enlarged product image"
    @click="onBackdropClick"
  >
    <ProductCloseButton
      placement="fullscreen"
      label="Close enlarged image"
      as-button
      @close="$emit('close')"
    />

    <ProductGalleryNavButton
      v-if="canSwipe"
      direction="prev"
      context="lightbox"
      :disabled="!canGoPrev || isSliding"
      @click.stop="$emit('prev')"
    />
    <ProductGalleryNavButton
      v-if="canSwipe"
      direction="next"
      context="lightbox"
      :disabled="!canGoNext || isSliding"
      @click.stop="$emit('next')"
    />

    <div
      ref="viewportRef"
      class="mobile-fullscreen-viewer__viewport"
      :class="{ 'mobile-fullscreen-viewer__viewport--swipeable': canSwipe && !isSliding }"
      @touchstart.passive="onTouchStart"
      @touchend.passive="onTouchEnd"
    >
      <Transition
        :name="slideTransitionName"
        @before-leave="onSlideStart"
        @after-enter="onSlideEnd"
      >
        <img
          :key="activeIndex"
          class="mobile-fullscreen-viewer__image mobile-fullscreen-viewer__slide-image"
          :src="currentImage.image_url"
          :alt="currentImage.alt_text || imageAlt"
        />
      </Transition>
    </div>

    <div
      v-if="showDots"
      class="mobile-fullscreen-viewer__dots"
      role="tablist"
      :aria-label="`${images.length} product images`"
    >
      <button
        v-for="(img, index) in images"
        :key="img._id || img.image_url || index"
        type="button"
        class="mobile-fullscreen-viewer__dot"
        :class="{ 'mobile-fullscreen-viewer__dot--active': index === activeIndex }"
        role="tab"
        :aria-selected="index === activeIndex"
        :aria-label="`Image ${index + 1} of ${images.length}`"
        @click.stop="$emit('go-to-index', index)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import ProductCloseButton from './ProductCloseButton.vue';
import ProductGalleryNavButton from './ProductGalleryNavButton.vue';

const props = defineProps({
  images: {
    type: Array,
    required: true
  },
  activeIndex: {
    type: Number,
    required: true
  },
  imageAlt: {
    type: String,
    default: 'Product image'
  },
  slideTransitionName: {
    type: String,
    required: true
  },
  isSliding: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'prev', 'next', 'go-to-index', 'slide-start', 'slide-end']);

const viewportRef = ref(null);

const CONTROL_SELECTOR =
  '.product-close-button, .product-floating-circle-button, .mobile-fullscreen-viewer__dot';

let swipeStartX = 0;
let touchSwipeActive = false;

const canSwipe = computed(() => props.images.length > 1);
const showDots = computed(() => props.images.length > 1);
const canGoPrev = computed(() => props.activeIndex > 0);
const canGoNext = computed(() => props.activeIndex < props.images.length - 1);
const currentImage = computed(() => props.images[props.activeIndex] || null);

function isControlTarget(target) {
  return target instanceof Element && Boolean(target.closest(CONTROL_SELECTOR));
}

function onSlideStart() {
  emit('slide-start');
}

function onSlideEnd() {
  emit('slide-end');
}

function onBackdropClick(event) {
  if (event.target.closest('.mobile-fullscreen-viewer__image')) {
    return;
  }
  if (isControlTarget(event.target)) {
    return;
  }
  emit('close');
}

function applySwipeDelta(delta) {
  if (!canSwipe.value || props.isSliding || Math.abs(delta) < 40) return;
  if (delta < 0) {
    emit('next');
  } else {
    emit('prev');
  }
}

function onTouchStart(event) {
  if (!canSwipe.value || isControlTarget(event.target)) return;
  touchSwipeActive = true;
  swipeStartX = event.touches[0]?.clientX ?? 0;
}

function onTouchEnd(event) {
  if (!canSwipe.value || !touchSwipeActive) return;
  touchSwipeActive = false;
  const endX = event.changedTouches[0]?.clientX ?? 0;
  applySwipeDelta(endX - swipeStartX);
}
</script>

<style scoped>
.mobile-fullscreen-viewer {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(0, 0, 0, 0.52);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  box-sizing: border-box;
  --mobile-viewer-top: calc(env(safe-area-inset-top, 0px) + var(--product-close-circle-size, clamp(2.25rem, 5vw, 2.75rem)) + 12px);
  --mobile-viewer-bottom: calc(env(safe-area-inset-bottom, 0px) + 36px);
  --mobile-viewer-inset-left: max(12px, env(safe-area-inset-left, 0px));
  --mobile-viewer-inset-right: max(12px, env(safe-area-inset-right, 0px));
}

.mobile-fullscreen-viewer :deep(.product-floating-circle-button--lightbox-prev) {
  left: max(8px, env(safe-area-inset-left, 0px));
  z-index: 3;
}

.mobile-fullscreen-viewer :deep(.product-floating-circle-button--lightbox-next) {
  right: max(8px, env(safe-area-inset-right, 0px));
  z-index: 3;
}

.mobile-fullscreen-viewer__viewport {
  position: absolute;
  top: var(--mobile-viewer-top);
  left: var(--mobile-viewer-inset-left);
  right: var(--mobile-viewer-inset-right);
  bottom: var(--mobile-viewer-bottom);
  overflow: hidden;
  touch-action: pan-y pinch-zoom;
}

.mobile-fullscreen-viewer__viewport--swipeable {
  cursor: grab;
  user-select: none;
}

.mobile-fullscreen-viewer__viewport--swipeable:active {
  cursor: grabbing;
}

.mobile-fullscreen-viewer__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  object-position: center;
  border-radius: 3px;
  display: block;
  pointer-events: none;
}

.mobile-fullscreen-viewer__slide-image {
  display: block;
}

.mobile-fullscreen-viewer__dots {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 12px);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  z-index: 3;
  pointer-events: auto;
}

.mobile-fullscreen-viewer__dot {
  width: 7px;
  height: 7px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 50%;
  background: transparent;
  box-shadow: none;
  cursor: pointer;
}

.mobile-fullscreen-viewer__dot--active {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(255, 255, 255, 0.9);
}

.gallery-slide-next-enter-active,
.gallery-slide-next-leave-active,
.gallery-slide-prev-enter-active,
.gallery-slide-prev-leave-active {
  transition:
    transform var(--gallery-slide-duration, 0.26s) cubic-bezier(0.4, 0, 0.2, 1),
    opacity var(--gallery-slide-duration, 0.26s) cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  object-position: center;
  border-radius: 3px;
  pointer-events: none;
  will-change: transform, opacity;
  z-index: 1;
}

.gallery-slide-next-leave-active,
.gallery-slide-prev-leave-active {
  z-index: 0;
}

.gallery-slide-next-enter-from {
  transform: translate3d(18%, 0, 0);
  opacity: 0;
}

.gallery-slide-next-leave-to {
  transform: translate3d(-18%, 0, 0);
  opacity: 0;
}

.gallery-slide-prev-enter-from {
  transform: translate3d(-18%, 0, 0);
  opacity: 0;
}

.gallery-slide-prev-leave-to {
  transform: translate3d(18%, 0, 0);
  opacity: 0;
}

.gallery-slide-next-enter-to,
.gallery-slide-next-leave-from,
.gallery-slide-prev-enter-to,
.gallery-slide-prev-leave-from {
  transform: translate3d(0, 0, 0);
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .gallery-slide-next-enter-active,
  .gallery-slide-next-leave-active,
  .gallery-slide-prev-enter-active,
  .gallery-slide-prev-leave-active {
    --gallery-slide-duration: 0.01ms;
    transition: opacity 0.01ms linear;
    transform: none !important;
  }

  .gallery-slide-next-enter-from,
  .gallery-slide-next-leave-to,
  .gallery-slide-prev-enter-from,
  .gallery-slide-prev-leave-to {
    transform: none;
    opacity: 0;
  }
}
</style>
