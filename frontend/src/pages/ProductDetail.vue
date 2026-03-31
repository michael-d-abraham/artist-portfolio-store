<template>
  <div class="detail">
    <p v-if="loading">Loading…</p>
    <p v-else-if="error" class="error">{{ error }}</p>
    <article v-else-if="product" class="detail-article">
      <h1 class="page-title">{{ artworkTitleFromProduct(product) }}</h1>
      <p v-if="artworkYear != null" class="meta">Year: {{ artworkYear }}</p>
      <p v-if="productTypeName(product)" class="meta">Format: {{ productTypeName(product) }}</p>
      <p v-if="typeDescription" class="type-desc">{{ typeDescription }}</p>
      <ul v-if="typeFeatures.length" class="features">
        <li v-for="(f, i) in typeFeatures" :key="i">{{ f }}</li>
      </ul>
      <p v-if="typeMaterial" class="meta">Material: {{ typeMaterial }}</p>

      <p v-if="artworkDescription" class="description">{{ artworkDescription }}</p>

      <div v-if="imageList.length" class="gallery-images">
        <img
          v-for="img in imageList"
          :key="img._id || img.image_url"
          class="product-img"
          :src="img.image_url"
          :alt="img.alt_text || artworkTitleFromProduct(product)"
        />
      </div>

      <p v-if="product.price_cents != null" class="price">
        {{ formatUsdFromCents(product.price_cents) }} USD
      </p>
      <p v-if="showStock" class="meta stock">Available: {{ product.quantity_available }}</p>
    </article>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { getProductBySlug } from '../services/api.js';
import { artworkTitleFromProduct, formatUsdFromCents, productTypeName } from '../utils/storefrontProduct.js';

const props = defineProps({
  slug: {
    type: String,
    required: true
  }
});

const product = ref(null);
const loading = ref(true);
const error = ref('');

const artwork = computed(() => {
  const a = product.value?.artwork_id;
  return a && typeof a === 'object' ? a : null;
});

const artworkYear = computed(() => artwork.value?.year_created ?? null);
const artworkDescription = computed(() => artwork.value?.description ?? '');

const typeDoc = computed(() => {
  const t = product.value?.product_type_id;
  return t && typeof t === 'object' ? t : null;
});

const typeDescription = computed(() => typeDoc.value?.description ?? '');
const typeFeatures = computed(() =>
  Array.isArray(typeDoc.value?.features) ? typeDoc.value.features : []
);
const typeMaterial = computed(() => typeDoc.value?.material ?? '');

const imageList = computed(() => {
  const imgs = product.value?.product_images;
  if (!Array.isArray(imgs) || !imgs.length) {
    return [];
  }
  return imgs.filter((i) => i && i.image_url);
});

const showStock = computed(() => {
  const q = product.value?.quantity_available;
  return q != null && typeof q === 'number';
});

async function load() {
  loading.value = true;
  error.value = '';
  product.value = null;
  try {
    product.value = await getProductBySlug(props.slug);
  } catch (e) {
    error.value = e.status === 404 ? 'Product not found.' : e.message || 'Failed to load product';
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(() => props.slug, load);
</script>

<style scoped>
.detail {
  padding-bottom: var(--space-xl);
  max-width: 44rem;
}

.detail-article {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-lg) var(--space-xl);
  box-shadow: var(--shadow-float);
}

.detail-article .page-title {
  margin-bottom: var(--space-md);
}

.meta {
  color: var(--color-text-muted);
  margin: 0.35rem 0;
  font-size: 0.9375rem;
}

.type-desc {
  margin-top: var(--space-md);
  white-space: pre-wrap;
  color: var(--color-text);
}

.features {
  margin: var(--space-md) 0;
  padding-left: 1.35rem;
  color: var(--color-text);
}

.description {
  margin-top: var(--space-lg);
  white-space: pre-wrap;
  line-height: 1.65;
}

.gallery-images {
  margin-top: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.product-img {
  max-width: 100%;
  height: auto;
  display: block;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.price {
  margin-top: var(--space-lg);
  font-weight: 600;
  font-size: 1.0625rem;
  letter-spacing: 0.02em;
}

.stock {
  font-size: 0.9375rem;
}

@media (max-width: 40rem) {
  .detail-article {
    padding: var(--space-md);
  }
}
</style>
