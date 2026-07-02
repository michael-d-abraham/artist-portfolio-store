<template>
  <div class="gallery-page">
    <h1 class="page-hero-title">Gallery</h1>

    <p v-if="loading" class="gallery-status">Loading…</p>
    <p v-else-if="error" class="error">{{ error }}</p>
    <p v-else-if="!products.length" class="gallery-status">No products yet.</p>

    <template v-else>
      <section class="gallery-section" aria-label="Product gallery">
        <div class="gallery-container mobile-safe-container">
          <div class="product-grid product-grid--gallery">
            <GalleryProductCard
              v-for="p in visibleProducts"
              :key="p._id"
              :product="p"
              :show-add-to-cart="false"
              navigation-mode="emit"
              @open="openProduct"
            />
          </div>

          <div v-if="hasMore" class="load-more-wrap">
            <button type="button" class="load-more-button" @click="loadMore">
              Load More
            </button>
          </div>
        </div>
      </section>
    </template>

    <ProductDetailOverlay
      v-if="activeProductSlug"
      :slug="activeProductSlug"
      @close="closeProduct"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getProducts } from '../services/api.js';
import GalleryProductCard from '../components/product/GalleryProductCard.vue';
import ProductDetailOverlay from '../components/product/ProductDetailOverlay.vue';

const PAGE_SIZE = 8;

const route = useRoute();
const router = useRouter();

const products = ref([]);
const loading = ref(true);
const error = ref('');
const visibleCount = ref(PAGE_SIZE);

const visibleProducts = computed(() => products.value.slice(0, visibleCount.value));
const hasMore = computed(() => visibleCount.value < products.value.length);

// Future prev/next in overlay: pass visibleProducts (or products) slugs into
// ProductDetailOverlay and navigate with router.push({ query: { product: nextSlug } }).

const activeProductSlug = computed(() => {
  const product = route.query.product;
  return typeof product === 'string' && product ? product : null;
});

function openProduct(slug) {
  router.push({ name: 'gallery', query: { product: slug } });
}

function closeProduct() {
  if (window.history.state?.back != null) {
    router.back();
    return;
  }
  router.replace({ name: 'gallery' });
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
}
</style>
