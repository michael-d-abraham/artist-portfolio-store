<template>
  <div class="product-image-gallery" :class="{ 'product-image-gallery--contained-active': lightboxOpen && containedLightboxActive }">
    <div v-show="!(lightboxOpen && containedLightboxActive)" class="product-image-gallery__stage">
      <button
        v-if="canSwipe"
        type="button"
        class="product-image-gallery__nav product-image-gallery__nav--prev product-image-gallery__nav--inline"
        :disabled="!canGoPrev"
        aria-label="Previous image"
        @click.stop="goPrev"
      >
        <svg class="product-image-gallery__nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M15 6l-6 6 6 6"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
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
      <button
        v-if="canSwipe"
        type="button"
        class="product-image-gallery__nav product-image-gallery__nav--next product-image-gallery__nav--inline"
        :disabled="!canGoNext"
        aria-label="Next image"
        @click.stop="goNext"
      >
        <svg class="product-image-gallery__nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M9 6l6 6-6 6"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    <div
      v-if="showDots"
      v-show="!(lightboxOpen && containedLightboxActive)"
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

    <Teleport :to="teleportTarget">
      <Transition name="gallery-lightbox">
        <div
          v-if="lightboxOpen && currentImage"
          class="product-image-gallery__lightbox"
          :class="{ 'product-image-gallery__lightbox--contained': containedLightboxActive }"
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged product image"
          @click.self="closeLightbox"
        >
          <ProductCloseButton
            v-if="!containedLightboxActive"
            class="product-image-gallery__lightbox-close"
            flush
            label="Close enlarged image"
            as-button
            @close="closeLightbox"
          />
          <div
            ref="lightboxStageRef"
            class="product-image-gallery__lightbox-stage"
            @touchstart.passive="onTouchStart"
            @touchend.passive="onTouchEnd"
            @pointerdown="onPointerDown"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
          >
            <button
              v-if="canSwipe"
              type="button"
              class="product-image-gallery__nav product-image-gallery__nav--prev product-image-gallery__nav--lightbox"
              :disabled="!canGoPrev"
              aria-label="Previous image"
              @click.stop="goPrev"
            >
              <svg class="product-image-gallery__nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M15 6l-6 6 6 6"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
            <img
              class="product-image-gallery__lightbox-img"
              :src="currentImage.image_url"
              :alt="currentImage.alt_text || imageAlt"
            />
            <button
              v-if="canSwipe"
              type="button"
              class="product-image-gallery__nav product-image-gallery__nav--next product-image-gallery__nav--lightbox"
              :disabled="!canGoNext"
              aria-label="Next image"
              @click.stop="goNext"
            >
              <svg class="product-image-gallery__nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M9 6l6 6-6 6"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>
          <div
            v-if="showDots"
            class="product-image-gallery__dots product-image-gallery__dots--lightbox"
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
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import ProductCloseButton from './ProductCloseButton.vue';

const props = defineProps({
  images: {
    type: Array,
    default: () => []
  },
  imageAlt: {
    type: String,
    default: 'Product image'
  },
  containedLightbox: {
    type: Boolean,
    default: false
  },
  lightboxTarget: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['lightbox-change']);

const activeIndex = ref(0);
const lightboxOpen = ref(false);
const viewportRef = ref(null);
const lightboxStageRef = ref(null);
const CONTROL_SELECTOR =
  '.product-image-gallery__nav, .product-image-gallery__enlarge, .product-close-button, .product-image-gallery__dot';

const containedLightboxActive = computed(
  () => props.containedLightbox && Boolean(props.lightboxTarget)
);

const teleportTarget = computed(() => {
  if (containedLightboxActive.value) {
    return props.lightboxTarget;
  }
  return 'body';
});

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

function closeLightbox() {
  lightboxOpen.value = false;
}

defineExpose({ closeLightbox });

function onLightboxEscape(event) {
  if (!lightboxOpen.value || event.key !== 'Escape') {
    return;
  }
  event.stopImmediatePropagation();
  closeLightbox();
}

function syncLightboxEscapeListener(open) {
  if (open) {
    window.addEventListener('keydown', onLightboxEscape, true);
  } else {
    window.removeEventListener('keydown', onLightboxEscape, true);
  }
}

watch(lightboxOpen, (open) => {
  emit('lightbox-change', open);
  syncLightboxEscapeListener(open);
});

function getPointerSurface() {
  return lightboxOpen.value ? lightboxStageRef.value : viewportRef.value;
}

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
  getPointerSurface()?.setPointerCapture?.(event.pointerId);
}

function onPointerUp(event) {
  if (!canSwipe.value || event.pointerType === 'touch') return;
  if (!pointerSwipeActive) return;

  pointerSwipeActive = false;
  applySwipeDelta(event.clientX - swipeStartX);
  try {
    getPointerSurface()?.releasePointerCapture?.(event.pointerId);
  } catch {
    /* pointer may already be released */
  }
}

onUnmounted(() => {
  window.removeEventListener('keydown', onLightboxEscape, true);
});
</script>

<style scoped>
.product-image-gallery--contained-active {
  pointer-events: none;
}
.product-image-gallery {
  width: 100%;
  margin-bottom: var(--space-lg);
}

.product-image-gallery__stage {
  position: relative;
  width: 100%;
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

@media (max-width: 640px) {
  .product-image-gallery {
    margin-bottom: 0.75rem;
  }

  .product-image-gallery__stage {
    overflow: hidden;
  }

  .product-image-gallery__viewport {
    height: auto;
    aspect-ratio: 4 / 5;
    max-height: min(72vh, 480px);
    min-height: 300px;
  }

  .product-image-gallery__image {
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    object-position: center;
  }

  .product-image-gallery__dots {
    margin-top: 10px;
  }

  .product-image-gallery__nav--inline.product-image-gallery__nav--prev {
    left: 4px;
    right: auto;
    margin-right: 0;
  }

  .product-image-gallery__nav--inline.product-image-gallery__nav--next {
    right: 4px;
    left: auto;
    margin-left: 0;
  }
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
  padding: 0;
  border: none;
  background: rgba(180, 180, 180, 0.12);
  box-shadow: none;
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
  transition: background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.product-image-gallery__nav-icon {
  display: block;
  flex-shrink: 0;
}

.product-image-gallery__nav--inline {
  position: absolute;
  top: 50%;
  z-index: 10;
  width: 44px;
  height: 44px;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.48);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.28);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
}

.product-image-gallery__nav--inline.product-image-gallery__nav--prev {
  right: 100%;
  margin-right: 6px;
}

.product-image-gallery__nav--inline.product-image-gallery__nav--next {
  left: 100%;
  margin-left: 6px;
}

.product-image-gallery__nav:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.65);
  opacity: 1;
}

.product-image-gallery__nav--inline:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.65);
  border-color: rgba(255, 255, 255, 0.4);
}

.product-image-gallery__nav:disabled {
  opacity: 0.28;
  cursor: default;
}

.product-image-gallery__nav--inline:disabled {
  background: rgba(0, 0, 0, 0.2);
  color: rgba(255, 255, 255, 0.7);
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}

.product-image-gallery__lightbox--contained {
  position: absolute;
  inset: 0;
  z-index: 20;
  padding: 0;
  background: var(--color-product-image-bg, #f8f8f8);
  pointer-events: auto;
}

.product-image-gallery__lightbox-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 4;
}

.product-image-gallery__lightbox-close :deep(.product-close-button) {
  margin: 0;
}

.product-image-gallery__lightbox-stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  flex: 1;
  min-height: 0;
}

.product-image-gallery__lightbox--contained .product-image-gallery__lightbox-stage {
  cursor: grab;
  user-select: none;
}

.product-image-gallery__lightbox--contained .product-image-gallery__lightbox-stage:active {
  cursor: grabbing;
}

.product-image-gallery__dots--lightbox {
  flex-shrink: 0;
  margin-top: 0;
  padding: 12px 0 16px;
}

.product-image-gallery__lightbox:not(.product-image-gallery__lightbox--contained) .product-image-gallery__lightbox-stage {
  flex: 0 1 auto;
  width: 100%;
  height: 100%;
}

.product-image-gallery__lightbox:not(.product-image-gallery__lightbox--contained) .product-image-gallery__dots--lightbox {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  padding: 0;
}

.product-image-gallery__lightbox--contained .product-image-gallery__nav--lightbox.product-image-gallery__nav--prev {
  left: 16px;
}

.product-image-gallery__lightbox--contained .product-image-gallery__nav--lightbox.product-image-gallery__nav--next {
  right: 16px;
}

.product-image-gallery__nav--lightbox {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 48px;
  height: 48px;
  max-height: 48px;
  background: rgba(0, 0, 0, 0.48);
  color: #fff;
  border: 1px solid rgba(0, 0, 0, 0.12);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.product-image-gallery__nav--lightbox:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.65);
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
  width: auto;
  height: auto;
  object-fit: contain;
  object-position: center;
  pointer-events: none;
}

.gallery-lightbox-enter-active,
.gallery-lightbox-leave-active {
  transition: opacity 0.26s ease;
}

.gallery-lightbox-enter-active .product-image-gallery__lightbox-img,
.gallery-lightbox-leave-active .product-image-gallery__lightbox-img {
  transition: transform 0.3s ease, opacity 0.26s ease;
}

.gallery-lightbox-enter-from,
.gallery-lightbox-leave-to {
  opacity: 0;
}

.gallery-lightbox-enter-from .product-image-gallery__lightbox-img,
.gallery-lightbox-leave-to .product-image-gallery__lightbox-img {
  transform: scale(0.94);
  opacity: 0;
}
</style>
