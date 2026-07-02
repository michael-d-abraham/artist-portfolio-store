<template>
  <div
    class="product-page"
    :class="{ 'product-page--overlay': overlay }"
    @click="onDesktopBackdropClick"
  >
    <p v-if="loading" class="product-page__status">Loading…</p>
    <p v-else-if="error" class="error product-page__status">{{ error }}</p>

    <!-- Mobile product layout -->
    <div v-else-if="product && isMobile" class="product-page__content product-page__content--mobile">
      <ProductCloseButton
        flush
        back-to="/gallery"
        :as-button="overlay"
        @close="emit('close')"
      />
      <ProductImageGallery :images="imageList" :image-alt="productTitle(product)" />
      <div class="product-page__purchase">
        <ProductInfo :title="productTitle(product)" :price="formattedPrice" />
        <p v-if="showStock" class="product-page__availability">
          Available: {{ product.quantity_available }}
        </p>
        <SizeDropdown :size-label="product.size_label || ''" />
        <ProductQuantityField
          v-model="quantity"
          :max="maxQuantity"
          @increment="incrementQty"
          @decrement="decrementQty"
        />
        <AddToCartButton
          :label="addButtonLabel"
          :disabled="!canBuy || added"
          :aria-label="`Add ${productTitle(product)} to cart`"
          @click="onAddToCart"
        />
      </div>
      <ProductDescription :text="product.description || ''" />
    </div>

    <!-- Desktop layout -->
    <article v-else-if="product" class="detail detail--desktop">
      <div ref="detailCardRef" class="detail__card" @click="onDesktopCardBackdropClick">
        <ProductCloseButton
          class="detail__close"
          flush
          back-to="/gallery"
          :label="imageLightboxOpen ? 'Close enlarged image' : 'Close and return to gallery'"
          :as-button="overlay || imageLightboxOpen"
          @close="onDesktopClose"
        />

        <div
          ref="detailGridRef"
          class="detail__grid"
          :class="{ 'detail__grid--lightbox-open': imageLightboxOpen }"
        >
          <div class="detail__media">
            <ProductImageGallery
              v-if="imageList.length"
              ref="galleryRef"
              class="detail__gallery"
              :images="imageList"
              :image-alt="productTitle(product)"
              contained-lightbox
              :lightbox-target="detailGridRef"
              @lightbox-change="imageLightboxOpen = $event"
            />
          </div>

          <div class="detail__info">
            <h1 class="page-title">{{ productTitle(product) }}</h1>
            <div v-if="hasDesktopMeta" class="detail__meta-group">
              <p v-if="product.year_created != null" class="meta">Year: {{ product.year_created }}</p>
              <p v-if="productFormat(product)" class="meta">Format: {{ productFormat(product) }}</p>
              <p v-if="product.size_label" class="meta">Size: {{ product.size_label }}</p>
            </div>

            <div class="detail__purchase">
              <p v-if="product.price_cents != null" class="price">
                {{ formatMoneyFromCents(product.price_cents, product.currency || 'usd') }}
              </p>
              <p v-if="showStock" class="meta stock">Available: {{ product.quantity_available }}</p>
              <ProductQuantityField
                v-model="quantity"
                :max="maxQuantity"
                @increment="incrementQty"
                @decrement="decrementQty"
              />
              <AddToCartButton
                :label="addButtonLabel"
                :disabled="!canBuy || added"
                :aria-label="`Add ${productTitle(product)} to cart`"
                @click="onAddToCart"
              />
            </div>

            <ProductDescription :text="product.description || ''" />
          </div>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getProductBySlug } from '../services/api.js';
import { addToCart, setCartQuantity } from '../utils/cart.js';
import { CART_QUANTITY_MAX } from '@shared/cartQuantity.js';
import { useCart } from '../composables/useCart.js';
import { useMediaQuery } from '../composables/useMediaQuery.js';
import { formatMoneyFromCents } from '../utils/money.js';
import {
  productTitle,
  productFormat
} from '../utils/storefrontProduct.js';
import ProductCloseButton from '../components/product/ProductCloseButton.vue';
import ProductImageGallery from '../components/product/ProductImageGallery.vue';
import ProductInfo from '../components/product/ProductInfo.vue';
import SizeDropdown from '../components/product/SizeDropdown.vue';
import ProductQuantityField from '../components/product/ProductQuantityField.vue';
import AddToCartButton from '../components/product/AddToCartButton.vue';
import ProductDescription from '../components/product/ProductDescription.vue';

const props = defineProps({
  slug: {
    type: String,
    required: true
  },
  overlay: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'lightbox-change']);

const isMobile = useMediaQuery('(max-width: 640px)');
const router = useRouter();
const { openDrawer } = useCart();

const product = ref(null);
const loading = ref(true);
const error = ref('');
const quantity = ref(1);
const added = ref(false);
const detailGridRef = ref(null);
const detailCardRef = ref(null);
const galleryRef = ref(null);
const imageLightboxOpen = ref(false);

const imageList = computed(() => {
  const imgs = product.value?.product_images;
  if (!Array.isArray(imgs) || !imgs.length) {
    return [];
  }
  return imgs
    .filter((i) => i && i.image_url)
    .sort((a, b) => Number(!!b.is_primary) - Number(!!a.is_primary));
});

const formattedPrice = computed(() => {
  if (product.value?.price_cents == null) return null;
  return formatMoneyFromCents(
    product.value.price_cents,
    product.value.currency || 'usd'
  );
});

const showStock = computed(() => {
  const q = product.value?.quantity_available;
  return q != null && typeof q === 'number';
});

const hasDesktopMeta = computed(() => {
  if (!product.value) return false;
  return (
    product.value.year_created != null
    || Boolean(productFormat(product.value))
    || Boolean(product.value.size_label)
  );
});

const maxQuantity = computed(() => {
  const q = product.value?.quantity_available;
  if (q == null || typeof q !== 'number') {
    return CART_QUANTITY_MAX;
  }
  return Math.max(1, q);
});

const canBuy = computed(() => {
  const q = product.value?.quantity_available;
  if (q == null || typeof q !== 'number') {
    return true;
  }
  return q > 0;
});

const addButtonLabel = computed(() => {
  if (added.value) return 'Added';
  if (!canBuy.value) return 'Out of stock';
  return 'Add to Cart';
});

function incrementQty() {
  quantity.value = Math.min(maxQuantity.value, quantity.value + 1);
}

function decrementQty() {
  quantity.value = Math.max(1, quantity.value - 1);
}

function onDesktopClose() {
  if (imageLightboxOpen.value) {
    galleryRef.value?.closeLightbox();
    return;
  }
  if (props.overlay) {
    emit('close');
    return;
  }
  router.push({ name: 'gallery' });
}

function onDesktopCardBackdropClick(event) {
  if (isMobile.value || !imageLightboxOpen.value) {
    return;
  }
  const grid = detailGridRef.value;
  if (!grid || grid.contains(event.target)) {
    return;
  }
  if (event.target.closest('.product-close-button')) {
    return;
  }
  closeImageLightbox();
}

function onDesktopBackdropClick(event) {
  if (isMobile.value || !product.value) {
    return;
  }
  const card = event.currentTarget.querySelector('.detail__card');
  if (!card || card.contains(event.target)) {
    return;
  }
  onDesktopClose();
}

function closeImageLightbox() {
  galleryRef.value?.closeLightbox();
}

defineExpose({ closeImageLightbox });

function onAddToCart() {
  if (!product.value || !canBuy.value) return;
  const result = addToCart(product.value);
  if (!result.ok) return;
  setCartQuantity(product.value._id, quantity.value);
  openDrawer();
  added.value = true;
  window.setTimeout(() => {
    added.value = false;
  }, 1500);
}

async function load() {
  loading.value = true;
  error.value = '';
  product.value = null;
  quantity.value = 1;
  added.value = false;
  imageLightboxOpen.value = false;
  try {
    product.value = await getProductBySlug(props.slug);
  } catch (e) {
    error.value = e.status === 404 ? 'Product not found.' : e.message || 'Failed to load product';
  } finally {
    loading.value = false;
  }
}

watch(maxQuantity, (max) => {
  if (quantity.value > max) {
    quantity.value = max;
  }
});

onMounted(load);
watch(() => props.slug, load);

watch(imageLightboxOpen, (open) => {
  emit('lightbox-change', open);
});
</script>

<style scoped>
.product-page {
  width: 100%;
}

.product-page--overlay {
  min-height: 100%;
}

.product-page__content--mobile {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: 8px 20px 40px;
  overflow-x: hidden;
}

.product-page__purchase {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.product-page__availability {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 400;
  color: var(--color-text-muted);
  letter-spacing: 0.02em;
}

.product-page__purchase :deep(.product-info),
.product-page__purchase :deep(.size-dropdown),
.product-page__purchase :deep(.product-quantity) {
  margin-bottom: 0;
}

.product-page__purchase :deep(.qty-btn) {
  width: 2rem;
  height: 2rem;
  min-width: 36px;
  min-height: 36px;
  font-size: 1rem;
}

.product-page__purchase :deep(.qty-input) {
  width: 2rem;
  min-height: 36px;
  font-size: 0.9375rem;
}

.product-page__purchase :deep(.add-to-cart-button) {
  height: 44px;
  font-size: 0.9375rem;
  font-weight: 600;
  margin-top: 0.125rem;
}

.product-page__content--mobile :deep(.product-close-button) {
  margin-bottom: 0.25rem;
}

.product-page__content--mobile :deep(.product-image-gallery) {
  margin-bottom: 0.5rem;
}

.product-page__content--mobile :deep(.product-description) {
  margin-top: 1rem;
  padding-top: 0.875rem;
}

.product-page__status {
  padding: 20px;
  text-align: center;
  color: var(--color-text-muted);
}

.detail--desktop {
  box-sizing: border-box;
  width: 100%;
}

.detail__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: 2.5rem;
  align-items: start;
}

.detail__media {
  min-width: 0;
}

.detail__info {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.detail--desktop .page-title {
  margin: 0 0 0.5rem;
  text-align: left;
  font-size: 1.25rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  line-height: 1.35;
}

.detail__meta-group {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-bottom: 0.25rem;
}

.meta {
  color: var(--color-text-muted);
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 300;
  text-align: left;
  letter-spacing: 0.04em;
}

.detail__purchase {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.detail__purchase :deep(.product-quantity) {
  margin-bottom: 0;
  width: 100%;
}

.detail__purchase :deep(.add-to-cart-button) {
  width: 100%;
  min-width: 0;
  height: 44px;
  font-size: 0.9375rem;
  font-weight: 600;
}

.detail__info :deep(.product-description) {
  margin-top: 1.25rem;
  padding-top: 1rem;
}

.price {
  margin: 0;
  font-weight: 500;
  font-size: 1rem;
  letter-spacing: 0.04em;
  text-align: left;
}

.stock {
  font-size: 0.8125rem;
  text-align: left;
}

@media (min-width: 641px) {
  .product-page:has(.detail--desktop) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    box-sizing: border-box;
    padding: 48px;
  }

  .product-page:has(.detail--desktop):not(.product-page--overlay) {
    min-height: calc(100dvh - 7rem);
  }

  .product-page--overlay:has(.detail--desktop) {
    min-height: 100%;
    padding: 0;
  }

  .detail--desktop {
    width: min(1180px, calc(100vw - 96px));
    height: min(760px, calc(100vh - 96px));
    max-width: none;
    margin: 0;
  }

  .product-page:not(.product-page--overlay):has(.detail--desktop) .detail--desktop {
    height: min(760px, calc(100dvh - 10rem));
  }

  .product-page:not(.product-page--overlay):has(.detail--desktop) {
    padding: 24px 48px;
  }

  .detail__card {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: #fff;
    border: 1px solid var(--color-border);
    overflow: hidden;
    box-sizing: border-box;
  }

  .product-page--overlay .detail__card {
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  }

  .detail__close {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 21;
    margin: 0;
  }

  .detail__grid--lightbox-open .detail__info {
    visibility: hidden;
  }

  .detail__grid {
    flex: 1;
    min-height: 0;
    height: 100%;
    position: relative;
    grid-template-columns: minmax(0, 1.25fr) minmax(340px, 0.85fr);
    gap: 40px;
    align-items: stretch;
    padding: 40px 56px 40px 40px;
    box-sizing: border-box;
  }

  .detail__media {
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
  }

  .detail__media :deep(.product-image-gallery) {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
    margin-bottom: 0;
  }

  .detail__media :deep(.product-image-gallery__stage) {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .detail__media :deep(.product-image-gallery__viewport) {
    height: 100%;
    min-height: 0;
  }

  .detail__media :deep(.product-image-gallery__nav--inline.product-image-gallery__nav--prev) {
    left: 8px;
    right: auto;
    margin-right: 0;
  }

  .detail__media :deep(.product-image-gallery__nav--inline.product-image-gallery__nav--next) {
    right: 8px;
    left: auto;
    margin-left: 0;
  }

  .detail__media :deep(.product-image-gallery__dots) {
    margin-top: 12px;
    flex-shrink: 0;
  }

  .detail__info {
    justify-content: flex-start;
    gap: 0;
    padding-top: 4px;
    padding-right: 4px;
    overflow-y: auto;
  }

  .detail--desktop .page-title {
    font-size: 1.375rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    margin-bottom: 0.625rem;
    padding-right: 2rem;
  }

  .detail__meta-group {
    gap: 0.3rem;
    margin-bottom: 0.5rem;
  }

  .meta {
    font-size: 0.875rem;
    font-weight: 400;
    color: var(--color-text);
    opacity: 0.72;
  }

  .detail__purchase {
    gap: 1rem;
    margin-top: 1.25rem;
    padding-top: 1.25rem;
  }

  .detail__purchase :deep(.product-quantity__label) {
    font-size: 0.75rem;
  }

  .detail__purchase :deep(.add-to-cart-button) {
    height: 46px;
    font-size: 1rem;
  }

  .detail__info :deep(.product-description) {
    margin-top: 1.5rem;
    padding-top: 1.25rem;
  }

  .detail__info :deep(.product-description__text) {
    font-size: 0.9375rem;
    line-height: 1.65;
  }

  .price {
    font-size: 1.125rem;
    font-weight: 600;
    letter-spacing: 0.03em;
  }

  .stock {
    font-size: 0.875rem;
    opacity: 0.72;
  }
}

@media (max-width: 390px) {
  .product-page__content--mobile,
  .product-page__status {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>
