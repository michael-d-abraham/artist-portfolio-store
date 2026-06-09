<template>
  <article class="admin-home-featured-slot">
    <label class="admin-home-featured-slot__pick">
      <span class="admin-home-featured-slot__pick-label">
        Listing {{ slotNumber }}
        <span v-if="mobileOnly" class="admin-home-featured-slot__badge">Mobile</span>
      </span>
      <select
        :value="productId"
        class="admin-home-featured-slot__select"
        :disabled="disabled"
        :aria-label="`Choose listing for featured slot ${slotNumber}`"
        @change="onSelectChange"
      >
        <option value="">— Choose a listing —</option>
        <option
          v-for="p in catalogProducts"
          :key="p._id"
          :value="p._id"
          :disabled="isTakenElsewhere(p._id)"
        >
          {{ optionLabel(p) }}
        </option>
      </select>
    </label>

    <GalleryProductCard
      v-if="selectedProduct"
      :product="selectedProduct"
      preview-only
    />

    <p v-else class="admin-home-featured-slot__empty">
      Select a listing to preview the same card as the gallery.
    </p>
  </article>
</template>

<script setup>
import { computed } from 'vue';
import {
  displayProductName,
  formatUsdFromCents
} from '../../utils/storefrontProduct.js';
import GalleryProductCard from '../product/GalleryProductCard.vue';

const props = defineProps({
  productId: { type: String, default: '' },
  slotNumber: { type: Number, required: true },
  mobileOnly: { type: Boolean, default: false },
  catalogProducts: { type: Array, default: () => [] },
  takenProductIds: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false }
});

const emit = defineEmits(['update:productId']);

const selectedProduct = computed(() => {
  if (!props.productId) return null;
  return props.catalogProducts.find((p) => String(p._id) === String(props.productId)) || null;
});

function optionLabel(product) {
  const price = `$${formatUsdFromCents(product.price_cents)}`;
  return `${displayProductName(product)} (${price})`;
}

function isTakenElsewhere(id) {
  const sid = String(id);
  return props.takenProductIds.includes(sid) && sid !== String(props.productId);
}

function onSelectChange(event) {
  emit('update:productId', event.target.value);
}
</script>

<style scoped>
.admin-home-featured-slot {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  min-width: 0;
  margin: 0;
  padding: var(--space-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-sizing: border-box;
}

.admin-home-featured-slot__pick {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-width: 0;
}

.admin-home-featured-slot__pick-label {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-xs);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
}

.admin-home-featured-slot__badge {
  padding: 0.1rem 0.35rem;
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
}

.admin-home-featured-slot__select {
  width: 100%;
  min-width: 0;
  font-size: 0.875rem;
  text-transform: none;
  letter-spacing: 0.02em;
}

.admin-home-featured-slot__empty {
  margin: 0;
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-md);
  text-align: center;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--color-text-muted);
  border: 1px dashed var(--color-border);
  background: var(--color-bg);
  box-sizing: border-box;
}

.admin-home-featured-slot :deep(.product-card) {
  width: 100%;
  min-width: 0;
  min-height: 0;
  max-width: none;
  margin: 0;
}

.admin-home-featured-slot :deep(.product-image-link) {
  height: auto;
  min-height: 150px;
}

.admin-home-featured-slot :deep(.product-image-frame) {
  width: 100%;
  max-width: 120px;
  height: auto;
  min-height: 120px;
}

.admin-home-featured-slot :deep(.product-image) {
  max-width: 120px;
  max-height: 150px;
}

.admin-home-featured-slot :deep(.product-title) {
  max-width: 100%;
  min-height: 0;
  font-size: 0.875rem;
}

.admin-home-featured-slot :deep(.product-price) {
  font-size: 0.875rem;
}

.admin-home-featured-slot :deep(.add-to-cart-button) {
  height: 36px;
  font-size: 0.875rem;
}
</style>
