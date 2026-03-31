<template>
  <div class="gallery">
    <h1 class="page-title">Gallery</h1>
    <p v-if="loading">Loading…</p>
    <p v-else-if="error" class="error">{{ error }}</p>
    <p v-else-if="!products.length">No products yet.</p>
    <ul v-else class="gallery-grid">
      <li v-for="p in products" :key="p._id">
        <router-link
          :to="{ name: 'product-detail', params: { slug: p.slug } }"
          class="card-link"
        >
          <div class="thumb-wrap">
            <img
              v-if="primaryProductImageUrl(p)"
              class="thumb"
              :src="primaryProductImageUrl(p)"
              :alt="thumbAlt(p)"
            />
            <div v-else class="thumb placeholder">No image</div>
          </div>
          <div class="card-meta">
            <strong>{{ artworkTitleFromProduct(p) }}</strong>
            <span v-if="productTypeName(p)" class="type"> — {{ productTypeName(p) }}</span>
            <div v-if="p.artwork_id && typeof p.artwork_id === 'object' && p.artwork_id.year_created != null" class="year">
              ({{ p.artwork_id.year_created }})
            </div>
            <div class="price-line">{{ formatUsdFromCents(p.price_cents) }} USD</div>
          </div>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getProducts } from '../services/api.js';
import {
  artworkTitleFromProduct,
  formatUsdFromCents,
  primaryProductImageUrl,
  productTypeName
} from '../utils/storefrontProduct.js';

const products = ref([]);
const loading = ref(true);
const error = ref('');

function thumbAlt(p) {
  const url = primaryProductImageUrl(p);
  const primary = p.product_images?.find((i) => i?.is_primary) || p.product_images?.[0];
  if (primary && primary.alt_text) {
    return primary.alt_text;
  }
  return artworkTitleFromProduct(p);
}

onMounted(async () => {
  loading.value = true;
  error.value = '';
  try {
    products.value = await getProducts();
  } catch (e) {
    error.value = e.message || 'Failed to load products';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.gallery {
  padding-bottom: var(--space-xl);
}

.gallery-grid {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(12.5rem, 1fr));
  gap: var(--space-lg);
}

.card-link {
  text-decoration: none;
  color: inherit;
  display: block;
  height: 100%;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-sm);
  box-shadow: var(--shadow-float);
}

.card-link:hover {
  border-color: var(--color-border-strong);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.thumb-wrap {
  aspect-ratio: 4/3;
  background: #eeece8;
  overflow: hidden;
  border-radius: var(--radius-sm);
}

.thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumb.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  height: 100%;
}

.card-meta {
  margin-top: var(--space-sm);
  font-size: 0.9375rem;
  line-height: 1.45;
}

.type {
  color: var(--color-text-muted);
  font-weight: normal;
}

.year {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.price-line {
  margin-top: var(--space-xs);
  font-weight: 600;
  letter-spacing: 0.01em;
}
</style>
