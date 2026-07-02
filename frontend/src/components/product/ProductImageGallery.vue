<template>
  <div class="product-image-gallery" :class="{ 'product-image-gallery--contained-active': lightboxOpen && containedLightboxActive }">
    <div v-show="!(lightboxOpen && containedLightboxActive)" class="product-image-gallery__stage">
      <ProductGalleryNavButton
        v-if="canSwipe"
        direction="prev"
        context="overlay"
        :disabled="!canGoPrev || isSliding"
        @click.stop="goPrev"
      />
      <div
        ref="viewportRef"
        class="product-image-gallery__viewport"
        :class="{ 'product-image-gallery__viewport--swipeable': canSwipe && !isSliding }"
        @touchstart.passive="onTouchStart"
        @touchend.passive="onTouchEnd"
        @pointerdown="onPointerDown"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div v-if="currentImage" class="product-image-gallery__image-frame">
          <Transition
            :name="slideTransitionName"
            @before-leave="onSlideStart"
            @after-enter="onSlideEnd"
          >
            <img
              :key="activeIndex"
              class="product-image-gallery__image product-image-gallery__slide-image"
              :src="currentImage.image_url"
              :alt="currentImage.alt_text || imageAlt"
              :loading="priority ? 'eager' : 'lazy'"
              :fetchpriority="priority ? 'high' : 'auto'"
            />
          </Transition>
        </div>
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
      <ProductGalleryNavButton
        v-if="canSwipe"
        direction="next"
        context="overlay"
        :disabled="!canGoNext || isSliding"
        @click.stop="goNext"
      />
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
        @click="goToIndex(index)"
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
          @click="onLightboxBackdropClick"
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
            @touchstart.passive="onContainedLightboxTouchStart"
            @touchend.passive="onContainedLightboxTouchEnd"
            @pointerdown="onContainedLightboxPointerDown"
            @pointerup="onContainedLightboxPointerUp"
            @pointercancel="onContainedLightboxPointerUp"
          >
            <template v-if="containedLightboxActive">
              <ProductGalleryNavButton
                v-if="canSwipe"
                direction="prev"
                context="lightbox"
                :disabled="!canGoPrev || isSliding"
                @click.stop="goPrev"
              />
              <div class="product-image-gallery__lightbox-image-frame product-image-gallery__lightbox-image-frame--contained">
                <Transition
                  :name="slideTransitionName"
                  @before-leave="onSlideStart"
                  @after-enter="onSlideEnd"
                >
                  <img
                    :key="activeIndex"
                    class="product-image-gallery__lightbox-img product-image-gallery__slide-image"
                    :src="currentImage.image_url"
                    :alt="currentImage.alt_text || imageAlt"
                  />
                </Transition>
              </div>
              <ProductGalleryNavButton
                v-if="canSwipe"
                direction="next"
                context="lightbox"
                :disabled="!canGoNext || isSliding"
                @click.stop="goNext"
              />
            </template>
            <div
              v-else
              ref="lightboxViewportRef"
              class="product-image-gallery__lightbox-viewport"
              :class="{ 'product-image-gallery__lightbox-viewport--swipeable': canSwipe && !isSliding }"
              @touchstart.passive="onTouchStart"
              @touchend.passive="onTouchEnd"
              @pointerdown="onPointerDown"
              @pointerup="onPointerUp"
              @pointercancel="onPointerUp"
            >
              <ProductGalleryNavButton
                v-if="canSwipe"
                direction="prev"
                context="lightbox"
                :disabled="!canGoPrev || isSliding"
                @click.stop="goPrev"
              />
              <div class="product-image-gallery__lightbox-image-frame">
                <Transition
                  :name="slideTransitionName"
                  @before-leave="onSlideStart"
                  @after-enter="onSlideEnd"
                >
                  <img
                    :key="activeIndex"
                    class="product-image-gallery__lightbox-img product-image-gallery__slide-image"
                    :src="currentImage.image_url"
                    :alt="currentImage.alt_text || imageAlt"
                  />
                </Transition>
              </div>
              <ProductGalleryNavButton
                v-if="canSwipe"
                direction="next"
                context="lightbox"
                :disabled="!canGoNext || isSliding"
                @click.stop="goNext"
              />
            </div>
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
              @click="goToIndex(index)"
            />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import { useMediaQuery } from '../../composables/useMediaQuery.js';
import ProductCloseButton from './ProductCloseButton.vue';
import ProductGalleryNavButton from './ProductGalleryNavButton.vue';

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
  },
  priority: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['lightbox-change']);

const isMobile = useMediaQuery('(max-width: 640px)');
const activeIndex = ref(0);
const slideDirection = ref('next');
const isSliding = ref(false);
const lightboxOpen = ref(false);
const viewportRef = ref(null);
const lightboxStageRef = ref(null);
const lightboxViewportRef = ref(null);
const CONTROL_SELECTOR =
  '.product-floating-circle-button, .product-image-gallery__enlarge, .product-close-button, .product-image-gallery__dot';

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
let slideUnlockTimer = null;

const SLIDE_DURATION_MS = 260;

const slideTransitionName = computed(() => `gallery-slide-${slideDirection.value}`);

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
    isSliding.value = false;
    clearSlideUnlockTimer();
  }
);

function clearSlideUnlockTimer() {
  if (slideUnlockTimer != null) {
    clearTimeout(slideUnlockTimer);
    slideUnlockTimer = null;
  }
}

function onSlideStart() {
  isSliding.value = true;
  clearSlideUnlockTimer();
  slideUnlockTimer = setTimeout(() => {
    isSliding.value = false;
    slideUnlockTimer = null;
  }, SLIDE_DURATION_MS + 80);
}

function onSlideEnd() {
  clearSlideUnlockTimer();
  isSliding.value = false;
}

function setActiveIndex(index) {
  if (index === activeIndex.value || isSliding.value) {
    return;
  }
  if (index < 0 || index >= props.images.length) {
    return;
  }
  slideDirection.value = index > activeIndex.value ? 'next' : 'prev';
  activeIndex.value = index;
}

function goToIndex(index) {
  setActiveIndex(index);
}

function closeLightbox() {
  lightboxOpen.value = false;
}

function onLightboxBackdropClick(event) {
  if (containedLightboxActive.value) {
    if (event.target === event.currentTarget) {
      closeLightbox();
    }
    return;
  }
  if (!isMobile.value) {
    if (event.target === event.currentTarget) {
      closeLightbox();
    }
    return;
  }
  if (!lightboxOpen.value) {
    return;
  }
  if (event.target.closest('.product-image-gallery__lightbox-img')) {
    return;
  }
  if (isControlTarget(event.target)) {
    return;
  }
  closeLightbox();
}

function onContainedLightboxTouchStart(event) {
  if (!containedLightboxActive.value) return;
  onTouchStart(event);
}

function onContainedLightboxTouchEnd(event) {
  if (!containedLightboxActive.value) return;
  onTouchEnd(event);
}

function onContainedLightboxPointerDown(event) {
  if (!containedLightboxActive.value) return;
  onPointerDown(event);
}

function onContainedLightboxPointerUp(event) {
  if (!containedLightboxActive.value) return;
  onPointerUp(event);
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
  if (!lightboxOpen.value) {
    return viewportRef.value;
  }
  if (containedLightboxActive.value) {
    return lightboxStageRef.value;
  }
  return lightboxViewportRef.value ?? lightboxStageRef.value;
}

function goNext() {
  setActiveIndex(activeIndex.value + 1);
}

function goPrev() {
  setActiveIndex(activeIndex.value - 1);
}

function applySwipeDelta(delta) {
  if (!canSwipe.value || isSliding.value || Math.abs(delta) < 40) return;
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
  clearSlideUnlockTimer();
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
  overflow: hidden;
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
    --gallery-mobile-viewport-height: min(50svh, 380px);
  }

  .product-image-gallery__stage {
    overflow: visible;
    min-height: var(--gallery-mobile-viewport-height);
  }

  .product-image-gallery__viewport {
    height: var(--gallery-mobile-viewport-height);
    min-height: var(--gallery-mobile-viewport-height);
    max-height: var(--gallery-mobile-viewport-height);
    flex-shrink: 0;
    padding: 0;
    overflow: hidden;
    box-sizing: border-box;
  }

  .product-image-gallery__image-frame {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .product-image-gallery__dots {
    margin-top: 10px;
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

.product-image-gallery__image-frame {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 0;
}

@media (max-width: 640px) {
  .product-image-gallery__image {
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    object-position: center;
  }
}

.product-image-gallery__empty {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
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

.product-image-gallery__lightbox-img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  object-position: center;
  pointer-events: none;
}

.product-image-gallery__slide-image {
  display: block;
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

.product-image-gallery__lightbox-image-frame--contained {
  flex: 1;
  min-width: 0;
  min-height: 0;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-image-gallery__lightbox--contained .product-image-gallery__lightbox-image-frame--contained .product-image-gallery__slide-image {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
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
@media (max-width: 640px) {
  .product-image-gallery__lightbox:not(.product-image-gallery__lightbox--contained) {
    --gallery-mobile-lightbox-viewport-height: min(50svh, 380px);
    background: #fff;
    justify-content: center;
    padding:
      calc(env(safe-area-inset-top, 0px) + 52px)
      max(16px, env(safe-area-inset-right, 0px))
      calc(env(safe-area-inset-bottom, 0px) + 16px)
      max(16px, env(safe-area-inset-left, 0px));
  }

  .product-image-gallery__lightbox:not(.product-image-gallery__lightbox--contained) .product-image-gallery__lightbox-close {
    top: calc(env(safe-area-inset-top, 0px) + 12px);
    right: calc(env(safe-area-inset-right, 0px) + 12px);
  }

  .product-image-gallery__lightbox:not(.product-image-gallery__lightbox--contained) .product-image-gallery__lightbox-stage {
    flex: 1;
    width: 100%;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: default;
  }

  .product-image-gallery__lightbox-viewport {
    position: relative;
    width: 100%;
    max-width: 100%;
    height: var(--gallery-mobile-lightbox-viewport-height);
    min-height: var(--gallery-mobile-lightbox-viewport-height);
    max-height: var(--gallery-mobile-lightbox-viewport-height);
    flex-shrink: 0;
    background: var(--color-product-image-bg);
    overflow: hidden;
    box-sizing: border-box;
    touch-action: pan-y pinch-zoom;
  }

  .product-image-gallery__lightbox-viewport--swipeable {
    cursor: grab;
    user-select: none;
  }

  .product-image-gallery__lightbox-viewport--swipeable:active {
    cursor: grabbing;
  }

  .product-image-gallery__lightbox-image-frame {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .product-image-gallery__lightbox:not(.product-image-gallery__lightbox--contained) .product-image-gallery__lightbox-img {
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    object-position: center;
    pointer-events: none;
  }

  .product-image-gallery__lightbox:not(.product-image-gallery__lightbox--contained) .product-image-gallery__dots--lightbox {
    position: static;
    flex-shrink: 0;
    margin-top: 14px;
    padding: 0;
  }

  .gallery-lightbox-enter-from,
  .gallery-lightbox-leave-to {
    opacity: 1;
  }
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

@media (max-width: 640px) and (prefers-reduced-motion: reduce) {
  .gallery-lightbox-enter-active,
  .gallery-lightbox-leave-active {
    transition: opacity 0.01ms linear;
  }
}
</style>
