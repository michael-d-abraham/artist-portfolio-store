<template>
  <section class="home-featured" aria-labelledby="home-featured-heading">
    <div class="home-featured__container mobile-safe-container">
      <h2 id="home-featured-heading" class="home-featured__title page-hero-title">
        {{ sectionTitle }}
      </h2>
      <div class="product-grid product-grid--cols-3">
        <GalleryProductCard
          v-for="p in products"
          :key="p._id"
          :product="p"
          :show-added="addedId === p._id"
          @added="onProductAdded"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { useCart } from '../../composables/useCart.js';
import GalleryProductCard from '../product/GalleryProductCard.vue';

defineProps({
  sectionTitle: { type: String, required: true },
  products: {
    type: Array,
    required: true
  }
});

const { openDrawer } = useCart();
const addedId = ref(null);

function onProductAdded(p) {
  openDrawer();
  addedId.value = p._id;
  window.setTimeout(() => {
    if (addedId.value === p._id) {
      addedId.value = null;
    }
  }, 1500);
}
</script>

<style scoped>
.home-featured {
  width: 100%;
  padding: var(--space-md) 0 var(--space-3xl);
  background: var(--color-bg);
}

.home-featured__container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 32px;
}

.home-featured__title {
  margin: 0 0 var(--space-xl);
  font-size: clamp(1.25rem, 3.25vw, 1.875rem);
  text-align: center;
}

@media (min-width: 641px) {
  .home-featured {
    padding-top: var(--space-lg);
  }

  .home-featured__title {
    margin-top: 0;
  }

  .home-featured__container {
    max-width: none;
  }
}

@media (max-width: 640px) {
  .home-featured {
    padding: 0 0 var(--space-2xl);
  }

  .home-featured__container {
    padding: 0 20px;
  }

  .home-featured__title {
    margin-bottom: var(--space-lg);
  }
}

@media (max-width: 390px) {
  .home-featured__container {
    padding: 0 16px;
  }
}
</style>
