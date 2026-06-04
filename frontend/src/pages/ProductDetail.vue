<template>
  <div class="product-page">
    <p v-if="loading" class="product-page__status">Loading…</p>
    <p v-else-if="error" class="error product-page__status">{{ error }}</p>

    <!-- Mobile product layout -->
    <div v-else-if="product && isMobile" class="product-page__content product-page__content--mobile">
      <ProductBreadcrumb label="Back to Gallery" back-to="/gallery" />
      <ProductImageGallery :images="imageList" :image-alt="productTitle(product)" />
      <ProductInfo :title="productTitle(product)" :price="formattedPrice" />
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
      <ProductDescription :text="product.description || ''" />
    </div>

    <!-- Desktop layout -->
    <article v-else-if="product" class="detail detail--desktop">
      <h1 class="page-title">{{ productTitle(product) }}</h1>
      <p v-if="product.year_created != null" class="meta">Year: {{ product.year_created }}</p>
      <p v-if="productFormat(product)" class="meta">Format: {{ productFormat(product) }}</p>
      <p v-if="product.size_label" class="meta">Size: {{ product.size_label }}</p>

      <p v-if="product.description" class="description">{{ product.description }}</p>

      <ProductImageGallery
        v-if="imageList.length"
        class="detail__gallery"
        :images="imageList"
        :image-alt="productTitle(product)"
      />

      <p v-if="product.price_cents != null" class="price">
        {{ formatUsdFromCents(product.price_cents) }} {{ (product.currency || 'usd').toUpperCase() }}
      </p>
      <p v-if="showStock" class="meta stock">Available: {{ product.quantity_available }}</p>

      <div v-if="canBuy" class="buy-actions">
        <AddToCartButton
          :label="addButtonLabel"
          :disabled="added"
          @click="onAddToCart"
        />
      </div>
    </article>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { getProductBySlug } from '../services/api.js';
import { addToCart, setCartQuantity } from '../utils/cart.js';
import { useCart } from '../composables/useCart.js';
import { useMediaQuery } from '../composables/useMediaQuery.js';
import {
  productTitle,
  productFormat,
  formatUsdFromCents
} from '../utils/storefrontProduct.js';
import ProductBreadcrumb from '../components/product/ProductBreadcrumb.vue';
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
  }
});

const isMobile = useMediaQuery('(max-width: 640px)');
const { openDrawer } = useCart();

const product = ref(null);
const loading = ref(true);
const error = ref('');
const quantity = ref(1);
const added = ref(false);

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
  return formatUsdFromCents(product.value.price_cents);
});

const showStock = computed(() => {
  const q = product.value?.quantity_available;
  return q != null && typeof q === 'number';
});

const maxQuantity = computed(() => {
  const q = product.value?.quantity_available;
  if (q == null || typeof q !== 'number') {
    return 99;
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
</script>

<style scoped>
.product-page {
  width: 100%;
}

.product-page__content--mobile {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: 12px 20px 48px;
}

.product-page__status {
  padding: 20px;
  text-align: center;
  color: var(--color-text-muted);
}

.detail--desktop {
  padding-bottom: var(--space-3xl);
  max-width: 40rem;
  margin: 0 auto;
}

.detail--desktop .page-title {
  margin-bottom: var(--space-lg);
  text-align: center;
  font-size: clamp(0.9375rem, 2.5vw, 1.125rem);
  font-weight: 400;
  letter-spacing: 0.1em;
}

.meta {
  color: var(--color-text-muted);
  margin: 0.35rem 0;
  font-size: 0.8125rem;
  font-weight: 300;
  text-align: center;
  letter-spacing: 0.04em;
}

.description {
  margin-top: var(--space-xl);
  white-space: pre-wrap;
  line-height: 1.7;
  font-weight: 300;
  font-size: 0.9375rem;
}

.detail__gallery {
  margin-top: var(--space-xl);
}

.price {
  margin-top: var(--space-xl);
  font-weight: 400;
  font-size: 0.875rem;
  letter-spacing: 0.06em;
  text-align: center;
}

.stock {
  font-size: 0.8125rem;
  text-align: center;
}

.buy-actions {
  margin-top: var(--space-xl);
  display: flex;
  justify-content: center;
}

.buy-actions :deep(.add-to-cart-button) {
  min-width: 12rem;
}

@media (max-width: 390px) {
  .product-page__content--mobile,
  .product-page__status {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>
