<template>
  <div class="admin-home-preview">
    <!-- Hero (mirrors HomeHero) -->
    <section class="admin-home-preview__hero hero-display" aria-label="Hero preview">
      <div class="admin-home-preview__hero-inner hero-display__inner">
        <AdminHomePreviewImageSlot
          class="admin-home-preview__hero-image-wrap"
          :image-url="form.hero_image_url"
          :disabled="disabled"
          natural-display
          photo-class="hero-display__photo"
          aria-label="Hero image"
          @pick="$emit('pick-image', { type: 'hero' })"
          @remove="$emit('remove-image', { type: 'hero' })"
        />
      </div>
    </section>

    <!-- Featured (mirrors HomeFeaturedProducts) -->
    <section class="admin-home-preview__featured" aria-label="Featured products preview">
      <div class="admin-home-preview__container">
        <input
          v-model="form.featured_title"
          type="text"
          class="admin-home-preview__section-title page-hero-title"
          placeholder="Featured products"
          aria-label="Featured section title"
        />
        <div class="product-grid product-grid--cols-3 admin-home-preview__product-grid">
          <AdminHomeFeaturedSlot
            v-for="(item, index) in form.featured_products"
            :key="'preview-featured-' + index"
            :product-id="item.product_id"
            :slot-number="index + 1"
            :catalog-products="catalogProducts"
            :taken-product-ids="takenFeaturedProductIds"
            :disabled="disabled"
            @update:product-id="item.product_id = $event"
          />
        </div>
      </div>
    </section>

    <!-- About (mirrors HomeAboutSection) -->
    <section class="admin-home-preview__about" aria-label="About preview">
      <div class="admin-home-preview__container admin-home-preview__about-inner">
        <input
          v-model="form.about_title"
          type="text"
          class="admin-home-preview__section-title page-hero-title"
          placeholder="About"
          aria-label="About section title"
        />
        <div class="admin-home-preview__about-grid">
          <div class="admin-home-preview__about-copy">
            <label class="admin-home-preview__about-header-field">
              <span class="admin-home-preview__about-text-label">About header</span>
              <input
                v-model="form.about_header"
                type="text"
                class="admin-home-preview__about-header-input"
                placeholder="Short headline above your about text"
                aria-label="About header"
                :disabled="disabled"
              />
            </label>
            <label class="admin-home-preview__about-text-field">
              <span class="admin-home-preview__about-text-label">About text</span>
              <textarea
                v-model="form.about_text"
                class="admin-home-preview__about-text-input"
                rows="8"
                placeholder="Write your about copy here…"
                aria-label="About text"
                :disabled="disabled"
              />
            </label>
          </div>
          <AdminHomePreviewImageSlot
            class="admin-home-preview__about-image-wrap"
            :image-url="form.about_image_url"
            :disabled="disabled"
            natural-display
            aria-label="About image"
            @pick="$emit('pick-image', { type: 'about' })"
            @remove="$emit('remove-image', { type: 'about' })"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import AdminHomePreviewImageSlot from './AdminHomePreviewImageSlot.vue';
import AdminHomeFeaturedSlot from './AdminHomeFeaturedSlot.vue';

const props = defineProps({
  form: { type: Object, required: true },
  catalogProducts: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false }
});

defineEmits(['pick-image', 'remove-image']);

const takenFeaturedProductIds = computed(() =>
  props.form.featured_products
    .map((row) => (row.product_id ? String(row.product_id) : ''))
    .filter(Boolean)
);
</script>

<style scoped>
.admin-home-preview {
  width: 100%;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
}

/* —— Hero (uses hero-display.css for image scale limits) —— */
.admin-home-preview__hero {
  padding: var(--space-lg) var(--space-lg) var(--space-2xl);
}

.admin-home-preview__hero-inner {
  max-width: 1100px;
  margin: 0 auto;
}

.admin-home-preview__hero-image-wrap {
  width: auto;
  max-width: 100%;
}

.admin-home-preview__hero-image-wrap :deep(.admin-home-img-slot__hit:not(:has(.admin-home-img-slot__photo))) {
  aspect-ratio: 16 / 9;
  min-height: 200px;
}

/* —— Shared container —— */
.admin-home-preview__container {
  max-width: 1100px;
  margin: 0 auto;
}

.admin-home-preview__section-title {
  display: block;
  width: 100%;
  margin: 0 0 var(--space-xl);
  font-size: clamp(1.25rem, 3.25vw, 1.875rem);
  padding: 0.25rem 0.5rem;
  border: 1px dashed transparent;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  text-align: center;
}

.admin-home-preview__section-title:hover,
.admin-home-preview__section-title:focus {
  border-color: var(--color-border);
  outline: none;
}

/* —— Featured —— */
.admin-home-preview__featured {
  padding: var(--space-lg) var(--space-lg) var(--space-3xl);
}

.admin-home-preview__featured .admin-home-preview__container {
  max-width: 1100px;
}

/* —— About —— */
.admin-home-preview__about {
  padding: 0 var(--space-lg) var(--space-3xl);
  background: #f7f7f7;
  border-top: 1px solid var(--color-border);
}

.admin-home-preview__about-inner {
  padding-top: var(--space-xl);
}

.admin-home-preview__about-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2xl);
  align-items: start;
}

.admin-home-preview__about-copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.admin-home-preview__about-header-field,
.admin-home-preview__about-text-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.admin-home-preview__about-header-input {
  width: 100%;
  padding: var(--space-md) var(--space-lg);
  font-family: inherit;
  font-size: clamp(1rem, 2vw, 1.25rem);
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1.4;
  color: var(--color-text);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

.admin-home-preview__about-header-input:hover,
.admin-home-preview__about-header-input:focus {
  border-color: var(--color-text);
  outline: none;
}

.admin-home-preview__about-text-label {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
}

.admin-home-preview__about-text-input {
  width: 100%;
  min-height: 12rem;
  padding: var(--space-md);
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.7;
  color: var(--color-text);
  border: 1px dashed var(--color-border);
  background: transparent;
  resize: vertical;
}

.admin-home-preview__about-text-input:hover,
.admin-home-preview__about-text-input:focus {
  border-color: var(--color-text);
  outline: none;
}

.admin-home-preview__about-image-wrap {
  width: 100%;
}

.admin-home-preview__about-image-wrap :deep(.admin-home-img-slot__hit:not(:has(.admin-home-img-slot__photo))) {
  aspect-ratio: 4 / 5;
  min-height: 240px;
}

@media (min-width: 641px) {
  .admin-home-preview__hero-inner {
    max-width: none;
    width: 100%;
  }

  .admin-home-preview__section-title {
    margin-top: 0;
  }

  .admin-home-preview__about-inner {
    max-width: none;
    width: 50vw;
  }
}

@media (max-width: 640px) {
  .admin-home-preview__hero,
  .admin-home-preview__featured,
  .admin-home-preview__about {
    padding-left: var(--space-md);
    padding-right: var(--space-md);
  }

  .admin-home-preview__hero-image-wrap :deep(.admin-home-img-slot__hit:not(:has(.admin-home-img-slot__photo))) {
    aspect-ratio: 4 / 3;
  }

  .admin-home-preview__about-grid {
    grid-template-columns: 1fr;
    gap: var(--space-xl);
  }

  .admin-home-preview__about-inner {
    padding-top: var(--space-lg);
  }
}
</style>
