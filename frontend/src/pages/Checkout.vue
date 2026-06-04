<template>
  <div class="checkout-page">
    <h1 class="page-title">Order preview</h1>
    <p class="lead text-muted">
      Review your order here. Once you continue to payment, the order is final on Stripe’s hosted checkout page.
    </p>

    <p v-if="loading">Loading…</p>
    <p v-else-if="loadError" class="error">{{ loadError }}</p>
    <p v-else-if="!previewLines.length" class="empty">
      Your cart is empty.
      <router-link to="/gallery">Browse prints</router-link>
    </p>

    <template v-else>
      <ul class="preview-list">
        <li v-for="line in previewLines" :key="line.productId" class="preview-item">
          <img
            v-if="line.imageUrl"
            class="preview-img"
            :src="line.imageUrl"
            :alt="line.title"
          />
          <div v-else class="preview-img placeholder">No image</div>
          <div class="preview-body">
            <h2 class="preview-title">{{ line.title }}</h2>
            <p v-if="line.sizeLabel" class="preview-meta">Size: {{ line.sizeLabel }}</p>
            <p class="preview-price">${{ formatUsdFromCents(line.unitPriceCents) }}</p>
            <div class="qty-row">
              <label :for="'qty-' + line.productId">Qty</label>
              <input
                :id="'qty-' + line.productId"
                type="number"
                min="1"
                :max="line.maxQty"
                :value="line.quantity"
                @change="onQtyChange(line, $event)"
              />
              <button type="button" class="btn-ghost" @click="removeLine(line.productId)">Remove</button>
            </div>
          </div>
          <p class="line-total">${{ formatUsdFromCents(line.lineTotalCents) }}</p>
        </li>
      </ul>

      <div class="summary">
        <p class="summary-total">
          <span>Estimated total</span>
          <strong>${{ formatUsdFromCents(estimatedTotalCents) }}</strong>
        </p>
        <p class="help">Final total may include tax or shipping on Stripe.</p>
      </div>

      <p v-if="checkoutError" class="error">{{ checkoutError }}</p>
      <button
        type="button"
        class="btn-primary checkout-btn"
        :disabled="checkingOut"
        @click="onCheckout"
      >
        {{ checkingOut ? 'Redirecting…' : 'Checkout' }}
      </button>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getProducts, createCheckoutSession } from '../services/api.js';
import {
  getCart,
  setCartQuantity,
  removeFromCart,
  getCheckoutItems
} from '../utils/cart.js';
import {
  displayProductName,
  formatUsdFromCents,
  primaryProductImageUrl
} from '../utils/storefrontProduct.js';

const loading = ref(true);
const loadError = ref('');
const productsById = ref(new Map());
const cartLines = ref(getCart());
const checkoutError = ref('');
const checkingOut = ref(false);

const previewLines = computed(() => {
  return cartLines.value
    .map((line) => {
      const product = productsById.value.get(line.productId);
      if (!product) {
        return null;
      }
      const unitPriceCents = product.price_cents;
      return {
        productId: line.productId,
        title: displayProductName(product),
        sizeLabel: product.size_label || '',
        imageUrl: primaryProductImageUrl(product),
        unitPriceCents,
        quantity: line.quantity,
        lineTotalCents: unitPriceCents * line.quantity,
        maxQty: Math.max(1, product.quantity_available ?? 99)
      };
    })
    .filter(Boolean);
});

const estimatedTotalCents = computed(() =>
  previewLines.value.reduce((sum, line) => sum + line.lineTotalCents, 0)
);

function refreshCart() {
  cartLines.value = getCart();
}

function onQtyChange(line, event) {
  const next = Number(event.target.value);
  setCartQuantity(line.productId, next);
  refreshCart();
}

function removeLine(productId) {
  removeFromCart(productId);
  refreshCart();
}

async function loadProducts() {
  loading.value = true;
  loadError.value = '';
  try {
    const list = await getProducts();
    const map = new Map();
    list.forEach((p) => map.set(String(p._id), p));
    productsById.value = map;
  } catch (e) {
    loadError.value = e.message || 'Failed to load products';
  } finally {
    loading.value = false;
  }
}

async function onCheckout() {
  checkoutError.value = '';
  const items = getCheckoutItems();
  if (!items.length) {
    checkoutError.value = 'Your cart is empty.';
    return;
  }
  checkingOut.value = true;
  try {
    const { url } = await createCheckoutSession({ items });
    if (!url) {
      checkoutError.value = 'No checkout URL returned.';
      return;
    }
    window.location.href = url;
  } catch (e) {
    checkoutError.value = e.message || 'Could not start checkout';
  } finally {
    checkingOut.value = false;
  }
}

onMounted(loadProducts);
</script>

<style scoped>
.checkout-page {
  max-width: 40rem;
  margin: 0 auto;
  padding-bottom: var(--space-3xl);
}

.checkout-page .page-title {
  text-align: center;
  margin-bottom: var(--space-xl);
}

.lead {
  margin: 0 0 var(--space-lg);
  line-height: 1.55;
}

.empty {
  color: var(--color-text-muted);
}

.preview-list {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--space-lg);
}

.preview-item {
  display: grid;
  grid-template-columns: 5rem 1fr auto;
  gap: var(--space-md);
  align-items: start;
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--color-border);
}

.preview-img {
  width: 5rem;
  height: 5rem;
  object-fit: contain;
  border: none;
  background: var(--color-product-image-bg);
}

.preview-img.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.preview-title {
  margin: 0 0 var(--space-xs);
  font-size: 0.875rem;
  font-weight: 400;
  letter-spacing: 0.02em;
}

.preview-meta,
.preview-price {
  margin: 0 0 var(--space-xs);
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.qty-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

.qty-row input {
  width: 4rem;
}

.line-total {
  font-weight: 600;
  margin: 0;
}

.summary {
  margin-bottom: var(--space-lg);
}

.summary-total {
  display: flex;
  justify-content: space-between;
  font-size: 1.0625rem;
  margin: 0 0 var(--space-xs);
}

.help {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.checkout-btn {
  width: 100%;
  padding: 0.85rem 1rem;
  font-size: 1rem;
}

@media (max-width: 640px) {
  .checkout-page {
    max-width: 100%;
  }

  .preview-item {
    grid-template-columns: 4.5rem 1fr;
    grid-template-rows: auto auto;
    gap: var(--space-sm) var(--space-md);
  }

  .line-total {
    grid-column: 1 / -1;
    text-align: right;
    padding-top: var(--space-xs);
  }

  .qty-row {
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  .qty-row input {
    width: 4.5rem;
    min-height: 44px;
  }

  .qty-row .btn-ghost {
    min-height: 44px;
    padding: 0.65rem 1rem;
  }

  .checkout-btn {
    min-height: 48px;
    font-size: 1rem;
  }
}
</style>
