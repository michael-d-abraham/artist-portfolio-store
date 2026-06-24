<template>
  <article class="product-card">
    <router-link
      :to="{ name: 'product-detail', params: { slug: product.slug } }"
      class="product-image-link"
      :aria-label="`${displayProductName(product)} — view product`"
    >
      <div class="product-image-frame">
        <img
          v-if="primaryProductImageUrl(product)"
          class="product-image"
          :src="primaryProductImageUrl(product)"
          :alt="thumbAlt(product)"
          loading="lazy"
        />
        <span v-else class="product-image product-image--placeholder">No image</span>
      </div>
    </router-link>

    <div class="product-info">
      <router-link
        :to="{ name: 'product-detail', params: { slug: product.slug } }"
        class="product-title-link"
      >
        <h3 class="product-title">{{ displayProductName(product) }}</h3>
      </router-link>
      <p class="product-price">{{ formatMoneyFromCents(product.price_cents, product.currency || 'usd') }}</p>
    </div>

    <button
      type="button"
      class="add-to-cart-button"
      :disabled="previewOnly || !canAddToCart(product) || showAdded"
      :aria-label="`Add ${displayProductName(product)} to cart`"
      @click="onAddToCart"
    >
      {{
        showAdded
          ? 'Added'
          : canAddToCart(product)
            ? 'Add to Cart'
            : 'Out of stock'
      }}
    </button>
  </article>
</template>

<script setup>
import { addToCart } from '../../utils/cart.js';
import { formatMoneyFromCents } from '../../utils/money.js';
import {
  displayProductName,
  primaryProductImageUrl,
  productTitle
} from '../../utils/storefrontProduct.js';

const props = defineProps({
  product: { type: Object, required: true },
  showAdded: { type: Boolean, default: false },
  previewOnly: { type: Boolean, default: false }
});

const emit = defineEmits(['added']);

function thumbAlt(p) {
  const primary = p.product_images?.find((i) => i?.is_primary) || p.product_images?.[0];
  if (primary && primary.alt_text) {
    return primary.alt_text;
  }
  return productTitle(p);
}

function canAddToCart(p) {
  const q = p?.quantity_available;
  if (q == null || typeof q !== 'number') {
    return true;
  }
  return q > 0;
}

function onAddToCart() {
  if (props.previewOnly) return;
  const result = addToCart(props.product);
  if (result.ok) {
    emit('added', props.product);
  }
}
</script>
