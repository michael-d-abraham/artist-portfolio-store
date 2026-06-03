<template>
  <div class="admin-page">
    <header class="admin-page__header">
      <div class="admin-page__intro">
        <h1 class="page-title admin-page__title">Admin</h1>
        <p class="admin-page__lead">Manage gallery listings and shop settings.</p>
      </div>
      <nav class="admin-page__toolbar" aria-label="Admin actions">
        <router-link to="/admin/new" class="admin-page__toolbar-btn admin-page__toolbar-btn--primary">
          New listing
        </router-link>
        <router-link to="/admin/social-links" class="admin-page__toolbar-btn">
          Links
        </router-link>
        <router-link to="/admin/display-pictures" class="admin-page__toolbar-btn">
          Display Pictures
        </router-link>
        <router-link to="/admin/instagram-ai" class="admin-page__toolbar-btn">
          Captions
        </router-link>
        <button type="button" class="admin-page__toolbar-btn admin-page__toolbar-btn--ghost" @click="onLogout">
          Log out
        </button>
      </nav>
    </header>

    <section class="admin-page__section" aria-labelledby="listings-heading">
      <h2 id="listings-heading" class="admin-page__section-title">Listings</h2>

      <p v-if="loading" class="admin-page__status">Loading…</p>
      <p v-else-if="error" class="error admin-page__status">{{ error }}</p>
      <p v-else-if="!items.length" class="admin-page__status admin-page__empty">
        No products yet.
        <router-link to="/admin/new">Create your first listing</router-link>
      </p>

      <template v-else>
        <!-- Desktop table -->
        <div class="admin-page__table-wrap">
          <table class="table admin-table">
            <thead>
              <tr>
                <th class="admin-table__th-image">Image</th>
                <th>Title</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in items" :key="p._id">
                <td class="admin-table__image-cell">
                  <div class="admin-thumb" aria-hidden="true">
                    <img
                      v-if="thumbUrl(p)"
                      class="admin-thumb__img"
                      :src="thumbUrl(p)"
                      :alt="thumbAlt(p)"
                      width="48"
                      height="48"
                      loading="lazy"
                    />
                    <span v-else class="admin-thumb__placeholder">—</span>
                  </div>
                </td>
                <td class="admin-table__title">{{ p.title }}</td>
                <td>${{ formatPrice(p.price_cents) }}</td>
                <td>{{ p.quantity_available ?? '—' }}</td>
                <td>
                  <span
                    class="admin-badge"
                    :class="p.is_active ? 'admin-badge--on' : 'admin-badge--off'"
                  >
                    {{ statusLabel(p) }}
                  </span>
                </td>
                <td>
                  <div class="admin-table__actions">
                    <router-link :to="'/admin/edit/' + p._id" class="admin-action-link">Edit</router-link>
                    <button type="button" class="admin-action-btn" @click="onToggle(p)">
                      {{ toggleLabel(p) }}
                    </button>
                    <button type="button" class="admin-action-btn admin-action-btn--danger" @click="onDelete(p)">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile cards -->
        <ul class="admin-cards">
          <li v-for="p in items" :key="p._id" class="admin-card">
            <div class="admin-card__head">
              <div class="admin-card__identity">
                <div class="admin-thumb admin-thumb--card" aria-hidden="true">
                  <img
                    v-if="thumbUrl(p)"
                    class="admin-thumb__img"
                    :src="thumbUrl(p)"
                    :alt="thumbAlt(p)"
                    width="56"
                    height="56"
                    loading="lazy"
                  />
                  <span v-else class="admin-thumb__placeholder">—</span>
                </div>
                <h3 class="admin-card__title">{{ p.title }}</h3>
              </div>
              <span
                class="admin-badge"
                :class="p.is_active ? 'admin-badge--on' : 'admin-badge--off'"
              >
                {{ statusLabel(p) }}
              </span>
            </div>
            <dl class="admin-card__meta">
              <div class="admin-card__row">
                <dt>Price</dt>
                <dd>${{ formatPrice(p.price_cents) }}</dd>
              </div>
              <div class="admin-card__row">
                <dt>Stock</dt>
                <dd>{{ p.quantity_available ?? '—' }}</dd>
              </div>
            </dl>
            <div class="admin-card__actions">
              <router-link :to="'/admin/edit/' + p._id" class="admin-card__btn admin-card__btn--primary">
                Edit
              </router-link>
              <button type="button" class="admin-card__btn" @click="onToggle(p)">
                {{ toggleLabel(p) }}
              </button>
              <button type="button" class="admin-card__btn admin-card__btn--danger" @click="onDelete(p)">
                Delete
              </button>
            </div>
          </li>
        </ul>
      </template>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  getAdminProducts,
  deleteAdminProduct,
  toggleAdminProductActive,
  logoutAdmin
} from '../services/api.js';
import {
  formatUsdFromCents,
  primaryProductImageUrl,
  productTitle
} from '../utils/storefrontProduct.js';

const router = useRouter();

const items = ref([]);
const loading = ref(true);
const error = ref('');

function formatPrice(cents) {
  return formatUsdFromCents(cents);
}

function thumbUrl(product) {
  return primaryProductImageUrl(product);
}

function thumbAlt(product) {
  const primary = product?.product_images?.find((i) => i?.is_primary) || product?.product_images?.[0];
  return primary?.alt_text || productTitle(product);
}

function statusLabel(product) {
  return product.is_active ? 'Active' : 'Non Active';
}

function toggleLabel(product) {
  return product.is_active ? 'Disabled' : 'Enabled';
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

onMounted(load);

async function onLogout() {
  try {
    await logoutAdmin();
  } catch {
    /* still send user to login */
  }
  router.replace({ name: 'admin-login' });
}

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

<style scoped>
.admin-page {
  width: 100%;
  max-width: 100%;
  padding-bottom: var(--space-2xl);
  box-sizing: border-box;
}

.admin-page__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid var(--color-border);
}

.admin-page__title {
  margin: 0 0 var(--space-xs);
  text-align: left;
}

.admin-page__lead {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.5;
  color: var(--color-text-muted);
  font-weight: 400;
  max-width: 36rem;
}

.admin-page__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  align-items: center;
}

.admin-page__toolbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0.6rem 1rem;
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  box-shadow: none;
  cursor: pointer;
  box-sizing: border-box;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.admin-page__toolbar-btn:hover {
  background: var(--color-text);
  color: var(--color-surface);
  opacity: 1;
}

.admin-page__toolbar-btn--primary {
  background: var(--color-text);
  color: var(--color-surface);
  border-color: var(--color-text);
}

.admin-page__toolbar-btn--primary:hover {
  background: #333;
  border-color: #333;
  color: var(--color-surface);
}

.admin-page__toolbar-btn--ghost {
  margin-left: auto;
  background: transparent;
  border-color: var(--color-border);
  color: var(--color-text-muted);
}

.admin-page__toolbar-btn--ghost:hover {
  color: var(--color-text);
  background: var(--color-surface);
  border-color: var(--color-text);
}

.admin-page__section-title {
  margin: 0 0 var(--space-md);
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.admin-page__status {
  margin: 0;
  color: var(--color-text-muted);
}

.admin-page__empty a {
  margin-left: 0.35rem;
}

.admin-page__table-wrap {
  display: none;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.admin-table {
  margin-top: 0;
}

.admin-table__th-image {
  width: 4rem;
}

.admin-table__image-cell {
  width: 4rem;
  padding-right: 0.5rem;
  vertical-align: middle;
}

.admin-thumb {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-product-image-bg);
  border: 1px solid var(--color-border);
  box-sizing: border-box;
}

.admin-thumb--card {
  width: 56px;
  height: 56px;
}

.admin-thumb__img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  object-position: center;
  display: block;
}

.admin-thumb__placeholder {
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  letter-spacing: 0.04em;
}

.admin-table__title {
  font-weight: 500;
  max-width: 16rem;
}

.admin-table__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  align-items: center;
}

.admin-action-link {
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-decoration: underline;
  text-underline-offset: 0.2em;
  color: var(--color-text);
}

.admin-action-link:hover {
  opacity: 0.55;
}

.admin-action-btn {
  min-height: 36px;
  padding: 0.4rem 0.65rem;
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border: 1px solid var(--color-border-strong);
  background: var(--color-surface);
  box-shadow: none;
}

.admin-action-btn--danger {
  color: var(--color-text-muted);
  border-color: var(--color-border);
}

.admin-action-btn--danger:hover:not(:disabled) {
  color: var(--color-text);
  border-color: var(--color-text);
  background: var(--color-surface);
}

.admin-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border: 1px solid var(--color-border);
}

.admin-badge--on {
  background: var(--color-text);
  color: var(--color-surface);
  border-color: var(--color-text);
}

.admin-badge--off {
  background: var(--color-surface);
  color: var(--color-text-muted);
}

.admin-cards {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.admin-card {
  padding: var(--space-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

.admin-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.admin-card__identity {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex: 1;
  min-width: 0;
}

.admin-card__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.35;
  flex: 1;
  min-width: 0;
  word-break: break-word;
}

.admin-card__meta {
  margin: 0 0 var(--space-md);
  padding: 0;
}

.admin-card__row {
  display: grid;
  grid-template-columns: 4.5rem 1fr;
  gap: var(--space-sm);
  margin-bottom: 0.35rem;
  font-size: 0.9375rem;
}

.admin-card__row dt {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.admin-card__row dd {
  margin: 0;
  word-break: break-word;
}

.admin-card__row code {
  font-size: 0.875em;
}

.admin-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.admin-card__btn {
  flex: 1 1 auto;
  min-width: calc(50% - var(--space-sm) / 2);
  min-height: 44px;
  padding: 0.55rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-align: center;
  text-decoration: none;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  box-shadow: none;
  box-sizing: border-box;
  cursor: pointer;
}

.admin-card__btn--primary {
  background: var(--color-text);
  color: var(--color-surface);
  border-color: var(--color-text);
}

.admin-card__btn--primary:hover {
  opacity: 1;
  background: #333;
  border-color: #333;
}

.admin-card__btn--danger {
  border-color: var(--color-border);
  color: var(--color-text-muted);
}

@media (min-width: 768px) {
  .admin-page__header {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }

  .admin-page__toolbar-btn--ghost {
    margin-left: auto;
  }

  .admin-page__table-wrap {
    display: block;
  }

  .admin-cards {
    display: none;
  }
}

@media (max-width: 767px) {
  .admin-page__toolbar {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-auto-rows: 1fr;
    gap: var(--space-sm);
    width: 100%;
  }

  .admin-page__toolbar-btn {
    width: 100%;
    min-height: 48px;
    height: 100%;
    padding: 0.5rem 0.65rem;
    line-height: 1.25;
    text-align: center;
    white-space: normal;
  }

  .admin-page__toolbar-btn--ghost {
    grid-column: 1 / -1;
    margin-left: 0;
    min-height: 48px;
    height: auto;
  }

  .admin-card__actions {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-sm);
  }

  .admin-card__btn {
    flex: none;
    min-width: 0;
    width: 100%;
    min-height: 48px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 0.4rem;
    line-height: 1.25;
  }
}

@media (max-width: 640px) {
  .admin-page__title {
    font-size: clamp(1.125rem, 2.5vw, 1.5rem);
  }
}
</style>
