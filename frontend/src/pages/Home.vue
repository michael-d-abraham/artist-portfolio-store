<template>
  <div class="home-page">
    <p v-if="loading" class="home-page__status">Loading…</p>
    <p v-else-if="error" class="error home-page__status">{{ error }}</p>
    <template v-else-if="content">
      <HomeHero :image-url="content.hero_image_url" />
      <HomeFeaturedProducts
        v-if="featuredProducts.length"
        :section-title="content.featured_title"
        :products="featuredProducts"
      />
      <HomeAboutSection
        :section-title="content.about_title"
        :header="content.about_header"
        :text="content.about_text"
        :image-url="content.about_image_url"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getPublicHomePage, getProducts } from '../services/api.js';
import HomeHero from '../components/home/HomeHero.vue';
import HomeFeaturedProducts from '../components/home/HomeFeaturedProducts.vue';
import HomeAboutSection from '../components/home/HomeAboutSection.vue';

const content = ref(null);
const catalogProducts = ref([]);
const loading = ref(true);
const error = ref('');

const featuredProducts = computed(() => {
  if (!content.value?.featured_products?.length || !catalogProducts.value.length) {
    return [];
  }
  const byId = new Map(catalogProducts.value.map((p) => [String(p._id), p]));
  return content.value.featured_products
    .map((slot) => (slot.product_id ? byId.get(String(slot.product_id)) : null))
    .filter(Boolean);
});

onMounted(async () => {
  loading.value = true;
  error.value = '';
  try {
    const [homeData, products] = await Promise.all([getPublicHomePage(), getProducts()]);
    content.value = homeData;
    catalogProducts.value = Array.isArray(products) ? products : [];
  } catch (e) {
    error.value = e.message || 'Failed to load home page';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.home-page {
  width: 100%;
  margin: 0;
  padding: 0;
}

.home-page__status {
  text-align: center;
  color: var(--color-text-muted);
  margin: var(--space-xl) 0;
}
</style>
