<template>
  <div class="admin-page admin-listings">
    <header class="admin-page-header">
      <h1 class="admin-page-header__title">Listing</h1>
      <router-link to="/admin/new" class="admin-page-header__btn admin-page-header__btn--primary">
        New listing
      </router-link>
    </header>

    <p v-if="loading" class="admin-page-header__status">Loading…</p>
    <p v-else-if="error" class="error admin-page-header__status">{{ error }}</p>
    <p v-else-if="!items.length" class="admin-float admin-float--padded admin-page-empty">
      No products yet.
      <router-link to="/admin/new">Create your first listing</router-link>
    </p>

    <template v-else>
      <AdminListSortBar
        v-model="sortBy"
        select-id="listings-sort"
        :options="LISTING_SORT_OPTIONS"
      />

      <ul class="admin-mobile-cards" aria-label="Listings">
        <li v-for="p in sortedItems" :key="'m-' + p._id" class="admin-mobile-card admin-mobile-card--listing">
          <div class="admin-mobile-card__corner">
            <span
              class="admin-status-pill admin-mobile-card__status"
              :class="p.is_active ? 'admin-status-pill--active' : 'admin-status-pill--inactive'"
            >
              {{ statusLabel(p) }}
            </span>
            <AdminListingActionsMenu
              :product-id="p._id"
              :title="p.title"
              :is-active="p.is_active"
              :open="openMenuId === p._id"
              @toggle="toggleMenu(p._id)"
              @close="closeMenu"
              @toggle-active="onToggle(p)"
              @delete="onDelete(p)"
            />
          </div>
          <h3 class="admin-mobile-card__title">{{ p.title }}</h3>
          <div class="admin-mobile-card__body">
            <div class="admin-mobile-card__media" aria-hidden="true">
              <div class="admin-data-table__thumb admin-data-table__thumb--lg">
                <img
                  v-if="thumbUrl(p)"
                  :src="thumbUrl(p)"
                  :alt="thumbAlt(p)"
                  width="56"
                  height="56"
                  loading="lazy"
                />
                <span v-else class="admin-data-table__thumb-placeholder">—</span>
              </div>
            </div>
            <dl class="admin-mobile-card__meta admin-mobile-card__meta--stats-row">
            <div class="admin-mobile-card__stat">
              <dt>Price</dt>
              <dd>{{ formatPrice(p.price_cents) }}</dd>
            </div>
            <div class="admin-mobile-card__stat">
              <dt>Stock</dt>
              <dd>{{ p.quantity_available ?? '—' }}</dd>
            </div>
            </dl>
          </div>
        </li>
      </ul>

      <div class="admin-float admin-float--table admin-float--desktop-only">
      <div class="admin-panel__table-wrap admin-panel__table-wrap--desktop">
        <table class="admin-data-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Title</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th class="admin-data-table__actions-cell"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in sortedItems" :key="p._id">
              <td>
                <div class="admin-data-table__thumb" aria-hidden="true">
                  <img
                    v-if="thumbUrl(p)"
                    :src="thumbUrl(p)"
                    :alt="thumbAlt(p)"
                    width="48"
                    height="48"
                    loading="lazy"
                  />
                  <span v-else class="admin-data-table__thumb-placeholder">—</span>
                </div>
              </td>
              <td class="admin-data-table__title-cell">{{ p.title }}</td>
              <td class="admin-data-table__cell--nowrap">{{ formatPrice(p.price_cents) }}</td>
              <td>{{ p.quantity_available ?? '—' }}</td>
              <td>
                <span
                  class="admin-status-pill"
                  :class="p.is_active ? 'admin-status-pill--active' : 'admin-status-pill--inactive'"
                >
                  {{ statusLabel(p) }}
                </span>
              </td>
              <td class="admin-data-table__actions-cell">
                <AdminListingActionsMenu
                  :product-id="p._id"
                  :title="p.title"
                  :is-active="p.is_active"
                  :open="openMenuId === p._id"
                  @toggle="toggleMenu(p._id)"
                  @close="closeMenu"
                  @toggle-active="onToggle(p)"
                  @delete="onDelete(p)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  getAdminProducts,
  deleteAdminProduct,
  toggleAdminProductActive
} from '../../services/api.js';
import { formatMoneyFromCents } from '../../utils/money.js';
import {
  primaryProductImageUrl,
  productTitle
} from '../../utils/storefrontProduct.js';
import { LISTING_SORT_OPTIONS, sortProducts } from '../../utils/adminListSort.js';
import AdminListingActionsMenu from '../../components/admin/AdminListingActionsMenu.vue';
import AdminListSortBar from '../../components/admin/AdminListSortBar.vue';

const items = ref([]);
const sortBy = ref('newest');
const loading = ref(true);
const error = ref('');
const openMenuId = ref(null);

const sortedItems = computed(() => sortProducts(items.value, sortBy.value));

function formatPrice(cents) {
  return formatMoneyFromCents(cents, 'usd');
}

function thumbUrl(product) {
  return primaryProductImageUrl(product);
}

function thumbAlt(product) {
  const primary = product?.product_images?.find((i) => i?.is_primary) || product?.product_images?.[0];
  return primary?.alt_text || productTitle(product);
}

function statusLabel(product) {
  return product.is_active ? 'Active' : 'Inactive';
}

function toggleMenu(id) {
  openMenuId.value = openMenuId.value === id ? null : id;
}

function closeMenu() {
  openMenuId.value = null;
}

function onDocumentClick() {
  closeMenu();
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    items.value = await getAdminProducts();
  } catch (e) {
    error.value = e.message || 'Failed to load';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  load();
  document.addEventListener('click', onDocumentClick);
});

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick);
});

async function onToggle(p) {
  try {
    await toggleAdminProductActive(p._id);
    await load();
  } catch (e) {
    alert(e.message || 'Could not update listing status');
  }
}

async function onDelete(p) {
  if (!window.confirm(`Delete "${p.title}"? (soft-delete — hidden from shop)`)) return;
  try {
    await deleteAdminProduct(p._id);
    await load();
  } catch (e) {
    alert(e.message || 'Delete failed');
  }
}
</script>
