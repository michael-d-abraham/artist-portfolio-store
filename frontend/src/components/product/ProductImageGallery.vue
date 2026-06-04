<template>
  <div class="product-image-gallery">
    <div
      ref="viewportRef"
      class="product-image-gallery__viewport"
      :class="{ 'product-image-gallery__viewport--swipeable': canSwipe }"
      @touchstart.passive="onTouchStart"
      @touchend.passive="onTouchEnd"
      @pointerdown="onPointerDown"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <img
        v-if="currentImage"
        class="product-image-gallery__image"
        :src="currentImage.image_url"
        :alt="currentImage.alt_text || imageAlt"
      />
      <p v-else class="product-image-gallery__empty">No image</p>

      <button
        v-if="canSwipe"
        type="button"
        class="product-image-gallery__nav product-image-gallery__nav--prev"
        :disabled="!canGoPrev"
        aria-label="Previous image"
        @click.stop="goPrev"
      >
        ‹
      </button>
      <button
        v-if="canSwipe"
        type="button"
        class="product-image-gallery__nav product-image-gallery__nav--next"
        :disabled="!canGoNext"
        aria-label="Next image"
        @click.stop="goNext"
      >
        ›
      </button>

      <button
        v-if="currentImage && images.length"
        type="button"
        class="product-image-gallery__enlarge"
        aria-label="View larger image"
        @click="lightboxOpen = true"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M9 3H5a2 2 0 0 0-2 2v4M15 3h4a2 2 0 0 1 2 2v4M9 21H5a2 2 0 0 1-2-2v-4M15 21h4a2 2 0 0 0 2-2v-4"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>

    <div
      v-if="showDots"
      class="product-image-gallery__dots"
      role="tablist"
      :aria-label="`${images.length} product images`"
    >
      <button
        v-for="(img, index) in images"
        :key="img._id || img.image_url || index"
        type="button"
        class="product-image-gallery__dot"
        :class="{ 'product-image-gallery__dot--active': index === activeIndex }"
        role="tab"
        :aria-selected="index === activeIndex"
        :aria-label="`Image ${index + 1} of ${images.length}`"
        @click="activeIndex = index"
      />
    </div>

    <Teleport to="body">
      <div
        v-if="lightboxOpen && currentImage"
        class="product-image-gallery__lightbox"
        role="dialog"
        aria-modal="true"
        aria-label="Enlarged product image"
        @click.self="lightboxOpen = false"
      >
        <button type="button" class="product-image-gallery__lightbox-close" aria-label="Close" @click="lightboxOpen = false">
          ×
        </button>
        <button
          v-if="canSwipe"
          type="button"
          class="product-image-gallery__nav product-image-gallery__nav--prev product-image-gallery__nav--lightbox"
          :disabled="!canGoPrev"
          aria-label="Previous image"
          @click.stop="goPrev"
        >
          ‹
        </button>
        <button
          v-if="canSwipe"
          type="button"
          class="product-image-gallery__nav product-image-gallery__nav--next product-image-gallery__nav--lightbox"
          :disabled="!canGoNext"
          aria-label="Next image"
          @click.stop="goNext"
        >
          ›
        </button>
        <img
          class="product-image-gallery__lightbox-img"
          :src="currentImage.image_url"
          :alt="currentImage.alt_text || imageAlt"
        />
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  images: {
    type: Array,
    default: () => []
  },
  imageAlt: {
    type: String,
    default: 'Product image'
  }
});

const activeIndex = ref(0);
const lightboxOpen = ref(false);
const viewportRef = ref(null);
const CONTROL_SELECTOR =
  '.product-image-gallery__nav, .product-image-gallery__enlarge, .product-image-gallery__lightbox-close';

let swipeStartX = 0;
let pointerSwipeActive = false;
let touchSwipeActive = false;

function isControlTarget(target) {
  return target instanceof Element && Boolean(target.closest(CONTROL_SELECTOR));
}

const canSwipe = computed(() => props.images.length > 1);
const showDots = computed(() => props.images.length > 1);
const canGoPrev = computed(() => activeIndex.value > 0);
const canGoNext = computed(() => activeIndex.value < props.images.length - 1);
const currentImage = computed(() => props.images[activeIndex.value] || null);

watch(
  () => props.images,
  () => {
    activeIndex.value = 0;
    lightboxOpen.value = false;
  }
);

function goNext() {
  if (activeIndex.value < props.images.length - 1) {
    activeIndex.value += 1;
  }
}

function goPrev() {
  if (activeIndex.value > 0) {
    activeIndex.value -= 1;
  }
}

function applySwipeDelta(delta) {
  if (!canSwipe.value || Math.abs(delta) < 40) return;
  if (delta < 0) {
    goNext();
  } else {
    goPrev();
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

function onPointerDown(event) {
  if (!canSwipe.value || event.pointerType === 'touch') return;
  if (event.button !== 0) return;
  if (isControlTarget(event.target)) return;

  pointerSwipeActive = true;
  swipeStartX = event.clientX;
  viewportRef.value?.setPointerCapture?.(event.pointerId);
}

function onPointerUp(event) {
  if (!canSwipe.value || event.pointerType === 'touch') return;
  if (!pointerSwipeActive) return;

  pointerSwipeActive = false;
  applySwipeDelta(event.clientX - swipeStartX);
  try {
    viewportRef.value?.releasePointerCapture?.(event.pointerId);
  } catch {
    /* pointer may already be released */
  }
}
</script>

<style scoped>
.product-image-gallery {
  width: 100%;
  margin-bottom: var(--space-lg);
}

.product-image-gallery__viewport {
  position: relative;
  width: 100%;
  height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-product-image-bg);
  touch-action: pan-y pinch-zoom;
}

.product-image-gallery__viewport--swipeable {
  cursor: grab;
  user-select: none;
}

.product-image-gallery__viewport--swipeable:active {
  cursor: grabbing;
}

@media (min-width: 641px) {
  .product-image-gallery__viewport {
    height: min(52vh, 480px);
  }
}

.product-image-gallery__image {
  position: relative;
  z-index: 1;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  object-position: center;
  display: block;
  pointer-events: none;
}

.product-image-gallery__empty {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.product-image-gallery__nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 48px;
  height: 100%;
  max-height: 120px;
  padding: 0;
  border: none;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: none;
  color: var(--color-text);
  font-size: 2.25rem;
  line-height: 1;
  font-weight: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
}

.product-image-gallery__nav--prev {
  left: 0;
}

.product-image-gallery__nav--next {
  right: 0;
}

.product-image-gallery__nav:hover:not(:disabled) {
  opacity: 0.55;
  background: transparent;
}

.product-image-gallery__nav:disabled {
  opacity: 0.2;
  cursor: default;
}

.product-image-gallery__enlarge {
  position: absolute;
  right: 0;
  bottom: 0;
  z-index: 10;
  pointer-events: auto;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.product-image-gallery__enlarge:hover {
  opacity: 0.55;
  background: transparent;
}

.product-image-gallery__dots {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
}

.product-image-gallery__dot {
  width: 8px;
  height: 8px;
  padding: 0;
  border: 1px solid var(--color-text);
  border-radius: 50%;
  background: transparent;
  box-shadow: none;
  cursor: pointer;
}

.product-image-gallery__dot--active {
  background: var(--color-text);
}

.product-image-gallery__lightbox {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(255, 255, 255, 0.96);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.product-image-gallery__lightbox-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  font-size: 2rem;
  line-height: 1;
  color: var(--color-text);
  box-shadow: none;
}

.product-image-gallery__nav--lightbox {
  color: var(--color-text);
}

.product-image-gallery__nav--lightbox.product-image-gallery__nav--prev {
  left: 8px;
}

.product-image-gallery__nav--lightbox.product-image-gallery__nav--next {
  right: 8px;
}

.product-image-gallery__lightbox-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  object-position: center;
}
</style>
