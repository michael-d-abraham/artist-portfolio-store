<template>
  <div class="gallery-page">
    <h1 class="page-hero-title">Gallery</h1>

    <p v-if="loading" class="gallery-status">Loading…</p>
    <p v-else-if="error" class="error">{{ error }}</p>
    <p v-else-if="!products.length" class="gallery-status">No products yet.</p>

    <template v-else>
      <section class="gallery-section" aria-label="Product gallery">
        <div class="gallery-container mobile-safe-container">
          <div class="product-grid">
            <article
              v-for="p in visibleProducts"
              :key="p._id"
              class="product-card"
            >
              <router-link
                :to="{ name: 'product-detail', params: { slug: p.slug } }"
                class="product-image-link"
                :aria-label="`${displayProductName(p)} — view product`"
              >
                <div class="product-image-frame">
                  <img
                    v-if="primaryProductImageUrl(p)"
                    class="product-image"
                    :src="primaryProductImageUrl(p)"
                    :alt="thumbAlt(p)"
                    loading="lazy"
                  />
                  <span v-else class="product-image product-image--placeholder">No image</span>
                </div>
              </router-link>

              <div class="product-info">
                <router-link
                  :to="{ name: 'product-detail', params: { slug: p.slug } }"
                  class="product-title-link"
                >
                  <h3 class="product-title">{{ displayProductName(p) }}</h3>
                </router-link>
                <p class="product-price">${{ formatUsdFromCents(p.price_cents) }}</p>
              </div>

              <button
                type="button"
                class="add-to-cart-button"
                :disabled="!canAddToCart(p) || addedId === p._id"
                :aria-label="`Add ${displayProductName(p)} to cart`"
                @click="onAddToCart(p)"
              >
                {{ addedId === p._id ? 'Added' : canAddToCart(p) ? 'Add to Cart' : 'Out of stock' }}
              </button>
            </article>
          </div>

          <div v-if="hasMore" class="load-more-wrap">
            <button type="button" class="load-more-button" @click="loadMore">
              Load More
            </button>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getProducts } from '../services/api.js';
import { addToCart } from '../utils/cart.js';
import { useCart } from '../composables/useCart.js';
import {
  displayProductName,
  formatUsdFromCents,
  primaryProductImageUrl,
  productTitle
} from '../utils/storefrontProduct.js';

const { openDrawer } = useCart();

const PAGE_SIZE = 8;

const products = ref([]);
const loading = ref(true);
const error = ref('');
const addedId = ref(null);
const visibleCount = ref(PAGE_SIZE);

const visibleProducts = computed(() => products.value.slice(0, visibleCount.value));
const hasMore = computed(() => visibleCount.value < products.value.length);

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

function onAddToCart(p) {
  const result = addToCart(p);
  if (!result.ok) {
    return;
  }
  openDrawer();
  addedId.value = p._id;
  window.setTimeout(() => {
    if (addedId.value === p._id) {
      addedId.value = null;
    }
  }, 1500);
}

function loadMore() {
  visibleCount.value = Math.min(visibleCount.value + PAGE_SIZE, products.value.length);
}

onMounted(async () => {
  loading.value = true;
  error.value = '';
  try {
    products.value = await getProducts();
    visibleCount.value = Math.min(PAGE_SIZE, products.value.length || PAGE_SIZE);
  } catch (e) {
    error.value = e.message || 'Failed to load products';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.gallery-page {
  width: 100%;
}

.page-hero-title {
  margin: 0 0 var(--space-xl);
  text-align: center;
}

.gallery-status {
  color: var(--color-text-muted);
  margin: 0;
  text-align: center;
  font-weight: 300;
}

.gallery-section {
  width: 100%;
  background: #fff;
  padding: 40px 0 56px;
}

.gallery-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 32px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  column-gap: 20px;
  row-gap: 48px;
  align-items: start;
}

.product-card {
  width: 100%;
  min-height: 320px;
  display: grid;
  grid-template-rows: 180px 84px 40px;
  justify-items: center;
  margin: 0;
  padding: 0;
  background: transparent;
  border: none;
  box-shadow: none;
}

.product-image-link {
  width: 100%;
  height: 180px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  text-decoration: none;
  color: inherit;
}

.product-image-frame {
  width: 132px;
  height: 132px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: visible;
}

.product-image {
  max-width: 132px;
  max-height: 170px;
  width: auto;
  height: auto;
  object-fit: contain;
  object-position: center;
  display: block;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.22);
}

.product-image--placeholder {
  max-width: 100%;
  max-height: 100%;
  box-shadow: none;
  font-size: 0.75rem;
  font-weight: 400;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.product-info {
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}

.product-title-link {
  text-decoration: none;
  color: inherit;
}

.product-title-link:hover {
  opacity: 0.65;
}

.product-title {
  max-width: 210px;
  min-height: 42px;
  margin: 0 0 8px;
  font-size: 16px;
  line-height: 1.35;
  font-weight: 700;
  color: #000;
}

.product-price {
  margin: 0;
  font-size: 16px;
  line-height: 1.3;
  font-weight: 700;
  color: #444;
}

.add-to-cart-button {
  width: 100%;
  height: 40px;
  background: #000;
  color: #fff;
  border: 0;
  border-radius: 0;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: none;
  cursor: pointer;
  box-shadow: none;
  transition: background 0.2s ease;
}

.add-to-cart-button:hover:not(:disabled) {
  background: #222;
  opacity: 1;
}

.add-to-cart-button:disabled {
  background: #999;
  cursor: not-allowed;
}

.load-more-wrap {
  display: flex;
  justify-content: center;
  margin-top: 48px;
}

.load-more-button {
  min-width: 11rem;
  height: 40px;
  padding: 0 1.5rem;
  background: #fff;
  color: #000;
  border: 1px solid #000;
  border-radius: 0;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  box-shadow: none;
}

.load-more-button:hover:not(:disabled) {
  background: #000;
  color: #fff;
  opacity: 1;
}

@media (max-width: 900px) {
  .product-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 24px;
    row-gap: 48px;
  }
}

@media (max-width: 640px) {
  .page-hero-title {
    margin-bottom: var(--space-lg);
  }

  .gallery-section {
    padding: 24px 0 48px;
  }

  .gallery-container,
  .mobile-safe-container {
    width: 100%;
    max-width: 100%;
    padding: 0 20px;
    box-sizing: border-box;
  }

  .product-grid {
    display: grid;
    grid-template-columns: 1fr;
    row-gap: 56px;
    column-gap: 0;
  }

  .product-card {
    width: 100%;
    max-width: 320px;
    min-height: 0;
    margin: 0 auto;
    display: grid;
    grid-template-rows: auto auto auto;
    justify-items: center;
  }

  .product-image-link {
    width: 100%;
    height: auto;
    min-height: 190px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .product-image-frame {
    width: 180px;
    height: auto;
    min-height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: visible;
  }

  .product-image {
    max-width: 180px;
    max-height: 220px;
    width: auto;
    height: auto;
    object-fit: contain;
    object-position: center;
  }

  .product-info {
    margin-top: 22px;
    text-align: center;
  }

  .product-title {
    max-width: 280px;
    min-height: 0;
    margin: 0 0 8px;
    font-size: 16px;
    line-height: 1.35;
    font-weight: 700;
  }

  .product-price {
    margin: 0 0 16px;
    font-size: 16px;
    line-height: 1.3;
    font-weight: 700;
  }

  .add-to-cart-button {
    width: 100%;
    height: 42px;
    font-size: 16px;
    font-weight: 700;
  }

  .load-more-wrap {
    margin-top: 40px;
  }

  .load-more-button {
    width: 100%;
    max-width: 320px;
    min-height: 44px;
    height: 44px;
  }
}

@media (max-width: 390px) {
  .gallery-container,
  .mobile-safe-container {
    padding: 0 16px;
  }

  .product-card {
    max-width: 300px;
  }

  .product-image-frame {
    width: 160px;
    min-height: 170px;
  }

  .product-image {
    max-width: 160px;
    max-height: 205px;
  }

  .product-title {
    max-width: 260px;
  }
}
</style>
